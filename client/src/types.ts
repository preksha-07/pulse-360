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
  
  // New simulation & health metrics (made optional to prevent test breaks)
  stadiumHealth?: number;
  crowdSafety?: number;
  transportHealth?: number;
  securityHealth?: number;
  volunteerCoverage?: number;
  evacuationReadiness?: number;
  activeScenario?: string;
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
  confidencePercent?: number; // Optional explainability confidence
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
  timelineRecommendations?: TimelineRecommendation[]; // Optional timeline recommendations
}
export interface AgentRecommendation {
  id: string;
  domain: string;
  action: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidencePercent?: number; // Optional explainability confidence
}
export interface IntelligencePayload {
  telemetry: TelemetryState;
  predictions: PredictionState;
  recommendations: AgentRecommendation[];
}
