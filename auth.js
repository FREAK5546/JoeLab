import { firebaseConfig, enableApple } from "./firebase-config.js";

const LIMIT_SECONDS = 120; // prompt after 2 minutes on the site (per visit)
const store = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
};

function publish(state) {
  window.JL_AUTH = state;
  document.dispatchEvent(new Event("jl-auth"));
  renderSlot();
}

function renderSlot() {
  const slot = document.getElementById("auth-slot");
  if (!slot) return;
  const s = window.JL_AUTH || {};
  slot.textContent = "";
  if (s.status !== "ready") return;
  if (s.user) {
    const name = document.createElement("span");
    name.className = "muted auth-name";
    name.textContent = s.user.name;
    const out = document.createElement("button");
    out.className = "auth-btn";
    out.type = "button";
    out.textContent = "Sign out";
    out.addEventListener("click", () => window.JL_SIGN_OUT && window.JL_SIGN_OUT());
    slot.append(name, out);
  } else {
    const b = document.createElement("button");
    b.className = "auth-btn";
    b.type = "button";
    b.textContent = "Sign in";
    b.addEventListener("click", () => document.dispatchEvent(new Event("jl-open-signin")));
    slot.append(b);
  }
}

const configured = firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith("PASTE");

(async function start() {
  if (!configured) { publish({ status: "disabled", user: null }); return; }

  let A, auth;
  try {
    const base = "https://www.gstatic.com/firebasejs/10.14.1/";
    const [{ initializeApp }, authMod] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-auth.js")]);
    A = authMod;
    auth = A.getAuth(initializeApp(firebaseConfig));
  } catch (e) {
    publish({ status: "error", user: null });
    return;
  }

  const providers = { google: new A.GoogleAuthProvider(), github: new A.GithubAuthProvider() };
  if (enableApple) providers.apple = new A.OAuthProvider("apple.com");
  const labels = { google: "Continue with Google", github: "Continue with GitHub", apple: "Continue with Apple" };

  // Sign-in dialog
  const dlg = document.createElement("dialog");
  dlg.className = "signin";
  dlg.setAttribute("aria-labelledby", "si-title");
  dlg.innerHTML = `<h2 id="si-title">Enjoying the lab?</h2>
    <p class="muted">Sign in for free to open the build guides and get more out of JoeLabs.</p>
    <div class="si-buttons">${Object.keys(providers).map((k) => `<button type="button" data-p="${k}">${labels[k]}</button>`).join("")}</div>
    <p class="si-msg" role="alert"></p>
    <button type="button" class="si-later">Maybe later</button>
    <p class="muted si-note">Your name and email from the provider are used only to sign you in.</p>`;
  document.body.appendChild(dlg);
  const msg = dlg.querySelector(".si-msg");

  dlg.querySelector(".si-later").addEventListener("click", () => dlg.close());
  dlg.addEventListener("close", () => store.set("jl_dismissed", "1"));
  dlg.querySelectorAll("[data-p]").forEach((b) =>
    b.addEventListener("click", async () => {
      msg.textContent = "";
      try {
        await A.signInWithPopup(auth, providers[b.dataset.p]);
      } catch (e) {
        const m = {
          "auth/popup-closed-by-user": "",
          "auth/cancelled-popup-request": "",
          "auth/popup-blocked": "Your browser blocked the sign-in pop-up. Allow pop-ups for this site and try again.",
          "auth/account-exists-with-different-credential": "That email is already linked to a different sign-in method. Use the one you used before.",
        };
        msg.textContent = e.code in m ? m[e.code] : "Sign-in failed. Please try again.";
      }
    })
  );
  const open = () => { if (!dlg.open) dlg.showModal(); };
  document.addEventListener("jl-open-signin", open);
  window.JL_SIGN_OUT = () => A.signOut(auth);

  // 2-minute prompt: counts only time the tab is visible, for visitors who are not signed in
  let seconds = Number(store.get("jl_seconds")) || 0;
  setInterval(() => {
    const s = window.JL_AUTH;
    if (!s || s.user || document.visibilityState !== "visible") return;
    seconds += 1;
    store.set("jl_seconds", String(seconds));
    if (seconds >= LIMIT_SECONDS && !store.get("jl_dismissed")) open();
  }, 1000);

  A.onAuthStateChanged(auth, (u) => {
    if (u && dlg.open) dlg.close();
    publish({ status: "ready", user: u ? { name: u.displayName || u.email || "Signed in", email: u.email } : null });
  });
})();
