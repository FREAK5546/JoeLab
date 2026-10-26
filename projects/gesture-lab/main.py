"""
Gesture Lab - webcam computer vision playground (OpenCV + MediaPipe)

Modes (press the number key to switch):
  1  Air Draw       index finger = draw, index+middle = hover / pick colour
  2  Finger Counter shows how many fingers you hold up
  3  Virtual Mouse  index finger moves cursor, thumb+middle pinch = click
  4  Colour Tracker click an object in the window to track its colour

Other keys:  c = clear canvas / trail   s = save screenshot   q or Esc = quit
"""

import math
import os
import sys
import time
import urllib.request
from collections import deque

import cv2
import numpy as np

try:
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision
except ImportError:
    print("MediaPipe is missing. Use Python 3.9-3.12 and run:")
    print("  pip install -r requirements.txt")
    sys.exit(1)

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hand_landmarker.task")
MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/latest/hand_landmarker.task"
)

HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (5, 9), (9, 10), (10, 11), (11, 12),
    (9, 13), (13, 14), (14, 15), (15, 16),
    (13, 17), (17, 18), (18, 19), (19, 20),
    (0, 17),
]


def ensure_model():
    """Download the hand model next to main.py the first time."""
    if os.path.exists(MODEL_PATH) and os.path.getsize(MODEL_PATH) > 1_000_000:
        return
    print("Downloading the hand model (about 8 MB, one time only)...")
    part = MODEL_PATH + ".part"
    for attempt in range(1, 6):
        try:
            with urllib.request.urlopen(MODEL_URL, timeout=60) as r, open(part, "wb") as f:
                while True:
                    chunk = r.read(1 << 16)
                    if not chunk:
                        break
                    f.write(chunk)
            os.replace(part, MODEL_PATH)
            print("Model saved.")
            return
        except Exception as e:  # network hiccup: try again
            print(f"  attempt {attempt} failed: {e}")
            time.sleep(2)
    print("Could not download the model. Download it manually from:")
    print("  " + MODEL_URL)
    print("and save it next to main.py as hand_landmarker.task")
    sys.exit(1)


def draw_hand(frame, lm):
    h, w = frame.shape[:2]
    pts = [(int(p.x * w), int(p.y * h)) for p in lm]
    for a, b in HAND_CONNECTIONS:
        cv2.line(frame, pts[a], pts[b], (0, 255, 120), 2)
    for p in pts:
        cv2.circle(frame, p, 4, (255, 255, 255), -1)

try:
    import pyautogui
    pyautogui.FAILSAFE = False
    pyautogui.PAUSE = 0
    HAS_PYAUTOGUI = True
except ImportError:
    HAS_PYAUTOGUI = False

WIN = "Gesture Lab"
MODES = {1: "Air Draw", 2: "Finger Counter", 3: "Virtual Mouse", 4: "Colour Tracker"}

PALETTE = [
    ("Red", (0, 0, 255)),
    ("Green", (0, 200, 0)),
    ("Blue", (255, 100, 0)),
    ("Yellow", (0, 230, 255)),
    ("Eraser", (0, 0, 0)),
]
PALETTE_H = 80


# ----------------------------------------------------------------- helpers
def fingers_up(lm, hand_label):
    """Return [thumb, index, middle, ring, pinky] as booleans."""
    up = []
    # Frame is mirrored, so "Right" means the user's right hand.
    if hand_label == "Right":
        up.append(lm[4].x < lm[3].x)
    else:
        up.append(lm[4].x > lm[3].x)
    for tip in (8, 12, 16, 20):
        up.append(lm[tip].y < lm[tip - 2].y)
    return up


def dist(lm, a, b, w, h):
    return math.hypot((lm[a].x - lm[b].x) * w, (lm[a].y - lm[b].y) * h)


def put_text(img, text, org, scale=0.8, color=(255, 255, 255), thick=2):
    cv2.putText(img, text, org, cv2.FONT_HERSHEY_SIMPLEX, scale, (0, 0, 0), thick + 3, cv2.LINE_AA)
    cv2.putText(img, text, org, cv2.FONT_HERSHEY_SIMPLEX, scale, color, thick, cv2.LINE_AA)


# ------------------------------------------------------------------- state
class State:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.mode = 1
        # air draw
        self.canvas = np.zeros((h, w, 3), np.uint8)
        self.color_idx = 0
        self.prev_pt = None
        self.smooth_pt = None
        # mouse
        self.mouse_prev = None
        self.last_click = 0.0
        # colour tracker
        self.click_pt = None
        self.target_hsv = None
        self.trail = deque(maxlen=48)

    def clear(self):
        self.canvas[:] = 0
        self.trail.clear()
        self.prev_pt = None


