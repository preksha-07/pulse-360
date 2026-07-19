import { TelemetryState } from './types';

export class TelemetryEngine {
  public state: TelemetryState;
  public activeScenario: string = 'none';
  private listeners: ((state: TelemetryState) => void)[] = [];
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): TelemetryState {
    return {
      timestamp: new Date().toISOString(),
      gates: [
        { id: 'g1', name: 'Gate 1 (North)', queueTimeMinutes: 12, capacityPercent: 45 },
        { id: 'g6', name: 'Gate 6 (Transit Link)', queueTimeMinutes: 22, capacityPercent: 78 },
        { id: 'g11', name: 'Gate 11 (VIP)', queueTimeMinutes: 5, capacityPercent: 20 },
      ],
      zones: [
        { id: 'z_north', name: 'North Concourse', crowdDensityPercent: 65 },
        { id: 'z_south', name: 'South Concourse', crowdDensityPercent: 40 },
        { id: 'z_food_a', name: 'Food Court A', crowdDensityPercent: 82 },
      ],
      transport: [
        { id: 'm1', type: 'metro', nextArrivalMinutes: 8, expectedPassengers: 450 },
        { id: 'b1', type: 'bus', nextArrivalMinutes: 14, expectedPassengers: 60 },
      ],
      sustainability: {
        energyUsageKw: 4500,
        waterUsageLiters: 12000,
        wasteKg: 350,
      },
      volunteers: [
        { id: 'v1', name: 'Alice M.', zoneId: 'z_north', status: 'active' },
        { id: 'v2', name: 'Bob T.', zoneId: 'z_food_a', status: 'active' },
        { id: 'v3', name: 'Charlie P.', zoneId: 'z_south', status: 'active' },
      ],
      // Base health metrics
      stadiumHealth: 87,
      crowdSafety: 92,
      transportHealth: 81,
      securityHealth: 95,
      volunteerCoverage: 90,
      evacuationReadiness: 94,
      activeScenario: 'none',
    };
  }

  public subscribe(callback: (state: TelemetryState) => void) {
    this.listeners.push(callback);
    callback(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public start(tickMs: number = 2000) {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.tick();
    }, tickMs);
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  public setActiveScenario(scenario: string) {
    this.activeScenario = scenario;
    this.state.activeScenario = scenario;
    this.applyScenarioOverrides(scenario);
    this.listeners.forEach(l => l(this.state));
  }

  private applyScenarioOverrides(scenario: string) {
    if (scenario === 'none') {
      const base = this.getInitialState();
      this.state.gates = base.gates;
      this.state.zones = base.zones;
      this.state.transport = base.transport;
      this.state.sustainability = base.sustainability;
      this.state.volunteers = base.volunteers;
      this.state.stadiumHealth = base.stadiumHealth;
      this.state.crowdSafety = base.crowdSafety;
      this.state.transportHealth = base.transportHealth;
      this.state.securityHealth = base.securityHealth;
      this.state.volunteerCoverage = base.volunteerCoverage;
      this.state.evacuationReadiness = base.evacuationReadiness;
      return;
    }

    if (scenario === 'heavy_rain') {
      this.state.crowdSafety = 70;
      this.state.transportHealth = 65;
      this.state.securityHealth = 80;
      this.state.volunteerCoverage = 75;
      this.state.evacuationReadiness = 60;
      this.state.stadiumHealth = Math.round((70 + 65 + 80 + 75) / 4);

      this.state.gates = [
        { id: 'g1', name: 'Gate 1 (North)', queueTimeMinutes: 35, capacityPercent: 88 },
        { id: 'g6', name: 'Gate 6 (Transit Link)', queueTimeMinutes: 40, capacityPercent: 92 },
        { id: 'g11', name: 'Gate 11 (VIP)', queueTimeMinutes: 15, capacityPercent: 45 },
      ];
      this.state.zones = [
        { id: 'z_north', name: 'North Concourse', crowdDensityPercent: 85 },
        { id: 'z_south', name: 'South Concourse', crowdDensityPercent: 82 },
        { id: 'z_food_a', name: 'Food Court A', crowdDensityPercent: 90 },
      ];
      this.state.transport = [
        { id: 'm1', type: 'metro', nextArrivalMinutes: 12, expectedPassengers: 550 },
        { id: 'b1', type: 'bus', nextArrivalMinutes: 18, expectedPassengers: 90 },
      ];
      this.state.sustainability = {
        energyUsageKw: 5800,
        waterUsageLiters: 14500,
        wasteKg: 480,
      };
      this.state.volunteers = [
        { id: 'v1', name: 'Alice M.', zoneId: 'z_north', status: 'reassigning' },
        { id: 'v2', name: 'Bob T.', zoneId: 'z_food_a', status: 'break' },
        { id: 'v3', name: 'Charlie P.', zoneId: 'z_south', status: 'active' },
      ];
    } else if (scenario === 'metro_delay') {
      this.state.crowdSafety = 78;
      this.state.transportHealth = 40;
      this.state.securityHealth = 88;
      this.state.volunteerCoverage = 80;
      this.state.evacuationReadiness = 75;
      this.state.stadiumHealth = Math.round((78 + 40 + 88 + 80) / 4);

      this.state.gates = [
        { id: 'g1', name: 'Gate 1 (North)', queueTimeMinutes: 14, capacityPercent: 55 },
        { id: 'g6', name: 'Gate 6 (Transit Link)', queueTimeMinutes: 48, capacityPercent: 98 },
        { id: 'g11', name: 'Gate 11 (VIP)', queueTimeMinutes: 6, capacityPercent: 25 },
      ];
      this.state.zones = [
        { id: 'z_north', name: 'North Concourse', crowdDensityPercent: 60 },
        { id: 'z_south', name: 'South Concourse', crowdDensityPercent: 95 },
        { id: 'z_food_a', name: 'Food Court A', crowdDensityPercent: 75 },
      ];
      this.state.transport = [
        { id: 'm1', type: 'metro', nextArrivalMinutes: 25, expectedPassengers: 1200 },
        { id: 'b1', type: 'bus', nextArrivalMinutes: 5, expectedPassengers: 180 },
      ];
      this.state.sustainability = {
        energyUsageKw: 4800,
        waterUsageLiters: 12500,
        wasteKg: 380,
      };
      this.state.volunteers = [
        { id: 'v1', name: 'Alice M.', zoneId: 'z_north', status: 'active' },
        { id: 'v2', name: 'Bob T.', zoneId: 'z_south', status: 'reassigning' },
        { id: 'v3', name: 'Charlie P.', zoneId: 'z_south', status: 'active' },
      ];
    } else if (scenario === 'medical') {
      this.state.crowdSafety = 82;
      this.state.transportHealth = 85;
      this.state.securityHealth = 75;
      this.state.volunteerCoverage = 88;
      this.state.evacuationReadiness = 80;
      this.state.stadiumHealth = Math.round((82 + 85 + 75 + 88) / 4);

      this.state.gates = [
        { id: 'g1', name: 'Gate 1 (North)', queueTimeMinutes: 12, capacityPercent: 48 },
        { id: 'g6', name: 'Gate 6 (Transit Link)', queueTimeMinutes: 20, capacityPercent: 75 },
        { id: 'g11', name: 'Gate 11 (VIP)', queueTimeMinutes: 8, capacityPercent: 35 },
      ];
      this.state.zones = [
        { id: 'z_north', name: 'North Concourse', crowdDensityPercent: 62 },
        { id: 'z_south', name: 'South Concourse', crowdDensityPercent: 92 },
        { id: 'z_food_a', name: 'Food Court A', crowdDensityPercent: 80 },
      ];
      this.state.volunteers = [
        { id: 'v1', name: 'Alice M.', zoneId: 'z_north', status: 'active' },
        { id: 'v2', name: 'Bob T.', zoneId: 'z_food_a', status: 'active' },
        { id: 'v3', name: 'Charlie P.', zoneId: 'z_south', status: 'reassigning' },
      ];
    } else if (scenario === 'gate_closure') {
      this.state.crowdSafety = 65;
      this.state.transportHealth = 70;
      this.state.securityHealth = 82;
      this.state.volunteerCoverage = 85;
      this.state.evacuationReadiness = 50;
      this.state.stadiumHealth = Math.round((65 + 70 + 82 + 85) / 4);

      this.state.gates = [
        { id: 'g1', name: 'Gate 1 (North)', queueTimeMinutes: 38, capacityPercent: 95 },
        { id: 'g6', name: 'Gate 6 (Transit Link)', queueTimeMinutes: 0, capacityPercent: 0 },
        { id: 'g11', name: 'Gate 11 (VIP)', queueTimeMinutes: 20, capacityPercent: 60 },
      ];
      this.state.zones = [
        { id: 'z_north', name: 'North Concourse', crowdDensityPercent: 88 },
        { id: 'z_south', name: 'South Concourse', crowdDensityPercent: 45 },
        { id: 'z_food_a', name: 'Food Court A', crowdDensityPercent: 85 },
      ];
      this.state.volunteers = [
        { id: 'v1', name: 'Alice M.', zoneId: 'z_north', status: 'reassigning' },
        { id: 'v2', name: 'Bob T.', zoneId: 'z_north', status: 'reassigning' },
        { id: 'v3', name: 'Charlie P.', zoneId: 'z_south', status: 'active' },
      ];
    } else if (scenario === 'vip') {
      this.state.crowdSafety = 88;
      this.state.transportHealth = 80;
      this.state.securityHealth = 60;
      this.state.volunteerCoverage = 85;
      this.state.evacuationReadiness = 85;
      this.state.stadiumHealth = Math.round((88 + 80 + 60 + 85) / 4);

      this.state.gates = [
        { id: 'g1', name: 'Gate 1 (North)', queueTimeMinutes: 10, capacityPercent: 40 },
        { id: 'g6', name: 'Gate 6 (Transit Link)', queueTimeMinutes: 18, capacityPercent: 70 },
        { id: 'g11', name: 'Gate 11 (VIP)', queueTimeMinutes: 28, capacityPercent: 90 },
      ];
      this.state.zones = [
        { id: 'z_north', name: 'North Concourse', crowdDensityPercent: 85 },
        { id: 'z_south', name: 'South Concourse', crowdDensityPercent: 38 },
        { id: 'z_food_a', name: 'Food Court A', crowdDensityPercent: 70 },
      ];
      this.state.volunteers = [
        { id: 'v1', name: 'Alice M.', zoneId: 'z_north', status: 'active' },
        { id: 'v2', name: 'Bob T.', zoneId: 'z_food_a', status: 'active' },
        { id: 'v3', name: 'Charlie P.', zoneId: 'z_south', status: 'break' },
      ];
    } else if (scenario === 'goal_surge') {
      this.state.crowdSafety = 55;
      this.state.transportHealth = 88;
      this.state.securityHealth = 85;
      this.state.volunteerCoverage = 70;
      this.state.evacuationReadiness = 70;
      this.state.stadiumHealth = Math.round((55 + 88 + 85 + 70) / 4);

      this.state.gates = [
        { id: 'g1', name: 'Gate 1 (North)', queueTimeMinutes: 8, capacityPercent: 35 },
        { id: 'g6', name: 'Gate 6 (Transit Link)', queueTimeMinutes: 15, capacityPercent: 65 },
        { id: 'g11', name: 'Gate 11 (VIP)', queueTimeMinutes: 4, capacityPercent: 15 },
      ];
      this.state.zones = [
        { id: 'z_north', name: 'North Concourse', crowdDensityPercent: 95 },
        { id: 'z_south', name: 'South Concourse', crowdDensityPercent: 88 },
        { id: 'z_food_a', name: 'Food Court A', crowdDensityPercent: 97 },
      ];
      this.state.sustainability = {
        energyUsageKw: 6500,
        waterUsageLiters: 22000,
        wasteKg: 600,
      };
      this.state.volunteers = [
        { id: 'v1', name: 'Alice M.', zoneId: 'z_north', status: 'break' },
        { id: 'v2', name: 'Bob T.', zoneId: 'z_food_a', status: 'active' },
        { id: 'v3', name: 'Charlie P.', zoneId: 'z_south', status: 'active' },
      ];
    }
  }

  private tick() {
    this.state.timestamp = new Date().toISOString();

    // If activeScenario is none, run standard fluctuations
    if (this.activeScenario === 'none') {
      // Simulate gate fluctuation
      this.state.gates.forEach(g => {
        const deltaQueue = Math.random() > 0.5 ? 1 : -1;
        const deltaCap = Math.random() > 0.5 ? 2 : -2;
        g.queueTimeMinutes = Math.max(0, g.queueTimeMinutes + deltaQueue);
        g.capacityPercent = Math.min(100, Math.max(0, g.capacityPercent + deltaCap));
      });

      // Simulate crowd zone fluctuation
      this.state.zones.forEach(z => {
        const deltaCap = Math.random() > 0.5 ? 1 : -1;
        z.crowdDensityPercent = Math.min(100, Math.max(0, z.crowdDensityPercent + deltaCap));
      });

      // Simulate transport arrival logic
      this.state.transport.forEach(t => {
        t.nextArrivalMinutes -= (2 / 60) * 10;
        if (t.nextArrivalMinutes <= 0) {
          t.nextArrivalMinutes = t.type === 'metro' ? 15 : 20;
          const targetGate = this.state.gates.find(g => g.id === 'g6');
          if (targetGate) {
            targetGate.capacityPercent = Math.min(100, targetGate.capacityPercent + 15);
            targetGate.queueTimeMinutes += 12;
          }
          const targetZone = this.state.zones.find(z => z.id === 'z_south');
          if (targetZone) {
            targetZone.crowdDensityPercent = Math.min(100, targetZone.crowdDensityPercent + 10);
          }
        }
      });

      // Fluctuate health scores slightly around baseline
      const fluctuate = (val: number, min = 50, max = 100) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.min(max, Math.max(min, val + delta));
      };
      this.state.crowdSafety = fluctuate(this.state.crowdSafety, 85, 98);
      this.state.transportHealth = fluctuate(this.state.transportHealth, 75, 90);
      this.state.securityHealth = fluctuate(this.state.securityHealth, 90, 99);
      this.state.volunteerCoverage = fluctuate(this.state.volunteerCoverage, 85, 95);
      this.state.evacuationReadiness = fluctuate(this.state.evacuationReadiness, 90, 98);
      this.state.stadiumHealth = Math.round(
        (this.state.crowdSafety + this.state.transportHealth + this.state.securityHealth + this.state.volunteerCoverage) / 4
      );
    } else {
      // In active simulation mode, do minor live fluctuations around active overrides
      this.state.gates.forEach(g => {
        if (g.capacityPercent > 0) {
          const delta = Math.random() > 0.5 ? 1 : -1;
          g.capacityPercent = Math.min(100, Math.max(10, g.capacityPercent + delta));
          g.queueTimeMinutes = Math.max(1, g.queueTimeMinutes + (Math.random() > 0.7 ? delta : 0));
        }
      });
      this.state.zones.forEach(z => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        z.crowdDensityPercent = Math.min(100, Math.max(10, z.crowdDensityPercent + delta));
      });

      // Gradually resolve/move transport timers
      this.state.transport.forEach(t => {
        t.nextArrivalMinutes -= (2 / 60) * 10;
        if (t.nextArrivalMinutes <= 0) {
          t.nextArrivalMinutes = t.type === 'metro' ? 20 : 15;
        }
      });

      // Subtle fluctuation on metrics
      const delta = Math.random() > 0.5 ? 1 : -1;
      this.state.stadiumHealth = Math.min(100, Math.max(10, this.state.stadiumHealth + (Math.random() > 0.8 ? delta : 0)));
    }

    // Notify all listeners (e.g. SSE streams)
    this.listeners.forEach(l => l(this.state));
  }
}

export const telemetryEngine = new TelemetryEngine();
