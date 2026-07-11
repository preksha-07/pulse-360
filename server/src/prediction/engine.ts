import { TelemetryState } from '../telemetry/types';
import { PredictionState, RiskPrediction, PredictionPoint } from './types';

export class PredictionEngine {
  
  public generatePredictions(currentState: TelemetryState): PredictionState {
    const risks: RiskPrediction[] = [];
    const timeline: { gates: Record<string, PredictionPoint[]> } = { gates: {} };

    // Analyze transport for surges
    const upcomingMetro = currentState.transport.find(t => t.type === 'metro' && t.nextArrivalMinutes <= 15);
    
    if (upcomingMetro) {
      risks.push({
        id: `risk_metro_${Date.now()}`,
        category: 'transport_surge',
        targetId: 'g6', // Assuming g6 is the transit gate
        title: 'Impending Metro Surge at Gate 6',
        probabilityPercent: 92,
        timeToImpactMinutes: Math.floor(upcomingMetro.nextArrivalMinutes),
        reasoning: [
          `Metro arriving in ${Math.floor(upcomingMetro.nextArrivalMinutes)} minutes`,
          `Expected ${upcomingMetro.expectedPassengers} passengers`,
          `Current gate capacity is at ${currentState.gates.find(g => g.id === 'g6')?.capacityPercent}%`
        ]
      });
    }

    // Analyze Gate Capacities for 10, 20, 30 min future
    currentState.gates.forEach(gate => {
      const baseQueue = gate.queueTimeMinutes;
      const baseCap = gate.capacityPercent;
      const pts: PredictionPoint[] = [];

      // Create synthetic timeline prediction
      [10, 20, 30].forEach(offset => {
        let predictedCap = baseCap;
        let confidence = 100 - offset; // Confidence drops further into future

        // If this is the transit gate and metro arrives within this offset window, predict a spike
        if (gate.id === 'g6' && upcomingMetro && upcomingMetro.nextArrivalMinutes <= offset) {
          predictedCap = Math.min(100, predictedCap + 30);
        } else {
          // Normalize towards 50% over time if no events
          predictedCap = predictedCap > 50 ? predictedCap - (offset / 2) : predictedCap + (offset / 2);
        }

        pts.push({
          timeOffsetMinutes: offset,
          value: Math.floor(predictedCap),
          confidencePercent: confidence
        });
      });
      timeline.gates[gate.id] = pts;

      // Add risk if gate is currently overloaded or predicted to be
      if (gate.capacityPercent > 80 || pts[0].value > 85) {
        if (!risks.find(r => r.targetId === gate.id)) {
           risks.push({
             id: `risk_gate_${gate.id}_${Date.now()}`,
             category: 'gate_overload',
             targetId: gate.id,
             title: `${gate.name} Overload`,
             probabilityPercent: gate.capacityPercent > 80 ? 99 : 85,
             timeToImpactMinutes: gate.capacityPercent > 80 ? 0 : 10,
             reasoning: [
               `Current capacity at ${gate.capacityPercent}%`,
               `Wait times exceeding ${gate.queueTimeMinutes} minutes`
             ]
           });
        }
      }
    });

    return {
      currentTelemetry: currentState,
      risks,
      timeline
    };
  }
}

export const predictionEngine = new PredictionEngine();
