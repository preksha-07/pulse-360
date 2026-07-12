import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { telemetryEngine } from '../telemetry/engine';

describe('Server API Endpoints', () => {
  beforeEach(() => {
    // Set environment to test
    process.env.NODE_ENV = 'test';
    // Clear rate limiters for testing if necessary
  });

  afterEach(() => {
    telemetryEngine.stop();
  });

  describe('GET /api/health', () => {
    it('should return 200 and system health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'Pulse360');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /api/ai/briefing', () => {
    it('should return 200 and operational briefing details', async () => {
      const response = await request(app)
        .get('/api/ai/briefing')
        .expect(200);

      expect(response.body).toHaveProperty('briefing');
      expect(response.body).toHaveProperty('generatedAt');
      expect(typeof response.body.briefing).toBe('string');
    });
  });

  describe('POST /api/ai/fan-assist', () => {
    it('should return 200 and custom AI reply for valid inputs', async () => {
      const payload = {
        message: 'Where is Food Court A?',
        language: 'English'
      };

      const response = await request(app)
        .post('/api/ai/fan-assist')
        .send(payload)
        .expect(200);

      expect(response.body).toHaveProperty('reply');
      expect(response.body).toHaveProperty('language', 'English');
    });

    it('should return 400 when input message is empty or missing', async () => {
      const payload = {
        language: 'English'
      };

      const response = await request(app)
        .post('/api/ai/fan-assist')
        .send(payload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request.');
      expect(response.body.details.fieldErrors.message).toBeDefined();
    });

    it('should return 400 when message exceeds max allowed length of 300', async () => {
      const longMessage = 'A'.repeat(301);
      const payload = {
        message: longMessage,
        language: 'English'
      };

      const response = await request(app)
        .post('/api/ai/fan-assist')
        .send(payload)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request.');
      expect(response.body.details.fieldErrors.message).toBeDefined();
    });

    it('should return 400 for unsupported languages', async () => {
      const payload = {
        message: 'Hello',
        language: 'Italian' // not in the allowed enum
      };

      const response = await request(app)
        .post('/api/ai/fan-assist')
        .send(payload)
        .expect(400);

      expect(response.body.details.fieldErrors.language).toBeDefined();
    });
  });

  describe('GET /api/intelligence/stream', () => {
    it('should establish an event-stream connection and set headers', () => {
      return new Promise<void>((resolve, reject) => {
        const req = request(app)
          .get('/api/intelligence/stream')
          .buffer(false);
          
        req.on('error', () => {
          // Swallow aborted request errors to prevent Vitest uncaught exceptions
        });

        req.end(() => {});

        req.on('response', (res) => {
          try {
            expect(res.headers['content-type']).toContain('text/event-stream');
            expect(res.headers['cache-control']).toBe('no-cache');
            expect(res.headers['connection']).toBe('keep-alive');
            res.destroy();
            telemetryEngine.stop();
            resolve();
          } catch (err) {
            res.destroy();
            telemetryEngine.stop();
            reject(err);
          }
        });
      });
    });
  });
});
