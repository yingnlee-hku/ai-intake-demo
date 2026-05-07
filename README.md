# HKU ITS — AI Use Case Intake (Demo)

Admin dashboard demo for the AI Use Case Intake system.

---

## Deploy to GitHub Pages

### 1. Create the repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `ai-intake-demo`
3. Set visibility to **Public**
4. Click **Create repository**

### 2. Push the files

Open PowerShell in `C:\Code\AI-Intake` and run:

```powershell
git init
git add .
git commit -m "Initial demo"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ai-intake-demo.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

### 3. Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Under *Branch*, select **main** and folder **/ (root)**
3. Click **Save**
4. Wait ~1 minute, then your site is live at:

```
https://YOUR-USERNAME.github.io/ai-intake-demo/
```

### 4. Share the demo link

Send this URL to your manager:

```
https://YOUR-USERNAME.github.io/ai-intake-demo/admin.html?demo=1
```

**Access PIN:** `hku2026`

> The PIN is entered on a lock screen before the dashboard loads.
> It uses `sessionStorage` so it only needs to be entered once per browser session.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | Public submission form |
| `styles.css` | Form styles |
| `script.js` | Form logic + submission to n8n |
| `admin.html` | Admin dashboard |
| `admin-styles.css` | Dashboard styles |
| `admin-script.js` | Dashboard logic (charts, filters, table) |
| `demo-data.js` | 25 sample records (loaded when `?demo=1`) |
