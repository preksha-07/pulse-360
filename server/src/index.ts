import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { z } from 'zod';
import { telemetryEngine } from './telemetry/engine';
import { predictionEngine } from './prediction/engine';
import { coordinatorAgent } from './agents/coordinator';
import { generateOperationalBriefing, fanAssistant } from './ai/gemini';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI rate limit reached. Please wait a moment.' }
});

app.use('/api/', apiLimiter);
app.use('/api/ai/', aiLimiter);

// ── Input Validation Schemas ─────────────────────────────────────────────────
const FanAssistSchema = z.object({
  message: z.string().min(1).max(300).trim(),
  language: z.enum(['English', 'Spanish', 'French', 'Arabic', 'Portuguese', 'German', 'Japanese', 'Korean']).default('English')
});

// ── Helper ────────────────────────────────────────────────────────────────────
function getCurrentIntelligence() {
  const telemetry = (telemetryEngine as any).state;
  const prediction = predictionEngine.generatePredictions(telemetry);
  const recommendations = coordinatorAgent.process(prediction);
  return { telemetry, prediction, recommendations };
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Pulse360', version: '1.0.0', timestamp: new Date().toISOString() });
});

// SSE: Unified Intelligence Stream (telemetry + predictions + recommendations)
app.get('/api/intelligence/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const unsubscribe = telemetryEngine.subscribe((telemetryState) => {
    const prediction = predictionEngine.generatePredictions(telemetryState);
    const recommendations = coordinatorAgent.process(prediction);
    const payload = { telemetry: telemetryState, predictions: prediction, recommendations };
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  });

  req.on('close', () => unsubscribe());
});

// AI: Organizer Operational Briefing
app.get('/api/ai/briefing', async (req, res) => {
  try {
    const { prediction, recommendations } = getCurrentIntelligence();
    const briefing = await generateOperationalBriefing(prediction, recommendations);
    res.json({ briefing, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[AI Briefing] Error:', err);
    res.status(500).json({ error: 'Briefing generation failed.' });
  }
});

// AI: Fan Multilingual Assistant
app.post('/api/ai/fan-assist', async (req, res) => {
  const parsed = FanAssistSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request.', details: parsed.error.flatten() });
  }
  try {
    const { message, language } = parsed.data;
    const { prediction } = getCurrentIntelligence();
    const reply = await fanAssistant(message, language, prediction);
    res.json({ reply, language });
  } catch (err) {
    console.error('[Fan Assistant] Error:', err);
    res.status(500).json({ error: 'Assistant unavailable. Please try again.' });
  }
});

// Start engine and server
telemetryEngine.start(2000);

app.listen(PORT, () => {
  console.log(`[Pulse360] Server running on http://localhost:${PORT}`);
  console.log(`[Pulse360] Gemini mode: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' ? 'LIVE' : 'MOCK'}`);
});
