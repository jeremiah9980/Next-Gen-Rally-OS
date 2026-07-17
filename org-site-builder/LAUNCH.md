# LAUNCH.md — Launch your softball org site on GitHub Pages

Follow these steps in order. No coding experience required. Anywhere you see a
`command`, you type it in a terminal from inside the project folder.

---

## Step 1 — Create a new GitHub repository

1. Go to <https://github.com/new>.
2. **Repository name:** name it after your org, e.g. `ctx-elite-softball`,
   `most-hated-softball`, or `your-org-name`.
3. Set it to **Public** (GitHub Pages is free for public repos).
4. Do **not** add a README/.gitignore/license (this template already has files).
5. Click **Create repository**.

---

## Step 2 — Upload the template files

**Option A — drag & drop (easiest, no Git):**
On the new empty repo page, click **uploading an existing file**, then drag the
entire contents of this template folder in, and **Commit changes**.

**Option B — Git command line:**
```bash
cd your-org-template          # the folder containing index.html
git init
git add .
git commit -m "Initial site from softball org template"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/your-org-name.git
git push -u origin main
```

Confirm `index.html`, the `src/` folder, and the `public/` folder are all present in
the repo after uploading.

---

## Step 3 — Edit your organization config

Open `src/config/org.config.json` and replace the placeholder content:

- `organization.name`, `nickname`, `ageGroup`, `tagline`, `location`
- `hero.kicker`, `hero.title`, `hero.subtitle`
- `coaches[]` — names, roles, bios, photo paths
- `roster.players[]` — first name, last initial, jersey number, positions
- `tryouts` — dates, time, location, `signupUrl`
- `contact` — coach name, phone, email, social links
- image paths under `branding` and each section

**Shortcut:** run the scaffolder to fill the basics for you, then fine‑tune by hand:
```bash
node scripts/create-new-org.js --name "Your Org" --nickname "Your Org" \
  --ageGroup 12U --location "City, ST" --preset aggressive-elite \
  --coach "Coach Name" --email coach@yourorg.com --tone elite
```
Every field is documented in **CONFIGURATION.md**.

---

## Step 4 — Upload your images

Drop your files into these folders (full guide in `public/images/README.md`):

- `public/images/logos/` — your logo
- `public/images/hero/` — the big banner image
- `public/images/coaches/` — coach headshots
- `public/images/players/` — player photos
- `public/images/sponsors/` — sponsor logos
- `public/images/gallery/` — team photos
- `public/qr/` — signup QR code (optional; one is auto‑generated if omitted)

Then make sure the paths in `org.config.json` match your filenames. Paths start with
`/images/...` or `/qr/...` (the site maps those to the `public/` folder for you).

---

## Step 5 — Configure your theme (colors)

Open `src/config/theme.tokens.json` and set your colors, **or** start from a preset:

```bash
node scripts/generate-theme.js --list                 # see all 9 presets
node scripts/generate-theme.js --preset dark-sports    # apply one
node scripts/generate-theme.js --preset clean-modern \
  --primary "#7A0019" --secondary "#FFCC33"            # preset + custom colors
```

- Set both the `light` **and** `dark` token blocks so the toggle always looks intentional.
- Confirm text is readable on its background (aim for 4.5:1 contrast).
- `node scripts/validate-config.js` checks contrast for you.

See **BRANDING.md** for how to design a palette that doesn't copy any existing org.

---

## Step 6 — Run locally and check it

This is a static site with no build step, so:
```bash
npx serve .
```
Open the printed `http://localhost:3000` address. Click around, flip the light/dark
toggle, and test the signup button on a phone‑sized window.

> If you prefer an npm workflow, `npm install` then `npm run dev` runs the same static
> server. There is nothing to compile — npm is optional.

Before you deploy, run the validator and fix any errors:
```bash
node scripts/validate-config.js
```

---

## Step 7 — Deploy to GitHub Pages

1. In your repo, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. **Branch:** `main`, **Folder:** `/ (root)`. Click **Save**.
4. Wait 1–3 minutes for the first build.
5. Refresh the Pages settings page; it will show your live URL, usually
   `https://YOUR-USERNAME.github.io/your-org-name/`.

This template includes a `.nojekyll` file so GitHub Pages serves the `src/` and
`public/` folders as‑is.

---

## Step 8 — Connect a custom domain (optional)

1. Buy a domain (e.g. `yourorg.com`) from any registrar.
2. In **Settings → Pages → Custom domain**, enter your domain and **Save** (this
   creates a `CNAME` file in the repo).
3. At your registrar's DNS settings:
   - For a subdomain like `www`: add a **CNAME** record pointing to
     `YOUR-USERNAME.github.io`.
   - For the apex/root domain: add GitHub's **A records**
     (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`).
4. Back in GitHub Pages, wait for the DNS check, then tick **Enforce HTTPS**.
5. DNS can take a few minutes to a few hours to propagate.

---

## Step 9 — Final launch checklist

- [ ] Logo displays in the header and as the favicon
- [ ] Hero image displays and reads well on mobile
- [ ] Light/dark toggle works and is remembered after reload
- [ ] "Join the Team" / signup button opens the correct form
- [ ] QR code resolves to the signup form
- [ ] Mobile layout works (nav collapses, text is readable, no overflow)
- [ ] Coach names and contact info are correct
- [ ] Tryout dates, time, and location are correct
- [ ] Sponsor logos display and link out correctly
- [ ] Social links open the right profiles
- [ ] The GitHub Pages URL loads publicly in an incognito window

---

## Troubleshooting

**The page is blank / "Could not load configuration".**
You opened `index.html` directly (`file://`). Use `npx serve .` locally; on GitHub
Pages it works automatically because Pages serves over `http`.

**Styles or images don't load on GitHub Pages (but worked locally).**
Paths must stay relative. Keep image paths in config starting with `/images/...`; the
site resolves them against the page location. Don't hard‑code
`https://username.github.io/...` into config.

**My changes don't show up.**
GitHub Pages caches aggressively. Wait a minute, then hard‑refresh
(Ctrl/Cmd + Shift + R). Confirm the commit actually landed on the `main` branch.

**404 after enabling Pages.**
Give the first build 1–3 minutes. Confirm **Source = Deploy from a branch**, branch
`main`, folder `/ (root)`, and that `index.html` is at the repo root.

**Colors look wrong in one mode.**
You probably set only `light` or only `dark` in `theme.tokens.json`. Set both, or
re‑run `node scripts/generate-theme.js --preset <name>`.

**Using a bundler (Vite, etc.) instead?**
Not required and not recommended for this template — it's intentionally build‑free.
If you adopt Vite later, set `base: './'` so asset paths stay relative on Pages, and
deploy the `dist/` output (e.g. via the `gh-pages` branch or a GitHub Action).
