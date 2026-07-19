import { describe, it, expect, beforeEach } from 'vitest';
import { CoordinatorAgent } from '../agents/coordinator';
import { PredictionState } from '../prediction/types';

describe('CoordinatorAgent', () => {
  let agent: CoordinatorAgent;
  let mockPrediction: PredictionState;

  beforeEach(() => {
    agent = new CoordinatorAgent();
    mockPrediction = {
      currentTelemetry: {
        timestamp: new Date().toISOString(),
        gates: [
          { id: 'g1', name: 'Gate 1', queueTimeMinutes: 5, capacityPercent: 30 },
          { id: 'g6', name: 'Gate 6', queueTimeMinutes: 10, capacityPercent: 40 },
          { id: 'g11', name: 'Gate 11', queueTimeMinutes: 2, capacityPercent: 15 }
        ],
        zones: [
          { id: 'z_north', name: 'North Stand', crowdDensityPercent: 45 }
        ],
        transport: [],
        sustainability: {
          energyUsageKw: 3500, // below threshold
          waterUsageLiters: 2000,
          wasteKg: 150
        },
        volunteers: [],
        stadiumHealth: 87,
        crowdSafety: 92,
        transportHealth: 81,
        securityHealth: 95,
        volunteerCoverage: 90,
        evacuationReadiness: 94,
        activeScenario: 'none'
      },
      risks: [],
      timeline: { gates: {} },
      timelineRecommendations: []
    };
  });

  it('should process normal predictions and return no recommendations', () => {
    const recommendations = agent.process(mockPrediction);
    expect(recommendations).toHaveLength(0);
  });

  it('should recommend volunteer reassignment and redirection on transport surge', () => {
    mockPrediction.risks.push({
      id: 'risk_transport',
      category: 'transport_surge',
      targetId: 'g6',
      title: 'Impending Metro Surge at Gate 6',
      probabilityPercent: 92,
      timeToImpactMinutes: 8,
      reasoning: ['Metro arriving soon'],
      confidencePercent: 94
    });

    const recommendations = agent.process(mockPrediction);
    expect(recommendations).toHaveLength(2);

    const volunteerRec = recommendations.find(r => r.domain === 'volunteer');
    expect(volunteerRec).toBeDefined();
    expect(volunteerRec?.priority).toBe('high');
    expect(volunteerRec?.action).toBe('Reassign 5 volunteers from South Concourse to Gate 6');
    expect(volunteerRec?.reasoning).toContain('Expected metro surge in 8 minutes');

    const navRec = recommendations.find(r => r.domain === 'navigation');
    expect(navRec).toBeDefined();
    expect(navRec?.priority).toBe('medium');
    expect(navRec?.action).toBe('Redirect incoming general admission to Gate 1');
  });

  it('should recommend opening overflow lanes when a gate overload risk is detected', () => {
    mockPrediction.risks.push({
      id: 'risk_overload',
      category: 'gate_overload',
      targetId: 'g6',
      title: 'Gate 6 Overload',
      probabilityPercent: 99,
      timeToImpactMinutes: 0,
      reasoning: ['Capacity at 95%'],
      confidencePercent: 94
    });

    const recommendations = agent.process(mockPrediction);
    expect(recommendations).toHaveLength(1);

    const rec = recommendations[0];
    expect(rec.domain).toBe('crowd');
    expect(rec.priority).toBe('critical');
    expect(rec.action).toBe('Open overflow lanes at g6');
  });

  it('should recommend dimming concourse lighting when energy consumption is above 4000kW', () => {
    mockPrediction.currentTelemetry.sustainability.energyUsageKw = 4200;

    const recommendations = agent.process(mockPrediction);
    expect(recommendations).toHaveLength(1);

    const rec = recommendations[0];
    expect(rec.domain).toBe('sustainability');
    expect(rec.priority).toBe('low');
    expect(rec.action).toBe('Dim concourse lighting by 15%');
  });

  it('should stack recommendations correctly when multiple alerts are active', () => {
    mockPrediction.currentTelemetry.sustainability.energyUsageKw = 4500;
    mockPrediction.risks.push({
      id: 'risk_overload_g1',
      category: 'gate_overload',
      targetId: 'g1',
      title: 'Gate 1 Overload',
      probabilityPercent: 95,
      timeToImpactMinutes: 0,
      reasoning: ['Queue > 20 mins'],
      confidencePercent: 94
    });

    const recommendations = agent.process(mockPrediction);
    expect(recommendations).toHaveLength(2);

    expect(recommendations.map(r => r.domain)).toContain('crowd');
    expect(recommendations.map(r => r.domain)).toContain('sustainability');
  });
});
