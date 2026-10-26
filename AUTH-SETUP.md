# Turning on sign-in (Google / GitHub, optional Apple)

Until you do this, sign-in is OFF and the whole site stays open. Nothing breaks.

1. Go to https://console.firebase.google.com and click **Add project** (free Spark plan is fine).
2. Left menu: **Build > Authentication > Get started > Sign-in method**.
   - **Google**: enable it, pick a support email, save.
   - **GitHub**: enable it. Firebase shows a callback URL. Go to github.com/settings/developers > OAuth Apps > New OAuth App,
     paste that callback URL, then copy the Client ID and Client secret back into Firebase and save.
   - **Apple** (optional): needs a paid Apple Developer membership. Skip it unless you have one.
     If you set it up, change `enableApple` to `true` in firebase-config.js.
3. **Authentication > Settings > Authorized domains**: add `YOUR-USERNAME.github.io`.
4. **Project settings (gear icon) > Your apps > Web (</>)**: register an app and copy the config values.
5. Paste them into `firebase-config.js`, replacing the PASTE_... values, and upload it to GitHub.

## Choosing what needs sign-in
In `main.js`, add `members: true` to a project (hides its guide link) and to the matching guide in GUIDES.
Remove it to make that item public again.

## Important: this is a soft gate
GitHub Pages is a static host. Sign-in decides what the page shows, but every file in the repo is still public
if someone knows its URL (for example projects/gesture-lab/main.py). Do not put anything private on the site.
Truly protected content needs a backend.

## Privacy
Signed-in visitors' names and emails are stored in your Firebase project. Consider adding a short privacy note
to the site saying what you collect and why.
