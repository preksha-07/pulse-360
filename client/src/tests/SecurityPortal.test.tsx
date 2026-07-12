import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SecurityPortal from '../components/SecurityPortal';
import type { IntelligencePayload } from '../types';

const mockData: IntelligencePayload = {
  telemetry: {
    timestamp: new Date().toISOString(),
    gates: [
      { id: 'g1', name: 'Gate 1 (North)', queueTimeMinutes: 5, capacityPercent: 50 },
      { id: 'g6', name: 'Gate 6 (Transit Link)', queueTimeMinutes: 15, capacityPercent: 90 } // Critical
    ],
    zones: [
      { id: 'z_north', name: 'North Concourse', crowdDensityPercent: 70 }, // Medium
      { id: 'z_south', name: 'South Concourse', crowdDensityPercent: 30 }  // Low
    ],
    transport: [],
    sustainability: { energyUsageKw: 100, waterUsageLiters: 100, wasteKg: 10 },
    volunteers: []
  },
  predictions: {
    currentTelemetry: null as any,
    risks: [
      {
        id: 'r1',
        category: 'gate_overload',
        targetId: 'g6',
        title: 'Impending Gate 6 Overload',
        probabilityPercent: 95,
        timeToImpactMinutes: 5,
        reasoning: ['Heavy metro flow', 'Wait time is 15 mins']
      }
    ],
    timeline: { gates: {} }
  },
  recommendations: [
    {
      id: 'rec_s1',
      domain: 'crowd',
      action: 'Deploy emergency barricades to Gate 6',
      reasoning: 'Prevent crowd rush',
      priority: 'critical'
    }
  ]
};

describe('SecurityPortal Component', () => {
  it('should render heatmap cells with appropriate capacity classes', () => {
    const { container } = render(<SecurityPortal data={mockData} />);

    expect(screen.getByText('North Concourse')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    
    expect(screen.getByText('South Concourse')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();

    const criticalCell = container.querySelector('.heatmap-cell.high');
    expect(criticalCell).toBeInTheDocument();
    expect(criticalCell).toHaveTextContent('Gate 6');
  });

  it('should display forecasted threats with reasoning', () => {
    render(<SecurityPortal data={mockData} />);

    expect(screen.getByText('Impending Gate 6 Overload')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('Heavy metro flow')).toBeInTheDocument();
    expect(screen.getByText('Wait time is 15 mins')).toBeInTheDocument();
    expect(screen.getByText(/⚡ IMPACT IN 5 MINUTES/)).toBeInTheDocument();
  });

  it('should display evacuation time comparisons and AI plans', () => {
    render(<SecurityPortal data={mockData} />);

    expect(screen.getByText('CURRENT')).toBeInTheDocument();
    expect(screen.getByText('18m')).toBeInTheDocument();
    expect(screen.getByText('AI OPTIMIZED')).toBeInTheDocument();
    expect(screen.getByText('13m')).toBeInTheDocument();
    expect(screen.getByText('-27% improvement')).toBeInTheDocument();

    expect(screen.getByText('Open all 12 emergency exits simultaneously')).toBeInTheDocument();
    expect(screen.getByText('Direct North Stand to Gate 1 & Gate 11')).toBeInTheDocument();
  });

  it('should display Security AI Recommendations and priorities', () => {
    render(<SecurityPortal data={mockData} />);

    expect(screen.getByText('CROWD AGENT')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('Deploy emergency barricades to Gate 6')).toBeInTheDocument();
    expect(screen.getByText('Prevent crowd rush')).toBeInTheDocument();
  });

  it('should list gate status summary at the bottom', () => {
    render(<SecurityPortal data={mockData} />);

    expect(screen.getByText('GATE STATUS')).toBeInTheDocument();
    expect(screen.getByText('Gate 1 (North)')).toBeInTheDocument();
    expect(screen.getAllByText('50%')).toHaveLength(2);
    expect(screen.getByText('Gate 6 (Transit Link)')).toBeInTheDocument();
    expect(screen.getAllByText('90%')).toHaveLength(2);
  });
});
