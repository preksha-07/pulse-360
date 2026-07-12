import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VolunteerPortal from '../components/VolunteerPortal';
import type { IntelligencePayload } from '../types';

const mockData: IntelligencePayload = {
  telemetry: {
    timestamp: new Date().toISOString(),
    gates: [],
    zones: [
      { id: 'z_north', name: 'North Concourse', crowdDensityPercent: 80 }, // Needs move since load > 70
      { id: 'z_south', name: 'South Concourse', crowdDensityPercent: 40 }
    ],
    transport: [],
    sustainability: { energyUsageKw: 100, waterUsageLiters: 100, wasteKg: 10 },
    volunteers: [
      { id: 'v1', name: 'Alice M.', zoneId: 'z_north', status: 'active' },
      { id: 'v2', name: 'Bob T.', zoneId: 'z_south', status: 'reassigning' }
    ]
  },
  predictions: {
    currentTelemetry: null as any,
    risks: [
      {
        id: 'r1',
        category: 'gate_overload',
        targetId: 'g1',
        title: 'Overload Threat at Gate 1',
        probabilityPercent: 88,
        timeToImpactMinutes: 15,
        reasoning: []
      }
    ],
    timeline: { gates: {} }
  },
  recommendations: [
    {
      id: 'rec_v',
      domain: 'volunteer',
      action: 'Deploy extra support to Gate 1',
      reasoning: 'Alleviate volunteer congestion',
      priority: 'high'
    }
  ]
};

describe('VolunteerPortal Component', () => {
  it('should render roster with volunteer names and zones', () => {
    render(<VolunteerPortal data={mockData} />);

    expect(screen.getByText('Alice M.')).toBeInTheDocument();
    expect(screen.getByText(/Zone: North Concourse · Density: 80%/)).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();

    expect(screen.getByText('Bob T.')).toBeInTheDocument();
    expect(screen.getByText(/Zone: South Concourse · Density: 40%/)).toBeInTheDocument();
    expect(screen.getByText('REASSIGNING')).toBeInTheDocument();
  });

  it('should flag volunteers in high density zones for reassignment', () => {
    render(<VolunteerPortal data={mockData} />);

    expect(screen.getByText('⚡ AI suggests reassignment — zone is crowded')).toBeInTheDocument();
  });

  it('should display AI task recommendations and details', () => {
    render(<VolunteerPortal data={mockData} />);

    expect(screen.getByText('VOLUNTEER AGENT')).toBeInTheDocument();
    expect(screen.getByText('Deploy extra support to Gate 1')).toBeInTheDocument();
    expect(screen.getByText('Alleviate volunteer congestion')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ACKNOWLEDGE & DEPLOY' })).toBeInTheDocument();
  });

  it('should display Standby status badge when there are no assignments', () => {
    const dataNoRecs = { ...mockData, recommendations: [] };
    render(<VolunteerPortal data={dataNoRecs} />);

    expect(screen.getByText('STANDBY')).toBeInTheDocument();
    expect(screen.getByText('✓ All volunteers optimally placed')).toBeInTheDocument();
  });

  it('should show zone list overview and counts', () => {
    render(<VolunteerPortal data={mockData} />);

    expect(screen.getByText('North Concourse')).toBeInTheDocument();
    expect(screen.getByText('Density: 80%')).toBeInTheDocument();
    expect(screen.getAllByText('👷 1')).toHaveLength(2);
  });

  it('should list upcoming risks', () => {
    render(<VolunteerPortal data={mockData} />);

    expect(screen.getByText('Overload Threat at Gate 1')).toBeInTheDocument();
    expect(screen.getByText(/Impact in 15 min · 88% probability/)).toBeInTheDocument();
  });
});
