import { TelemetryState } from './types';

export class TelemetryEngine {
  public state: TelemetryState;
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

  private tick() {
    this.state.timestamp = new Date().toISOString();
    
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
      // Decrement simulated minutes (faster than real-time for demo purposes)
      t.nextArrivalMinutes -= (2 / 60) * 10; 
      
      if (t.nextArrivalMinutes <= 0) {
        // Reset arrival time
        t.nextArrivalMinutes = t.type === 'metro' ? 15 : 20; 
        
        // When metro arrives, spike Gate 6 (Transit Link) capacity
        const targetGate = this.state.gates.find(g => g.id === 'g6');
        if (targetGate) {
          targetGate.capacityPercent = Math.min(100, targetGate.capacityPercent + 15);
          targetGate.queueTimeMinutes += 12;
        }
        
        // Spike nearby zone
        const targetZone = this.state.zones.find(z => z.id === 'z_south');
        if (targetZone) {
          targetZone.crowdDensityPercent = Math.min(100, targetZone.crowdDensityPercent + 10);
        }
      }
    });

    // Notify all listeners (e.g. SSE clients)
    this.listeners.forEach(l => l(this.state));
  }
}

export const telemetryEngine = new TelemetryEngine();
