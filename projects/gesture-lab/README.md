# Gesture Lab

A webcam playground built with Python, OpenCV and MediaPipe.

## Setup

Use Python 3.9 to 3.12 (MediaPipe doesn't ship wheels for newer versions yet).

```bash
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

On the first run the app downloads a small hand-tracking model (`hand_landmarker.task`, about 8 MB) next to `main.py`. If the download fails, save it manually from
https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task
into the same folder.

## Modes (press the number key)

| Key | Mode | How it works |
|-----|------|--------------|
| 1 | Air Draw | Index finger up = draw. Index + middle up = hover and pick a colour from the top bar. |
| 2 | Finger Counter | Shows how many fingers you hold up, per finger. |
| 3 | Virtual Mouse | Index fingertip moves the cursor. Pinch thumb + middle finger to click. |
| 4 | Colour Tracker | Click any object in the window, and it gets tracked with a fading trail. |

Other keys: `c` clear, `s` save screenshot, `q` / `Esc` quit.

## Tips

- Good, even lighting makes tracking much more stable.
- Mouse mode moves your real cursor. Pull your hand out of frame to stop it.
- If the thumb reads wrong in Finger Counter, check that your palm faces the camera.

## Ideas to extend it

- Add a gesture to switch modes (e.g. 3 fingers = next mode).
- Add a "volume control" mode using thumb-to-index distance.
- Record drawings to PNG with a transparent background.
- Train a tiny classifier on landmarks to recognise custom gestures.
