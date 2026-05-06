import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy to bypass CORS issues with Google Sheets
  app.all('/api/proxy', async (req, res) => {
    // For GET: use query.url. For POST: use body.url
    const targetUrl = (req.method === 'GET' ? req.query.url : req.body.url) as string;
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`[Proxy] ${req.method} to: ${targetUrl}`);

    try {
      const options: RequestInit = {
        method: req.method === 'POST' ? 'POST' : 'GET',
        headers: req.method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: req.method === 'POST' ? JSON.stringify(req.body.data || req.body) : undefined,
        redirect: 'follow'
      };

      const response = await fetch(targetUrl, options);
      console.log(`[Proxy] Response: ${response.status} ${response.statusText}`);
      
      const responseData = await response.text();

      if (!response.ok) {
        let errorDetails = responseData;
        try {
          const json = JSON.parse(responseData);
          errorDetails = json.error || json.message || responseData;
        } catch {
          // Keep as text if not JSON
        }
        
        return res.status(response.status).json({ 
          error: `External source returned ${response.status}`, 
          details: errorDetails 
        });
      }

      // Set content type to text/plain or text/csv for the proxy response
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(responseData);
    } catch (error: any) {
      console.error('Proxy Error:', error.message);
      res.status(500).json({ error: 'Proxy implementation error', details: error.message });
    }
  });

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite failed to start, falling back to static server check.');
      // If Vite fails (e.g. missing dependencies), we might want to show the dist check anyway
    }
  }

  const distPath = path.join(__dirname, 'dist');
  let indexHtmlExists = false;
  try {
    const fs = await import('fs');
    indexHtmlExists = fs.existsSync(path.join(distPath, 'index.html'));
  } catch (e) {
    console.log('[System] fs module not available, skipping index.html existence check.');
    // Assume it exists if we can't check, or handle based on environment
    indexHtmlExists = process.env.NODE_ENV === 'production';
  }

  if (process.env.NODE_ENV === 'production' || !indexHtmlExists) {
    if (!indexHtmlExists) {
      app.get('*', (req, res, next) => {
        // If we are in dev mode and Vite is handling it, this route won't be reached
        // because Vite middleware is registered BEFORE this.
        // If we are in production OR Vite failed, show this guide.
        res.status(200).send(`
          <div style="font-family: system-ui, sans-serif; padding: 40px; text-align: center; background: #0f172a; color: #f8fafc; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="background: #1e293b; padding: 32px; border-radius: 16px; border: 1px solid #334155; max-width: 500px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);">
              <h1 style="font-size: 24px; margin-bottom: 12px; color: #38bdf8;">Application Setup Guide</h1>
              <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">
                You are currently running the server, but the frontend build is missing.
              </p>
              
              <div style="text-align: left; background: #0f172a; padding: 20px; border-radius: 12px; font-size: 14px; border: 1px solid #334155;">
                <p style="margin-top: 0; font-weight: 600; color: #f1f5f9;">For Local Development:</p>
                <code style="display: block; background: #1e293b; padding: 8px; border-radius: 4px; margin-bottom: 16px; color: #38bdf8;">npm run dev</code>
                
                <p style="margin-top: 0; font-weight: 600; color: #f1f5f9;">For Deployment (Production):</p>
                <ol style="padding-left: 20px; color: #94a3b8; margin-bottom: 0;">
                  <li>Run <code style="color: #38bdf8;">npm run build</code></li>
                  <li>Ensure the <code>dist</code> folder is created</li>
                  <li>Run <code style="color: #38bdf8;">npm start</code></li>
                </ol>
              </div>
              
              <p style="margin-top: 24px; font-size: 12px; color: #64748b;">
                Environment: ${process.env.NODE_ENV || 'development'}
              </p>
            </div>
          </div>
        `);
      });
    } else {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
