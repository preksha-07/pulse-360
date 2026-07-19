import { TelemetryState } from '../telemetry/types';

export interface PredictionPoint {
  timeOffsetMinutes: number; // e.g., 10, 20, 30
  value: number; // e.g., predicted capacity percent or queue length
  confidencePercent: number;
}

export interface RiskPrediction {
  id: string;
  category: 'gate_overload' | 'crowd_surge' | 'volunteer_shortage' | 'transport_surge' | 'emergency_alert' | 'vip_flow' | 'weather_hazard';
  targetId: string; // e.g., 'g6'
  title: string;
  probabilityPercent: number;
  timeToImpactMinutes: number;
  reasoning: string[];
  confidencePercent: number; // Added explainability confidence
}

export interface TimelineRecommendation {
  timeOffsetMinutes: number;
  label: string;
  title: string;
  action: string;
  confidencePercent: number;
}

export interface PredictionState {
  currentTelemetry: TelemetryState;
  risks: RiskPrediction[];
  timeline: {
    gates: Record<string, PredictionPoint[]>;
  };
  timelineRecommendations: TimelineRecommendation[]; // Added operational timeline recommendations
}
