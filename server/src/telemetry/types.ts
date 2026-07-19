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
  
  // New simulation & health metrics
  stadiumHealth: number;
  crowdSafety: number;
  transportHealth: number;
  securityHealth: number;
  volunteerCoverage: number;
  evacuationReadiness: number;
  activeScenario: string;
}
