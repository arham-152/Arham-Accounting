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
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    const fs = await import('fs');
    
    // Check if dist/index.html exists to prevent cryptic errors
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      app.get('*', (req, res) => {
        res.status(500).send(`
          <div style="font-family: system-ui, sans-serif; padding: 40px; text-align: center; background: #0a0c10; color: #ef4444; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <h1 style="font-size: 24px; margin-bottom: 16px;">Deployment Error</h1>
            <p style="color: #94a3b8; max-width: 600px; line-height: 1.6; margin-bottom: 24px;">
              ERROR: You uploaded SOURCE code (.tsx) to the server. Please run 'npm run build' and upload the 'dist' folder content.
            </p>
            <div style="text-align: left; background: #111318; padding: 20px; border-radius: 12px; font-size: 13px; color: #64748b; border: 1px solid #1f2430;">
              <p style="margin-top: 0;"><strong>How to fix this:</strong></p>
              <ol>
                <li>Run <code>npm install</code> in your local terminal</li>
                <li>Run <code>npm run build</code> to generate the <code>dist</code> folder</li>
                <li>Upload only the contents of the <code>dist</code> folder to your hosting provider</li>
              </ol>
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
