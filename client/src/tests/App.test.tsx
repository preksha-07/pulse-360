import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import type { IntelligencePayload } from '../types';

const mockPayload: IntelligencePayload = {
  telemetry: {
    timestamp: '2026-07-11T12:00:00.000Z',
    gates: [
      { id: 'g1', name: 'Gate 1', queueTimeMinutes: 5, capacityPercent: 30 },
      { id: 'g6', name: 'Gate 6', queueTimeMinutes: 10, capacityPercent: 40 },
      { id: 'g11', name: 'Gate 11', queueTimeMinutes: 2, capacityPercent: 15 }
    ],
    zones: [
      { id: 'z_north', name: 'North Concourse', crowdDensityPercent: 50 },
      { id: 'z_south', name: 'South Concourse', crowdDensityPercent: 20 },
      { id: 'z_food_a', name: 'Food Court A', crowdDensityPercent: 70 }
    ],
    transport: [
      { id: 'm1', type: 'metro', nextArrivalMinutes: 10, expectedPassengers: 200 }
    ],
    sustainability: { energyUsageKw: 1000, waterUsageLiters: 500, wasteKg: 50 },
    volunteers: []
  },
  predictions: { currentTelemetry: null as any, risks: [], timeline: { gates: {} } },
  recommendations: []
};

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading screen initially when data is null', () => {
    render(<App />);
    expect(screen.getByText('INITIALIZING PULSE360 TELEMETRY LINK...')).toBeInTheDocument();
  });

  it('should render main dashboard when data becomes available', async () => {
    // We simulate SSE updates by capturing the onmessage handler of the mocked EventSource.
    let onMessageCallback: ((event: any) => void) | null = null;
    
    // Stub EventSource with mock implementation
    vi.stubGlobal('EventSource', class {
      onmessage: ((ev: any) => void) | null = null;
      onerror: (() => void) | null = null;
      constructor() {
        // Expose callback so we can invoke it manually
        onMessageCallback = (ev) => {
          if (this.onmessage) this.onmessage(ev);
        };
      }
      close() {}
    });

    render(<App />);
    
    // Renders loading spinner initially
    expect(screen.getByText('INITIALIZING PULSE360 TELEMETRY LINK...')).toBeInTheDocument();

    // Trigger onmessage update
    await act(async () => {
      if (onMessageCallback) {
        onMessageCallback({ data: JSON.stringify(mockPayload) });
      }
    });

    // Renders header and logo
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('PULSE360');
    expect(await screen.findByText('Predictive AI Stadium Intelligence · FIFA World Cup 2026')).toBeInTheDocument();
    
    // Renders active tab contents (Organizer Command Center)
    expect(await screen.findByRole('tab', { name: /Command Center/ })).toHaveClass('active');
    expect(await screen.findByText('Avg Gate Capacity')).toBeInTheDocument();
  });

  it('should show error banner when connection fails', async () => {
    let onErrorCallback: (() => void) | null = null;

    vi.stubGlobal('EventSource', class {
      onmessage: any = null;
      onerror: (() => void) | null = null;
      constructor() {
        onErrorCallback = () => {
          if (this.onerror) this.onerror();
        };
      }
      close() {}
    });

    render(<App />);
    
    // Trigger error
    await act(async () => {
      if (onErrorCallback) {
        onErrorCallback();
      }
    });

    expect(await screen.findByText('Connection to Pulse360 Core lost. Retrying...')).toBeInTheDocument();
  });

  it('should switch tabs and show correct portals when tabs are clicked', async () => {
    let onMessageCallback: ((event: any) => void) | null = null;
    vi.stubGlobal('EventSource', class {
      onmessage: ((ev: any) => void) | null = null;
      constructor() {
        onMessageCallback = (ev) => {
          if (this.onmessage) this.onmessage(ev);
        };
      }
      close() {}
    });

    render(<App />);
    
    await act(async () => {
      if (onMessageCallback) {
        onMessageCallback({ data: JSON.stringify(mockPayload) });
      }
    });

    // Click Fan Portal
    const fanTab = await screen.findByRole('tab', { name: /Fan Portal/ });
    fireEvent.click(fanTab);
    expect(fanTab).toHaveClass('active');
    expect(await screen.findByText('FAN PORTAL')).toBeInTheDocument();

    // Click Volunteer
    const volTab = await screen.findByRole('tab', { name: /Volunteer/ });
    fireEvent.click(volTab);
    expect(volTab).toHaveClass('active');
    expect(await screen.findByText('VOLUNTEER PORTAL')).toBeInTheDocument();

    // Click Security
    const secTab = await screen.findByRole('tab', { name: /Security/ });
    fireEvent.click(secTab);
    expect(secTab).toHaveClass('active');
    expect(await screen.findByText('SECURITY PORTAL')).toBeInTheDocument();
  });
});
