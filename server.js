import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';

// Load env vars
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Placeholders (Siap untuk dikembangkan ke Database sesungguhnya)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DidacticBoard Server is running' });
});

// Serve Static Files (Hasil Build Vite)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Routing (SPA Fallback)
// Semua request yang bukan API akan diarahkan ke index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`
  ================================================
  🚀 DidacticBoard Server Running
  ================================================
  ► Local:      http://localhost:${PORT}
  ► Environment: ${process.env.NODE_ENV || 'production'}
  ================================================
  `);
});