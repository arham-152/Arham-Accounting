# Cloudflare Deployment Guide

The issue you are experiencing is likely because you are uploading the **SOURCE CODE** (files like `.tsx` and `.ts`) directly to Cloudflare. Browsers cannot run these files directly; they require the **BUILT** version of your application.

## 1. How to fix the "Blank Loading Page"

1. **Build the Project Locally**:
   - Download the project to your computer.
   - Open your terminal in the project folder and run:
     ```bash
     npm install
     npm run build
     ```
   - This will create a new folder named **`dist`** in your project directory.

2. **Upload the `dist` Folder**:
   - When uploading to Cloudflare (Pages or Workers), **do not upload the whole project**.
   - **Upload ONLY the contents of the `dist` folder**.

---

## 2. Recommended Deployment: Cloudflare Pages

Cloudflare Pages is the easiest way to host this application.

### Option A: Manual Upload (Easiest)
1. In the Cloudflare Dashboard, go to **Workers & Pages** -> **Create application** -> **Pages**.
2. Select **Upload assets**.
3. Download this project, run `npm run build` locally.
4. Drag and drop the **contents of the `dist` folder** into the upload area.
5. Deploy!

### Option B: Connect to Git (Automatic)
If you connect your GitHub repository:
1. Set the **Framework preset**: `Vite` (or `None`).
2. Set the **Build command**: `npm run build`
3. **CRITICAL**: Set the **Build output directory** to `dist`.
   * *Note: If you leave this as "public" or "/", the app will NOT load.*
4. Deploy!

---

## 3. Troubleshooting the "Infinite Loading" screen

If you see "Initializing Systems..." for more than 10 seconds:
1. **Check the Folder**: Did you upload the `dist` folder? If you uploaded the whole project (including `src`, `package.json`, etc.), it will NOT work.
2. **Check Build Settings**: If using Git, ensure the "Build output directory" is set to `dist`.
3. **Use Diagnostics**: Click the "DIAGNOSTICS" button that appears on the loading screen to see what happened.
4. **Browser Console**: Right-click -> Inspect -> Console. Look for red error messages. If you see "MIME type mismatch" or "Failed to load resource", it means your paths are broken—usually because of an incorrect upload.

---

## 4. Important: Data Connection (Google Sheets)

This application is designed to sync with a Google Sheet.

- **On AI Studio**: We use a backend server to bypass CORS issues.
- **On Cloudflare Pages (Static)**: You must ensure your Google Sheet is **"Published to the Web"** as a CSV.
  1. In Google Sheets: **File** -> **Share** -> **Publish to the web**.
  2. Select your sheet name and format: **Comma-separated values (.csv)**.
  3. Copy the generated link and use it in the app's **Connect** settings.