# -------------------------------------------------------------------- modes
def air_draw(frame, st, lm, label):
    w, h = st.w, st.h
    # palette bar
    bw = w // len(PALETTE)
    for i, (name, col) in enumerate(PALETTE):
        x0 = i * bw
        cv2.rectangle(frame, (x0, 0), (x0 + bw, PALETTE_H), col if name != "Eraser" else (60, 60, 60), -1)
        if i == st.color_idx:
            cv2.rectangle(frame, (x0, 0), (x0 + bw, PALETTE_H), (255, 255, 255), 4)
        put_text(frame, name, (x0 + 15, 50), 0.8)

    if lm:
        up = fingers_up(lm, label)
        x = int(lm[8].x * w)
        y = int(lm[8].y * h)
        # smooth the fingertip a little
        if st.smooth_pt is None:
            st.smooth_pt = (x, y)
        else:
            sx, sy = st.smooth_pt
            st.smooth_pt = (int(sx + (x - sx) * 0.5), int(sy + (y - sy) * 0.5))
        pt = st.smooth_pt

        if up[1] and up[2] and not up[3] and not up[4]:
            # selection mode
            st.prev_pt = None
            cv2.circle(frame, pt, 18, (255, 255, 255), 2)
            if pt[1] < PALETTE_H:
                st.color_idx = min(pt[0] // bw, len(PALETTE) - 1)
        elif up[1] and not up[2] and not up[3] and not up[4]:
            # draw mode
            name, col = PALETTE[st.color_idx]
            thick = 60 if name == "Eraser" else 8
            cv2.circle(frame, pt, thick // 2 + 4, col if name != "Eraser" else (200, 200, 200), -1 if name != "Eraser" else 2)
            if st.prev_pt is not None:
                cv2.line(st.canvas, st.prev_pt, pt, col, thick)
            st.prev_pt = pt
        else:
            st.prev_pt = None
    else:
        st.prev_pt = None
        st.smooth_pt = None

    # overlay canvas
    mask = cv2.cvtColor(st.canvas, cv2.COLOR_BGR2GRAY) > 0
    frame[mask] = st.canvas[mask]
    put_text(frame, "1 finger: draw | 2 fingers: pick colour | c: clear", (10, h - 20), 0.6)


def finger_counter(frame, st, lm, label):
    if lm:
        up = fingers_up(lm, label)
        n = sum(up)
        put_text(frame, str(n), (40, 160), 5, (0, 255, 120), 10)
        names = ["Thumb", "Index", "Middle", "Ring", "Pinky"]
        for i, (nm, u) in enumerate(zip(names, up)):
            put_text(frame, nm, (st.w - 180, 50 + i * 40), 0.8, (0, 255, 0) if u else (90, 90, 255))
    else:
        put_text(frame, "Show your hand", (40, 100), 1.2)


def virtual_mouse(frame, st, lm, label):
    w, h = st.w, st.h
    margin = 120
    cv2.rectangle(frame, (margin, margin), (w - margin, h - margin), (255, 0, 255), 2)
    if not HAS_PYAUTOGUI:
        put_text(frame, "pip install pyautogui to enable mouse control", (20, 60), 0.8, (80, 80, 255))
        return
    if not lm:
        st.mouse_prev = None
        return
    screen_w, screen_h = pyautogui.size()
    x = lm[8].x * w
    y = lm[8].y * h
    tx = np.interp(x, (margin, w - margin), (0, screen_w - 1))
    ty = np.interp(y, (margin, h - margin), (0, screen_h - 1))
    if st.mouse_prev is None:
        cur = (tx, ty)
    else:
        px, py = st.mouse_prev
        cur = (px + (tx - px) / 5, py + (ty - py) / 5)  # smoothing
    st.mouse_prev = cur
    pyautogui.moveTo(cur[0], cur[1])
    cv2.circle(frame, (int(x), int(y)), 14, (255, 0, 255), -1)

    # click = pinch thumb tip and middle fingertip
    d = dist(lm, 4, 12, w, h)
    pinching = d < 40
    if pinching:
        cv2.circle(frame, (int(lm[12].x * w), int(lm[12].y * h)), 18, (0, 255, 0), -1)
        now = time.time()
        if now - st.last_click > 0.5:
            pyautogui.click()
            st.last_click = now
    put_text(frame, "Index = move | thumb+middle pinch = click", (10, h - 20), 0.6)


def colour_tracker(frame, st):
    w, h = st.w, st.h
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    if st.click_pt is not None:
        x, y = st.click_pt
        patch = hsv[max(0, y - 4): y + 5, max(0, x - 4): x + 5].reshape(-1, 3)
        st.target_hsv = np.median(patch, axis=0).astype(int)
        st.click_pt = None
        st.trail.clear()

    if st.target_hsv is None:
        put_text(frame, "Click an object in this window to track it", (20, 50), 0.8)
        return

    hh, ss, vv = st.target_hsv
    lower = np.array([max(0, hh - 10), max(60, ss - 70), max(50, vv - 70)])
    upper = np.array([min(179, hh + 10), 255, 255])
    mask = cv2.inRange(hsv, lower, upper)
    mask = cv2.erode(mask, None, iterations=2)
    mask = cv2.dilate(mask, None, iterations=3)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        c = max(contours, key=cv2.contourArea)
        if cv2.contourArea(c) > 600:
            (cx, cy), r = cv2.minEnclosingCircle(c)
            cv2.circle(frame, (int(cx), int(cy)), int(r), (0, 255, 255), 3)
            st.trail.appendleft((int(cx), int(cy)))
    for i in range(1, len(st.trail)):
        thick = max(1, int(10 * (1 - i / len(st.trail))))
        cv2.line(frame, st.trail[i - 1], st.trail[i], (0, 200, 255), thick)

    small = cv2.resize(mask, (w // 5, h // 5))
    frame[h - small.shape[0]:, w - small.shape[1]:] = cv2.cvtColor(small, cv2.COLOR_GRAY2BGR)
    put_text(frame, "Click another object to retarget | c: clear trail", (10, h - 20), 0.6)


# --------------------------------------------------------------------- main
def main():
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    if not cap.isOpened():
        print("Could not open the webcam. Close other apps using it and try again.")
        return

    ok, frame = cap.read()
    if not ok:
        print("Webcam opened but returned no frames.")
        return
    h, w = frame.shape[:2]
    st = State(w, h)

    def on_mouse(event, x, y, flags, param):
        if event == cv2.EVENT_LBUTTONDOWN and st.mode == 4:
            st.click_pt = (x, y)

    cv2.namedWindow(WIN)
    cv2.setMouseCallback(WIN, on_mouse)

    ensure_model()
    landmarker = vision.HandLandmarker.create_from_options(
        vision.HandLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=MODEL_PATH),
            running_mode=vision.RunningMode.VIDEO,
            num_hands=1,
            min_hand_detection_confidence=0.7,
            min_hand_presence_confidence=0.6,
            min_tracking_confidence=0.6,
        )
    )
    start_ms = time.time() * 1000
    last_ts = -1

    prev_time = time.time()
    shots = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frame = cv2.flip(frame, 1)

        lm, label = None, "Right"
        if st.mode != 4:
            rgb = np.ascontiguousarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            ts = max(int(time.time() * 1000 - start_ms), last_ts + 1)
            last_ts = ts
            res = landmarker.detect_for_video(mp_img, ts)
            if res.hand_landmarks:
                lm = res.hand_landmarks[0]
                label = res.handedness[0][0].category_name
                if st.mode != 1:
                    draw_hand(frame, lm)

        if st.mode == 1:
            air_draw(frame, st, lm, label)
        elif st.mode == 2:
            finger_counter(frame, st, lm, label)
        elif st.mode == 3:
            virtual_mouse(frame, st, lm, label)
        elif st.mode == 4:
            colour_tracker(frame, st)

        now = time.time()
        fps = 1 / max(now - prev_time, 1e-6)
        prev_time = now
        put_text(frame, f"{MODES[st.mode]}  |  {fps:4.1f} FPS  |  1-4 modes, q quit",
                 (10, h - 50 if st.mode != 3 else h - 50), 0.55, (200, 255, 200), 1)

        cv2.imshow(WIN, frame)
        key = cv2.waitKey(1) & 0xFF
        if key in (ord("q"), 27):
            break
        elif key in (ord("1"), ord("2"), ord("3"), ord("4")):
            st.mode = int(chr(key))
            st.prev_pt = None
            st.mouse_prev = None
        elif key == ord("c"):
            st.clear()
        elif key == ord("s"):
            shots += 1
            name = f"gesture_lab_{shots}.png"
            cv2.imwrite(name, frame)
            print("Saved", name)

    landmarker.close()
    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
