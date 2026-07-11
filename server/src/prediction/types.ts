import { TelemetryState } from '../telemetry/types';

export interface PredictionPoint {
  timeOffsetMinutes: number; // e.g., 10, 20, 30
  value: number; // e.g., predicted capacity percent or queue length
  confidencePercent: number;
}

export interface RiskPrediction {
  id: string;
  category: 'gate_overload' | 'crowd_surge' | 'volunteer_shortage' | 'transport_surge';
  targetId: string; // e.g., 'g6'
  title: string;
  probabilityPercent: number;
  timeToImpactMinutes: number;
  reasoning: string[];
}

export interface PredictionState {
  currentTelemetry: TelemetryState;
  risks: RiskPrediction[];
  timeline: {
    gates: Record<string, PredictionPoint[]>;
  };
}
