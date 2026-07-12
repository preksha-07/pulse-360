import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock EventSource globally
class MockEventSource {
  url: string;
  onmessage: ((ev: any) => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(url: string) {
    this.url = url;
  }
  close() {}
}

vi.stubGlobal('EventSource', MockEventSource);

// Mock fetch globally
vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
  Promise.resolve({
    json: () => Promise.resolve({ briefing: 'Mocked Briefing', generatedAt: new Date().toISOString() })
  })
));

// Mock window.scrollIntoView since jsdom doesn't implement it
Element.prototype.scrollIntoView = vi.fn();
