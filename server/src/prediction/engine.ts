import { TelemetryState } from '../telemetry/types';
import { PredictionState, RiskPrediction, PredictionPoint } from './types';

export class PredictionEngine {
  
  public generatePredictions(currentState: TelemetryState): PredictionState {
    const risks: RiskPrediction[] = [];
    const timeline: { gates: Record<string, PredictionPoint[]> } = { gates: {} };
    const activeScenario = currentState.activeScenario;

    // 1. Add scenario-specific risks
    if (activeScenario === 'heavy_rain') {
      risks.push({
        id: `risk_rain_flood_${Date.now()}`,
        category: 'weather_hazard',
        targetId: 'z_south',
        title: 'Standing Water in South Concourse',
        probabilityPercent: 94,
        timeToImpactMinutes: 10,
        confidencePercent: 96,
        reasoning: [
          'Concourse drainage systems operating at maximum load under heavy rain',
          'Expected localized flooding in low-elevation concourse pathways'
        ]
      });
      risks.push({
        id: `risk_rain_slips_${Date.now()}`,
        category: 'gate_overload',
        targetId: 'g1',
        title: 'Gate 1 Entry Slip Hazard',
        probabilityPercent: 88,
        timeToImpactMinutes: 5,
        confidencePercent: 94,
        reasoning: [
          'Slippery tiles at ticketing turnstiles due to wind-driven rain',
          'Gate 1 load is elevated at 88% capacity'
        ]
      });
    } else if (activeScenario === 'metro_delay') {
      risks.push({
        id: `risk_metro_backup_${Date.now()}`,
        category: 'transport_surge',
        targetId: 'g6',
        title: 'Metro Platform Congestion',
        probabilityPercent: 98,
        timeToImpactMinutes: 20,
        confidencePercent: 97,
        reasoning: [
          '25-minute metro service interruption reported',
          '1,200+ transit-bound fans currently backing up at Gate 6 platform'
        ]
      });
    } else if (activeScenario === 'medical') {
      risks.push({
        id: `risk_med_bottle_${Date.now()}`,
        category: 'emergency_alert',
        targetId: 'z_south',
        title: 'First Aid Bottleneck (South)',
        probabilityPercent: 99,
        timeToImpactMinutes: 0,
        confidencePercent: 99,
        reasoning: [
          'First-aid call active in Section 104 seating bowl entrance',
          'Crowd density is at 92%, blocking response team lanes'
        ]
      });
    } else if (activeScenario === 'gate_closure') {
      risks.push({
        id: `risk_gate_shut_${Date.now()}`,
        category: 'gate_overload',
        targetId: 'g6',
        title: 'Gate 6 Transit Link Closed',
        probabilityPercent: 99,
        timeToImpactMinutes: 0,
        confidencePercent: 99,
        reasoning: [
          'Gate 6 scanners disabled; security perimeter sweep in progress',
          'All transit arriving passengers must be diverted immediately'
        ]
      });
      risks.push({
        id: `risk_gate_divert_${Date.now()}`,
        category: 'gate_overload',
        targetId: 'g1',
        title: 'Extreme Bottleneck at Gate 1',
        probabilityPercent: 90,
        timeToImpactMinutes: 10,
        confidencePercent: 92,
        reasoning: [
          'Gate 1 capacity peaks at 95% due to Gate 6 closure divert',
          'Wait times expected to exceed 38 minutes'
        ]
      });
    } else if (activeScenario === 'vip') {
      risks.push({
        id: `risk_vip_security_${Date.now()}`,
        category: 'vip_flow',
        targetId: 'g11',
        title: 'VIP Pathway Isolation Alert',
        probabilityPercent: 95,
        timeToImpactMinutes: 5,
        confidencePercent: 95,
        reasoning: [
          'Limo motorcade has entered stadium boundary line',
          'Gate 11 and VIP concourse routes must remain isolated'
        ]
      });
    } else if (activeScenario === 'goal_surge') {
      risks.push({
        id: `risk_goal_density_${Date.now()}`,
        category: 'crowd_surge',
        targetId: 'z_food_a',
        title: 'Halftime Rush Congestion',
        probabilityPercent: 96,
        timeToImpactMinutes: 8,
        confidencePercent: 93,
        reasoning: [
          'Halftime concessions surge peaks density at Food Court A (97%)',
          'High risk of concession queue spillovers onto main paths'
        ]
      });
      risks.push({
        id: `risk_goal_sanitation_${Date.now()}`,
        category: 'volunteer_shortage',
        targetId: 'z_north',
        title: 'Sanitation Waste Overload',
        probabilityPercent: 89,
        timeToImpactMinutes: 15,
        confidencePercent: 88,
        reasoning: [
          'Waste bin capacity exceeded by 40% in North Concourse',
          'High waste generation rate from concessions run'
        ]
      });
    } else {
      // Normal state: analyze transport for surges
      const upcomingMetro = currentState.transport.find(t => t.type === 'metro' && t.nextArrivalMinutes <= 15);
      if (upcomingMetro) {
        risks.push({
          id: `risk_metro_${Date.now()}`,
          category: 'transport_surge',
          targetId: 'g6',
          title: 'Impending Metro Surge at Gate 6',
          probabilityPercent: 92,
          timeToImpactMinutes: Math.floor(upcomingMetro.nextArrivalMinutes),
          confidencePercent: 94,
          reasoning: [
            `Metro arriving in ${Math.floor(upcomingMetro.nextArrivalMinutes)} minutes`,
            `Expected ${upcomingMetro.expectedPassengers} passengers`,
            `Current gate capacity is at ${currentState.gates.find(g => g.id === 'g6')?.capacityPercent}%`
          ]
        });
      }
    }

    // 2. Generate Gate Capacity timeline predictions (+10, +20, +30 min)
    currentState.gates.forEach(gate => {
      const baseQueue = gate.queueTimeMinutes;
      const baseCap = gate.capacityPercent;
      const pts: PredictionPoint[] = [];

      [10, 20, 30].forEach(offset => {
        let predictedCap = baseCap;
        let confidence = 100 - offset; // Confidence drops further into future

        const metro = currentState.transport.find(t => t.type === 'metro');
        if (gate.id === 'g6' && metro && metro.nextArrivalMinutes <= offset && (!activeScenario || activeScenario === 'none')) {
          predictedCap += 30;
        } else if (activeScenario === 'gate_closure' && gate.id === 'g6') {
          predictedCap = 0;
        } else if (activeScenario === 'gate_closure' && gate.id === 'g1') {
          predictedCap = Math.min(100, predictedCap + 15);
        } else if (activeScenario === 'heavy_rain') {
          predictedCap = Math.min(100, predictedCap + 8);
        } else if (gate.id === 'g6' && activeScenario === 'metro_delay') {
          predictedCap = Math.min(100, predictedCap + 12);
        } else {
          // Normal fluctuation towards 50%
          predictedCap = predictedCap > 50 ? predictedCap - (offset / 2) : predictedCap + (offset / 2);
        }

        pts.push({
          timeOffsetMinutes: offset,
          value: Math.floor(Math.min(100, Math.max(0, predictedCap))),
          confidencePercent: confidence
        });
      });
      timeline.gates[gate.id] = pts;

      // In normal mode, trigger gate overload risk alert if capacity climbs high
      if ((!activeScenario || activeScenario === 'none') && (gate.capacityPercent > 80 || pts[0].value > 85)) {
        if (!risks.find(r => r.targetId === gate.id)) {
          risks.push({
            id: `risk_gate_${gate.id}_${Date.now()}`,
            category: 'gate_overload',
            targetId: gate.id,
            title: `${gate.name} Overload`,
            probabilityPercent: gate.capacityPercent > 80 ? 99 : 85,
            timeToImpactMinutes: gate.capacityPercent > 80 ? 0 : 10,
            confidencePercent: 94,
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
      timeline,
      timelineRecommendations: [] // filled by decisionEngine in index.ts/SSE
    };
  }
}

export const predictionEngine = new PredictionEngine();
