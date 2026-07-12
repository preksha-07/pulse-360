import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FanPortal from '../components/FanPortal';
import type { IntelligencePayload } from '../types';

const mockData: IntelligencePayload = {
  telemetry: {
    timestamp: new Date().toISOString(),
    gates: [
      { id: 'g1', name: 'Gate 1 (North)', queueTimeMinutes: 10, capacityPercent: 50 },
      { id: 'g6', name: 'Gate 6 (Transit Link)', queueTimeMinutes: 20, capacityPercent: 80 },
      { id: 'g11', name: 'Gate 11 (VIP)', queueTimeMinutes: 2, capacityPercent: 12 }
    ],
    zones: [
      { id: 'z_north', name: 'North Concourse', crowdDensityPercent: 60 }
    ],
    transport: [
      { id: 'm1', type: 'metro', nextArrivalMinutes: 5, expectedPassengers: 400 },
      { id: 'b1', type: 'bus', nextArrivalMinutes: 12, expectedPassengers: 50 }
    ],
    sustainability: { energyUsageKw: 100, waterUsageLiters: 100, wasteKg: 10 },
    volunteers: []
  },
  predictions: {
    currentTelemetry: null as any,
    risks: [],
    timeline: { gates: {} }
  },
  recommendations: []
};

describe('FanPortal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render recommended entry gate details', () => {
    render(<FanPortal data={mockData} />);

    // Lowest capacity is VIP gate at 12%
    expect(screen.getByText('Gate 11 (VIP)')).toBeInTheDocument();
    expect(screen.getByText('⏱ 2 min wait')).toBeInTheDocument();
    expect(screen.getByText('👥 12% capacity')).toBeInTheDocument();
    expect(screen.getByText(/Best option right now/)).toBeInTheDocument();
  });

  it('should show transport arrival information', () => {
    render(<FanPortal data={mockData} />);

    expect(screen.getByText('🚇 Metro')).toBeInTheDocument();
    expect(screen.getByText('5m')).toBeInTheDocument();
    expect(screen.getByText('🚌 Shuttle Bus')).toBeInTheDocument();
    expect(screen.getByText('12m')).toBeInTheDocument();
  });

  it('should allow selecting alternative languages', () => {
    render(<FanPortal data={mockData} />);

    const spanishBtn = screen.getByRole('button', { name: 'Spanish' });
    expect(spanishBtn).toBeInTheDocument();

    fireEvent.click(spanishBtn);
    expect(screen.getByPlaceholderText('Ask anything in Spanish...')).toBeInTheDocument();
  });

  it('should post chat message and display response', async () => {
    const user = userEvent.setup();
    const mockReplyText = 'The nearest food court is located in section C.';
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve({ reply: mockReplyText })
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<FanPortal data={mockData} />);

    const input = screen.getByPlaceholderText('Ask anything in English...');
    const sendBtn = screen.getByRole('button', { name: 'Send →' });

    await user.type(input, 'Where is the food?');
    await user.click(sendBtn);

    // Message cleared
    expect(input).toHaveValue('');
    
    // User message shown
    expect(screen.getByText('Where is the food?')).toBeInTheDocument();

    // AI message shown
    expect(await screen.findByText(mockReplyText)).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/ai/fan-assist'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ message: 'Where is the food?', language: 'English' })
      })
    );
  });

  it('should display error fallback when api communication fails', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));

    render(<FanPortal data={mockData} />);

    const input = screen.getByPlaceholderText('Ask anything in English...');
    const sendBtn = screen.getByRole('button', { name: 'Send →' });

    await user.type(input, 'Hello');
    await user.click(sendBtn);

    expect(await screen.findByText('Unable to connect to assistant right now.')).toBeInTheDocument();
  });
});
