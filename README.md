# Joe's Lab

A plain HTML/CSS/JS site. No build step, no installs, no cost.

## Run locally
Double-click `index.html`, or from this folder run:

    python -m http.server 8000

Then open http://localhost:8000

## Put it online for free

### Option A: GitHub Pages
1. Create a GitHub account and a new public repo named `joe-lab`.
2. Upload these files (or `git push` them).
3. Repo Settings > Pages > Deploy from branch > `main` / root.
4. Your site appears at `https://<username>.github.io/joe-lab/`.

### Option B: Cloudflare Pages
1. Push the folder to GitHub.
2. Cloudflare dashboard > Workers & Pages > Create > Pages > connect the repo.
3. Build command: leave empty. Output directory: `/`.
4. You get `https://<project>.pages.dev`, redeployed on every push.

## Adding things
- New project: add an object to `PROJECTS` in `main.js`.
- New note: add an object to `NOTES` in `main.js`.
- New game or demo: make a folder like `games/pong/` with an `index.html`, then set `link` on the project.

See `ROADMAP.md` for what to build next.
