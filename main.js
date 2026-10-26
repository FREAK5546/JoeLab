// Theme toggle (remembers choice)
(function () {
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.setAttribute("data-theme", saved);
  } catch (e) {}
  const btn = document.getElementById("theme");
  if (btn) {
    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

// Projects are defined here, so adding a new one = adding one object.
// link  = a page or folder with the project files (e.g. "games/pong/")
// guide = the key of an entry in GUIDES below, for projects whose files aren't posted
const PROJECTS = [
  { name: "Offline AI Chatbot", desc: "A local LLM chatbot (Llama models) that runs fully offline on your own PC's CPU/GPU.", tags: ["Python", "AI", "Ollama"], status: "Completed", link: "", guide: "offline-ai-chatbot" },
  { name: "Gesture Lab", desc: "Hand-gesture control with OpenCV + MediaPipe: draw in the air, count fingers, move your mouse.", tags: ["Python", "CV"], status: "Completed", link: "", guide: "gesture-lab" },
  { name: "PID Lab", desc: "Interactive PID controller simulator: cart, inverted pendulum and robot arm.", tags: ["Control", "JS"], status: "Playable", link: "projects/pid-lab/" },
  { name: "Cube Solver", desc: "Rubik's cube solver.", tags: ["Python", "Algorithms"], status: "Completed", link: "" },
  { name: "Neural Pong", desc: "Single-file HTML game with optional biometric input.", tags: ["HTML", "Game"], status: "Playable", link: "" },
  { name: "TICTOE", desc: "GameFi project on Base.", tags: ["Web3", "GameFi"], status: "In progress", link: "" },
];

function esc(t) {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const grid = document.getElementById("project-grid");
if (grid) {
  const limit = grid.dataset.limit ? parseInt(grid.dataset.limit, 10) : PROJECTS.length;
  PROJECTS.slice(0, limit).forEach((p) => {
    const el = document.createElement("div");
    el.className = "card";
    const title = p.link ? `<a href="${p.link}">${esc(p.name)}</a>` : esc(p.name);
    const guide = p.guide ? `<a class="guide-link" href="guide.html?p=${encodeURIComponent(p.guide)}">View build guide →</a>` : "";
    el.innerHTML = `<h3>${title}</h3><p class="muted">${esc(p.desc)}</p>
      <p>${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</p>
      <span class="status">${esc(p.status)}</span>${guide}`;
    grid.appendChild(el);
  });
}

// Step-by-step guides for projects whose files aren't posted.
// Add a new one here, then set guide: "<key>" on the project.
const GUIDES = {
  "gesture-lab": {
    title: "Gesture Lab: run it on your PC",
    intro: "A webcam playground built with Python, OpenCV and MediaPipe. It has four modes: Air Draw, Finger Counter, Virtual Mouse and Colour Tracker. Everything runs on your own computer.",
    downloads: [
      { label: "gesture-lab.zip (all files)", href: "projects/gesture-lab/gesture-lab.zip" },
      { label: "main.py", href: "projects/gesture-lab/main.py" },
      { label: "requirements.txt", href: "projects/gesture-lab/requirements.txt" },
      { label: "README.md", href: "projects/gesture-lab/README.md" }
    ],
    needs: [
      "A PC with a webcam (Windows steps below; macOS/Linux work too)",
      "Python 3.9 to 3.12. Python 3.12 is recommended, because MediaPipe does not support newer versions yet",
      "Internet for the first install and the first run (a small ~8 MB hand-tracking model is downloaded once)"
    ],
    steps: [
      { title: "Download the files", text: "Download gesture-lab.zip above and extract it into a folder, for example gesture-lab on your Desktop." },
      { title: "Install Python 3.12 (skip if you have it)", text: "On Windows, run this in Command Prompt, then close the terminal and open a new one. On macOS/Linux install Python 3.12 from python.org or your package manager.", code: "winget install -e --id Python.Python.3.12\npy -3.12 --version" },
      { title: "Open a terminal in the folder", text: "On Windows, open the folder in File Explorer, click the address bar, type cmd and press Enter." },
      { title: "Create a virtual environment (one time)", text: "This keeps the libraries separate from the rest of your PC.", code: "# Windows\npy -3.12 -m venv .venv\n\n# macOS / Linux\npython3.12 -m venv .venv" },
      { title: "Activate it (every time you open a new terminal)", text: "You should see (.venv) at the start of the line.", code: "# Windows\n.venv\\Scripts\\activate\n\n# macOS / Linux\nsource .venv/bin/activate" },
      { title: "Install the libraries (one time)", text: "If it times out, run the same command again. Finished downloads are cached, so the retry is faster. A phone hotspot can help on a slow connection.", code: "python -m pip install --default-timeout=120 --retries 10 -r requirements.txt" },
      { title: "Run it", text: "On the first run it downloads hand_landmarker.task (about 8 MB) into the same folder. If that fails, download the file by hand from the link in README.md and save it there with that exact name.", code: "python main.py" },
      { title: "Use it", text: "Click the video window first, then press keys. 1 = Air Draw (index finger draws, index + middle picks a colour). 2 = Finger Counter. 3 = Virtual Mouse (index finger moves the cursor, pinch thumb and middle finger to click, take your hand out of view to stop). 4 = Colour Tracker (click any object to track it). c clears, s saves a screenshot, q or Esc quits." },
      { title: "If something goes wrong", text: "MediaPipe missing or no window: activate the virtual environment and try again. Black screen: close Zoom, Teams and the Camera app. Jumpy tracking: use even lighting and keep your hand 30 to 80 cm from the camera. Thumb count wrong: face your palm to the camera. Mouse mode only shows a message: pyautogui failed to install, and the other modes still work." }
    ]
  },
  "offline-ai-chatbot": {
    title: "Build an offline AI chatbot",
    intro: "Run a Llama-style language model entirely on your own computer. Once the model is downloaded, no internet and no account are needed. It uses your CPU (and your GPU if you have one), so the model size you pick depends on your specs.",
    needs: [
      "Windows, macOS or Linux",
      "8 GB RAM for small models (1B–3B), 16 GB for 7B–8B models",
      "About 2–6 GB free disk space per model",
      "A GPU is optional. It makes replies faster but isn't required",
      "Python 3.9+ (only for steps 5 and 6)"
    ],
    steps: [
      { title: "Install Ollama", text: "Ollama is a free tool that downloads and runs models locally. Get the installer for your system from ollama.com/download. On Linux you can instead run:", code: "curl -fsSL https://ollama.com/install.sh | sh" },
      { title: "Check it works", text: "Open a terminal (Command Prompt or PowerShell on Windows) and run:", code: "ollama --version" },
      { title: "Pick a model for your specs", text: "Smaller models are faster and fit in less memory. Larger models give better answers. Start small and move up if your PC handles it well.", code: "ollama pull llama3.2:1b   # very light, ~8 GB RAM or less\nollama pull llama3.2      # 3B, good all-rounder\nollama pull llama3.1:8b   # better quality, wants 16 GB RAM" },
      { title: "Chat in the terminal", text: "This starts an interactive chat. Type /bye to quit.", code: "ollama run llama3.2" },
      { title: "Make your own chatbot in Python", text: "Install the Ollama Python library, then save the code below as chat.py and run it with python chat.py. It streams replies and remembers the conversation.", code: "pip install ollama" },
      { title: "chat.py", text: "Change the model name to whichever one you pulled.", code: "import ollama\n\nMODEL = \"llama3.2\"\nhistory = []\n\nwhile True:\n    q = input(\"You: \")\n    if q.strip().lower() in (\"exit\", \"quit\"):\n        break\n    history.append({\"role\": \"user\", \"content\": q})\n    reply = \"\"\n    print(\"AI: \", end=\"\", flush=True)\n    for chunk in ollama.chat(model=MODEL, messages=history, stream=True):\n        piece = chunk[\"message\"][\"content\"]\n        print(piece, end=\"\", flush=True)\n        reply += piece\n    print()\n    history.append({\"role\": \"assistant\", \"content\": reply})" },
      { title: "Optional: a ChatGPT-style web page", text: "Open WebUI gives you a browser interface for your local models. It needs Python 3.11. Run these, then open http://localhost:8080.", code: "pip install open-webui\nopen-webui serve" },
      { title: "Go fully offline", text: "After the model is downloaded, turn off your Wi-Fi and run it again. It still works, because everything runs on your machine. If replies are slow, switch to a smaller model, close heavy apps, or use a GPU if you have one." }
    ]
  }
};

const guideBox = document.getElementById("guide");
if (guideBox) {
  const key = new URLSearchParams(location.search).get("p");
  const g = Object.prototype.hasOwnProperty.call(GUIDES, key) ? GUIDES[key] : null;
  if (!g) {
    guideBox.innerHTML = `<h1>Guide not found</h1><p class="muted">That guide doesn't exist. <a href="projects.html">Back to projects</a></p>`;
  } else {
    document.title = `${g.title} · JoeLabs`;
    guideBox.innerHTML = `<p><a href="projects.html">← Projects</a></p>
      <h1>${esc(g.title)}</h1>
      <p class="muted">${esc(g.intro)}</p>
      ${g.downloads ? `<h2>Download</h2><ul class="guide-meta">${g.downloads.map((d) => `<li><a href="${d.href}" download>${esc(d.label)}</a></li>`).join("")}</ul>` : ""}
      <h2>What you need</h2>
      <ul class="guide-meta">${g.needs.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
      <h2>Steps</h2>
      <ol class="steps">${g.steps.map((s) => `<li><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>${s.code ? `<pre><code>${esc(s.code)}</code></pre>` : ""}</li>`).join("")}</ol>`;
  }
}

// Notes are defined here too. Newest first.
const NOTES = [
  { date: "2026-10-22", title: "Starting the lab", body: "Built the first version of this site. Plan: every project I build gets a page here." },
];

const list = document.getElementById("notes-list");
if (list) {
  NOTES.forEach((n) => {
    const el = document.createElement("div");
    el.className = "note";
    el.innerHTML = `<time>${n.date}</time><h3>${n.title}</h3><p>${n.body}</p>`;
    list.appendChild(el);
  });
}
