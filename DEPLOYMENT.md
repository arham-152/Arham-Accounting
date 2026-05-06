# Deployment Instructions for Cloudflare

The error you see is because you are uploading the **SOURCE CODE** (Typescript files like `.tsx` and `.ts`) directly. Cloudflare Workers and Pages require the **BUILT** version of the app.

## How to fix the error in your screenshot:

1. **Build the Project**:
   - Download the project from AI Studio.
   - Run `npm install`.
   - Run `npm run build`.
   - This creates a **`dist`** folder.

2. **Upload the correct files**:
   - Instead of uploading the whole project, **only upload the files inside the `dist` folder**.
   - These will be `.html`, `.js`, and `.css` files that Cloudflare can understand.

3. **Backend Proxy Note**:
   - This app uses a backend proxy in AI Studio to bypass Google Sheets CORS issues.
   - If you deploy to a **Static Host** (like Cloudflare Pages or Netlify):
     - Ensure your Google Sheet is **"Published to the Web"** as a CSV.
     - The app will automatically detect the missing proxy and try to connect directly to the sheet.

## Recommended Cloudflare Workflow:
If you want to use Cloudflare Workers with the backend features:
- Use `npx wrangler deploy` from your terminal after building.
- Note: This app uses Express, which requires minor adjustments for a standard Cloudflare Worker environment (Cloudflare Workers use a Fetch-based API). For the simplest deployment, use **Cloudflare Pages** for the static frontend.
