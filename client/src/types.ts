// Pulse360 — Shared Types v2
export interface GateData {
  id: string;
  name: string;
  queueTimeMinutes: number;
  capacityPercent: number;
}
export interface ZoneData {
  id: string;
  name: string;
  crowdDensityPercent: number;
}
export interface TransportData {
  id: string;
  type: 'metro' | 'bus';
  nextArrivalMinutes: number;
  expectedPassengers: number;
}
export interface SustainabilityData {
  energyUsageKw: number;
  waterUsageLiters: number;
  wasteKg: number;
}
export interface VolunteerData {
  id: string;
  name: string;
  zoneId: string;
  status: 'active' | 'reassigning' | 'break';
}
export interface TelemetryState {
  timestamp: string;
  gates: GateData[];
  zones: ZoneData[];
  transport: TransportData[];
  sustainability: SustainabilityData;
  volunteers: VolunteerData[];
}
export interface PredictionPoint {
  timeOffsetMinutes: number;
  value: number;
  confidencePercent: number;
}
export interface RiskPrediction {
  id: string;
  category: string;
  targetId: string;
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
export interface AgentRecommendation {
  id: string;
  domain: string;
  action: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}
export interface IntelligencePayload {
  telemetry: TelemetryState;
  predictions: PredictionState;
  recommendations: AgentRecommendation[];
}
