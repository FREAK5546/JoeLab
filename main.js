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
const PROJECTS = [
  { name: "Gesture Lab", desc: "Hand-gesture control with OpenCV + MediaPipe.", tags: ["Python", "CV"], status: "In progress", link: "" },
  { name: "PID Lab", desc: "Interactive PID controller simulator.", tags: ["Control", "JS"], status: "Planned: browser port", link: "" },
  { name: "Cube Solver", desc: "Rubik's cube solver.", tags: ["Python", "Algorithms"], status: "In progress", link: "" },
  { name: "Neural Pong", desc: "Single-file HTML game with optional biometric input.", tags: ["HTML", "Game"], status: "Playable", link: "" },
  { name: "TICTOE", desc: "GameFi project on Base.", tags: ["Web3", "GameFi"], status: "In progress", link: "" },
];

const grid = document.getElementById("project-grid");
if (grid) {
  const limit = grid.dataset.limit ? parseInt(grid.dataset.limit, 10) : PROJECTS.length;
  PROJECTS.slice(0, limit).forEach((p) => {
    const el = document.createElement("div");
    el.className = "card";
    const title = p.link ? `<a href="${p.link}">${p.name}</a>` : p.name;
    el.innerHTML = `<h3>${title}</h3><p class="muted">${p.desc}</p>
      <p>${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</p>
      <span class="status">${p.status}</span>`;
    grid.appendChild(el);
  });
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
