import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import YTMusic from 'ytmusic-api';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3000;

// In-memory store
const MAX_HISTORY = 100;

const MONOCHROME_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Referer': 'https://monochrome.tf/'
};

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Request logger
app.use((req, res, next) => {
  const isAsset = req.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|otf|map|tsx|ts|jsx|json)$/);
  const isApi = req.url.startsWith('/api');
  
  if (isApi || (!isAsset && req.url !== '/')) {
    console.log(`[Server] ${new Date().toISOString()} ${req.method} ${req.url}`);
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// GA4 Proxy Route
app.get('/api/analytics/data', async (req, res) => {
  try {
    const propertyId = '527976762';
    if (!process.env.GA4_SERVICE_ACCOUNT_JSON) {
        return res.status(500).json({ error: 'GA4 credentials not configured' });
    }
    
    let credentials;
    try {
      credentials = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid GA4 credentials format' });
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
        credentials
    });

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [{ name: 'activeUsers' }],
      dimensions: [{ name: 'date' }],
    });

    res.json(response);
  } catch (error) {
    console.error('GA4 error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Music Proxy Routes
const infamousProxy = createProxyMiddleware({
  target: 'https://infamous.qzz.io',
  changeOrigin: true,
  pathRewrite: { '^/api/music/infamous': '/api' },
  headers: {
    'Referer': 'https://infamous.qzz.io/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  }
});

app.use('/api/music/infamous', infamousProxy);

app.get('/api/music/infamous/image', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: 'URL required' });
    
    const response = await axios.get(url, {
      headers: {
        'Referer': 'https://infamous.qzz.io/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      },
      responseType: 'arraybuffer'
    });
    res.set('Content-Type', response.headers['content-type']);
    res.send(Buffer.from(response.data, 'binary'));
  } catch (error: any) {
    console.error('Infamous image proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

app.get('/api/music/monochrome/search', async (req, res) => {
  try {
    const query = req.query.s as string;
    if (!query) return res.status(400).json({ error: 'Query required' });
    
    const monochromeMirrors = [
      `https://api.monochrome.tf/search/?s=${encodeURIComponent(query)}`,
      `https://api.monochrome.tf/search?s=${encodeURIComponent(query)}`,
      `https://api.monochrome.tf/v1/search?query=${encodeURIComponent(query)}`,
      `https://monochrome.tf/api/search?s=${encodeURIComponent(query)}`,
      `https://monochrome.tf/search/?s=${encodeURIComponent(query)}`
    ];

    let lastError = null;

    for (const url of monochromeMirrors) {
      try {
        const response = await axios.get(url, { 
          headers: MONOCHROME_HEADERS,
          timeout: 5000,
          validateStatus: (status) => status === 200
        });

        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          return res.json(response.data);
        }
      } catch (e: any) {
        lastError = e;
      }
    }

    res.status(503).json({ 
      error: 'Monochrome music search API failed', 
      details: lastError?.message || 'Service Unavailable' 
    });
  } catch (error) {
    console.error('Music search proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch music' });
  }
});

app.get('/api/music/monochrome/track/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const quality = req.query.quality || 'HIGH';
    
    const monochromeTrackMirrors = [
      `https://ohio.monochrome.tf/track/?id=${id}&quality=${quality}`,
      `https://virginia.monochrome.tf/track/?id=${id}&quality=${quality}`,
      `https://frankfurt.monochrome.tf/track/?id=${id}&quality=${quality}`,
      `https://api.monochrome.tf/track/?id=${id}&quality=${quality}`,
      `https://api.monochrome.tf/track?id=${id}&quality=${quality}`,
      `https://api.monochrome.tf/v1/track?id=${id}&quality=${quality}`,
      `https://monochrome.tf/api/track?id=${id}&quality=${quality}`
    ];

    for (const url of monochromeTrackMirrors) {
      try {
        const response = await axios.get(url, { 
          headers: MONOCHROME_HEADERS,
          timeout: 5000,
          validateStatus: (status) => status === 200
        });
        
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          return res.json(response.data);
        }
      } catch (e: any) {
        // ignore
      }
    }

    res.status(503).json({ error: 'Failed to fetch track details from Monochrome' });
  } catch (error) {
    console.error('Track proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch track details' });
  }
});

// TMDB Search Proxy
app.get('/api/tmdb/search', async (req, res) => {
  try {
    const { query, year, type } = req.query;
    const apiKey = process.env.TMDB_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
    }

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const endpoint = type === 'tv' ? 'search/tv' : 'search/movie';
    const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&query=${encodeURIComponent(query as string)}${year ? `&year=${year}` : ''}`;
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('TMDB search error:', error);
    res.status(500).json({ error: 'Failed to search TMDB' });
  }
});

// TMDB Trending Proxy
app.get('/api/tmdb/trending/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const apiKey = process.env.TMDB_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
    }

    let url = '';
    if (type === 'anime') {
      // Fetch TV shows with Animation genre (16) and original language Japanese (ja)
      url = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`;
    } else {
      const endpoint = type === 'tv' ? 'tv' : 'movie';
      url = `https://api.themoviedb.org/3/trending/${endpoint}/week?api_key=${apiKey}`;
    }
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error(`TMDB trending ${req.params.type} error:`, error);
    res.status(500).json({ error: 'Failed to fetch trending from TMDB' });
  }
});

// Jikan API Proxy for Anime Search
app.get('/api/jikan/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query as string)}&limit=1`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Jikan search error:', error);
    res.status(500).json({ error: 'Failed to search Jikan API' });
  }
});

// API 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found', path: req.url });
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  console.log(`Starting server in ${isProd ? 'production' : 'development'} mode...`);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*all', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Server Error]', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: err.message
    });
  });
}

startServer();
