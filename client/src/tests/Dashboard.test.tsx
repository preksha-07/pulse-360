import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Dashboard from '../components/Dashboard';
import type { IntelligencePayload } from '../types';

const mockData: IntelligencePayload = {
  telemetry: {
    timestamp: new Date().toISOString(),
    gates: [
      { id: 'g1', name: 'Gate 1 (North)', queueTimeMinutes: 10, capacityPercent: 50 },
      { id: 'g6', name: 'Gate 6 (Transit Link)', queueTimeMinutes: 20, capacityPercent: 80 },
      { id: 'g11', name: 'Gate 11 (VIP)', queueTimeMinutes: 2, capacityPercent: 10 }
    ],
    zones: [
      { id: 'z_north', name: 'North Concourse', crowdDensityPercent: 60 },
      { id: 'z_south', name: 'South Concourse', crowdDensityPercent: 30 }
    ],
    transport: [
      { id: 'm1', type: 'metro', nextArrivalMinutes: 8.5, expectedPassengers: 400 },
      { id: 'b1', type: 'bus', nextArrivalMinutes: 12, expectedPassengers: 50 }
    ],
    sustainability: {
      energyUsageKw: 4200,
      waterUsageLiters: 11000,
      wasteKg: 280
    },
    volunteers: [
      { id: 'v1', name: 'Alice M.', zoneId: 'z_north', status: 'active' },
      { id: 'v2', name: 'Bob T.', zoneId: 'z_south', status: 'break' }
    ]
  },
  predictions: {
    currentTelemetry: null as any,
    risks: [
      {
        id: 'risk_1',
        category: 'gate_overload',
        targetId: 'g6',
        title: 'Gate 6 Overload Forecast',
        probabilityPercent: 90,
        timeToImpactMinutes: 10,
        reasoning: ['Metro arriving in 8 min', 'High incoming queue']
      }
    ],
    timeline: {
      gates: {
        g6: [
          { timeOffsetMinutes: 10, value: 85, confidencePercent: 90 },
          { timeOffsetMinutes: 20, value: 90, confidencePercent: 80 },
          { timeOffsetMinutes: 30, value: 95, confidencePercent: 70 }
        ]
      }
    }
  },
  recommendations: [
    {
      id: 'rec_1',
      domain: 'volunteer',
      action: 'Reassign 5 volunteers to Gate 6',
      reasoning: 'Metro arrival surge expected',
      priority: 'high'
    }
  ]
};

describe('Dashboard Component (Organizer Command Center)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve({ briefing: 'Mocked Briefing', generatedAt: new Date().toISOString() })
      })
    ));
  });

  it('should render correct telemetry KPI values', async () => {
    const { container } = render(<Dashboard data={mockData} />);

    // Average capacity: (50 + 80 + 10) / 3 = 46.67% => 47%
    expect(container.querySelector('.kpi-value.cyan')).toHaveTextContent('47%');
    
    // Active risks: 1
    expect(container.querySelector('.kpi-value.crimson')).toHaveTextContent('1');
    
    // Active volunteers: 1 active out of 2 total
    expect(container.querySelector('.kpi-value.emerald')).toHaveTextContent('1');
    expect(screen.getByText('of 2 deployed')).toBeInTheDocument();
    
    // Next Metro: 8m
    expect(screen.getByText('8m')).toBeInTheDocument();
    expect(screen.getByText('400 passengers expected')).toBeInTheDocument();

    expect(await screen.findByText('Mocked Briefing')).toBeInTheDocument();
  });

  it('should trigger fetch for Operational Briefing on load', async () => {
    const mockBriefingText = 'Briefing synthesis operational.';
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve({ briefing: mockBriefingText, generatedAt: new Date().toISOString() })
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    await act(async () => {
      render(<Dashboard data={mockData} />);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(mockBriefingText)).toBeInTheDocument();
  });

  it('should render Gate Operations metrics and apply warning/critical classes', async () => {
    render(<Dashboard data={mockData} />);

    expect(screen.getByText('Gate 1 (North)')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    
    expect(screen.getByText('Gate 6 (Transit Link)')).toBeInTheDocument();
    expect(screen.getAllByText('80%')).toHaveLength(2);
    
    expect(screen.getByText('Gate 11 (VIP)')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();

    expect(await screen.findByText('Mocked Briefing')).toBeInTheDocument();
  });

  it('should render Predictive Timeline columns for Gate 6', async () => {
    render(<Dashboard data={mockData} />);

    expect(screen.getByText('Now')).toBeInTheDocument();
    expect(screen.getByText('+10m')).toBeInTheDocument();
    expect(screen.getByText('+20m')).toBeInTheDocument();
    expect(screen.getByText('+30m')).toBeInTheDocument();

    expect(screen.getAllByText('80%')).toHaveLength(2); // current
    expect(screen.getByText('85%')).toBeInTheDocument(); // +10m
    expect(screen.getByText('90%')).toBeInTheDocument(); // +20m
    expect(screen.getByText('95%')).toBeInTheDocument(); // +30m

    expect(await screen.findByText('Mocked Briefing')).toBeInTheDocument();
  });

  it('should display AI coordinator action cards', async () => {
    render(<Dashboard data={mockData} />);

    expect(screen.getByText(/volunteer AGENT/i)).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('Reassign 5 volunteers to Gate 6')).toBeInTheDocument();
    expect(screen.getByText('Metro arrival surge expected')).toBeInTheDocument();

    expect(await screen.findByText('Mocked Briefing')).toBeInTheDocument();
  });

  it('should display sustainability consumption figures', async () => {
    render(<Dashboard data={mockData} />);

    expect(screen.getByText('4200 kW')).toBeInTheDocument();
    expect(screen.getByText('11,000 L')).toBeInTheDocument();
    expect(screen.getByText('280 kg')).toBeInTheDocument();

    expect(await screen.findByText('Mocked Briefing')).toBeInTheDocument();
  });
});
