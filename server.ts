import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Proxy to bypass CORS issues with Google Sheets
  app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`[Proxy] Fetching: ${targetUrl}`);

    try {
      const response = await fetch(targetUrl);
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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
