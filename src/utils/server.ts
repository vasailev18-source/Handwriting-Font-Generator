import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini Client
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY) {
  ai = new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// REST Webhook integration mock for raw Telegram inputs
app.post('/api/telegram/webhook', (req, res) => {
  const { message } = req.body;
  console.log('Received Telegram payload:', message);
  res.status(200).json({ status: 'ok', handled: true });
});

// Server-side endpoint to coach custom style designs using Gemini
app.post('/api/gemini/analyze-style', async (req, res) => {
  const { styleName, strokesCaptured } = req.body;

  if (!ai) {
    return res.json({
      feedback: 'Gemini API not configured. Pre-baked feedback: Your style has wonderful fluid curves, but keep lines tighter for Russian letter spacing.'
    });
  }

  try {
    const prompt = `You are a professional handwriting coach. Provide highly descriptive, constructive coaching advice for a custom digital handwriting profile named "${styleName}" that has successfully captured ${strokesCaptured} characters in the digital grid. Highlight specific recommendations like line slant, spacing consistency, baseline curvature and flow. Answer briefly in Russian (max 2 sentences).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({ feedback: response.text });
  } catch (error: any) {
    console.error('Gemini API call failed:', error);
    res.json({
      feedback: 'Ваш почерк имеет красивую слаженную форму. Для еще большей реалистичности старайтесь плавно соединять стыки букв и немного варьировать наклон.'
    });
  }
});

// Server-side endpoint for intelligent text-to-handwriting structural recommendations
app.post('/api/gemini/optimize-text', async (req, res) => {
  const { text } = req.body;

  if (!ai) {
    return res.json({
      result: text,
      suggestion: 'No API Key configured. Simply outputting source text.'
    });
  }

  try {
    const prompt = `Take the following note containing textual or scientific comments and rewrite it to be neat, readable, beautifully summarizing points, and inserting math-friendly symbols where possible for pristine handwriting rendering.
Any mathematical equations and formulas MUST be formatted strictly using standard double-dollar signs on their own separate lines, like:
$$ \\int_{a}^{b} x^2 dx = \\frac{b^3 - a^3}{3} $$

Never format equations inside inline text or single-dollar signs if they are complex; instead, move complex formulas to their own lines wrapped in double dollars ($$). Keep text comments in Russian or the same language as input. Return ONLY the revised text ready for printing, with no outer markdown wrapping or meta-comments.\n\n${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error) {
    console.error('Gemini optimization failed:', error);
    res.json({ result: text });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', geminiReady: !!ai });
});

// Mount Vite middleware for direct development preview on Port 3000
async function initServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TypeScribe Express Backend listening on http://0.0.0.0:${PORT}`);
  });
}

initServer();
