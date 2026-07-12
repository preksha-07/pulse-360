import { describe, it, expect, beforeEach } from 'vitest';
import { PredictionEngine } from '../prediction/engine';
import { TelemetryState } from '../telemetry/types';

describe('PredictionEngine', () => {
  let engine: PredictionEngine;
  let mockState: TelemetryState;

  beforeEach(() => {
    engine = new PredictionEngine();
    mockState = {
      timestamp: new Date().toISOString(),
      gates: [
        { id: 'g1', name: 'Gate 1', queueTimeMinutes: 5, capacityPercent: 30 },
        { id: 'g6', name: 'Gate 6', queueTimeMinutes: 10, capacityPercent: 40 },
        { id: 'g11', name: 'Gate 11', queueTimeMinutes: 2, capacityPercent: 15 }
      ],
      zones: [
        { id: 'z_north', name: 'North Concourse', crowdDensityPercent: 50 }
      ],
      transport: [
        { id: 'm1', type: 'metro', nextArrivalMinutes: 20, expectedPassengers: 400 },
        { id: 'b1', type: 'bus', nextArrivalMinutes: 14, expectedPassengers: 50 }
      ],
      sustainability: {
        energyUsageKw: 3500,
        waterUsageLiters: 1000,
        wasteKg: 100
      },
      volunteers: []
    };
  });

  it('should generate predictions with no risks when state is normal', () => {
    const predictions = engine.generatePredictions(mockState);
    expect(predictions).toBeDefined();
    expect(predictions.currentTelemetry).toEqual(mockState);
    expect(predictions.risks).toHaveLength(0);
    expect(predictions.timeline.gates['g1']).toBeDefined();
  });

  it('should detect impending metro surge risk when metro is arriving in <=15 minutes', () => {
    const metro = mockState.transport.find(t => t.type === 'metro');
    if (metro) {
      metro.nextArrivalMinutes = 12; // arriving in 12 min
    }

    const predictions = engine.generatePredictions(mockState);
    expect(predictions.risks).toHaveLength(1);
    
    const risk = predictions.risks[0];
    expect(risk.category).toBe('transport_surge');
    expect(risk.targetId).toBe('g6');
    expect(risk.probabilityPercent).toBe(92);
    expect(risk.timeToImpactMinutes).toBe(12);
    expect(risk.reasoning).toContain('Metro arriving in 12 minutes');
    expect(risk.reasoning).toContain('Expected 400 passengers');
  });

  it('should decay confidence farther into the future timeline', () => {
    const predictions = engine.generatePredictions(mockState);
    const gate1Timeline = predictions.timeline.gates['g1'];
    
    expect(gate1Timeline).toHaveLength(3);
    
    // Offsets: 10, 20, 30. Confidence: 100 - offset
    expect(gate1Timeline[0].timeOffsetMinutes).toBe(10);
    expect(gate1Timeline[0].confidencePercent).toBe(90);
    
    expect(gate1Timeline[1].timeOffsetMinutes).toBe(20);
    expect(gate1Timeline[1].confidencePercent).toBe(80);
    
    expect(gate1Timeline[2].timeOffsetMinutes).toBe(30);
    expect(gate1Timeline[2].confidencePercent).toBe(70);
  });

  it('should predict capacity spike at Gate 6 when metro arrives within the offset window', () => {
    const metro = mockState.transport.find(t => t.type === 'metro');
    if (metro) {
      metro.nextArrivalMinutes = 15;
    }

    const predictions = engine.generatePredictions(mockState);
    const gate6Timeline = predictions.timeline.gates['g6'];
    
    // Since metro arrives at 15m, it is <= offset 20m and 30m. So they should spike by 30%.
    // Base is 40. Spiked should be 70 (40 + 30).
    // Wait, the logic is: 40 < 50, so for offset 10: 40 + (10 / 2) = 45.
    expect(gate6Timeline[0].value).toBe(45);
    
    // For offset 20: 15 <= 20, so spike: 40 + 30 = 70.
    expect(gate6Timeline[1].value).toBe(70);
    
    // For offset 30: 15 <= 30, so spike: 40 + 30 = 70.
    expect(gate6Timeline[2].value).toBe(70);
  });

  it('should trigger gate overload risk when current capacity exceeds 80%', () => {
    const gate1 = mockState.gates.find(g => g.id === 'g1');
    if (gate1) {
      gate1.capacityPercent = 85;
    }

    const predictions = engine.generatePredictions(mockState);
    expect(predictions.risks).toHaveLength(1);
    
    const risk = predictions.risks[0];
    expect(risk.category).toBe('gate_overload');
    expect(risk.targetId).toBe('g1');
    expect(risk.probabilityPercent).toBe(99);
    expect(risk.timeToImpactMinutes).toBe(0); // current overload
  });

  it('should trigger gate overload risk when predicted future capacity exceeds 85%', () => {
    const gate1 = mockState.gates.find(g => g.id === 'g1');
    if (gate1) {
      // 82% capacity. Under offset 10 prediction:
      // Since 82 > 50, predictedCap = 82 - 5 = 77.
      // Wait, let's look at the engine.ts:
      // If pts[0].value > 85, trigger risk.
      // Let's set gate1 capacity to 87. Under offset 10, predictedCap = 87 - 5 = 82.
      // Wait, let's set gate1 capacity to 91. predictedCap = 91 - 5 = 86 (which is > 85).
      gate1.capacityPercent = 91;
    }

    const predictions = engine.generatePredictions(mockState);
    expect(predictions.risks).toHaveLength(1);
    
    const risk = predictions.risks[0];
    expect(risk.category).toBe('gate_overload');
    expect(risk.targetId).toBe('g1');
  });
});
