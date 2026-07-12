import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TelemetryEngine } from '../telemetry/engine';

describe('TelemetryEngine', () => {
  let engine: TelemetryEngine;

  beforeEach(() => {
    engine = new TelemetryEngine();
  });

  afterEach(() => {
    engine.stop();
  });

  it('should initialize with correct default state', () => {
    const state = engine.state;
    expect(state).toBeDefined();
    expect(state.gates).toHaveLength(3);
    expect(state.zones).toHaveLength(3);
    expect(state.transport).toHaveLength(2);
    expect(state.volunteers).toHaveLength(3);
    expect(state.sustainability.energyUsageKw).toBe(4500);

    const gate6 = state.gates.find(g => g.id === 'g6');
    expect(gate6?.queueTimeMinutes).toBe(22);
    expect(gate6?.capacityPercent).toBe(78);
  });

  it('should notify subscribers upon subscription', () => {
    const callback = vi.fn();
    const unsubscribe = engine.subscribe(callback);
    
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(engine.state);
    
    unsubscribe();
  });

  it('should allow unsubscribing from updates', () => {
    const callback = vi.fn();
    const unsubscribe = engine.subscribe(callback);
    
    unsubscribe();
    
    // Trigger tick manually by reaching into private tick method
    (engine as any).tick();
    
    // Callback should only have been called once (during initial subscription)
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should set up a tick interval when start is called', () => {
    vi.useFakeTimers();
    const tickSpy = vi.spyOn(engine as any, 'tick');
    
    engine.start(1000);
    
    vi.advanceTimersByTime(2500);
    
    expect(tickSpy).toHaveBeenCalledTimes(2);
    
    vi.useRealTimers();
  });

  it('should not start multiple intervals if start is called repeatedly', () => {
    vi.useFakeTimers();
    const tickSpy = vi.spyOn(engine as any, 'tick');
    
    engine.start(1000);
    engine.start(1000);
    
    vi.advanceTimersByTime(1500);
    
    expect(tickSpy).toHaveBeenCalledTimes(1);
    
    vi.useRealTimers();
  });

  it('should clear interval when stop is called', () => {
    vi.useFakeTimers();
    const tickSpy = vi.spyOn(engine as any, 'tick');
    
    engine.start(1000);
    vi.advanceTimersByTime(1500);
    expect(tickSpy).toHaveBeenCalledTimes(1);
    
    engine.stop();
    vi.advanceTimersByTime(2000);
    expect(tickSpy).toHaveBeenCalledTimes(1); // should still be 1
    
    vi.useRealTimers();
  });

  it('should mutate state on ticks within valid boundaries', () => {
    vi.useFakeTimers();
    const oldTimestamp = engine.state.timestamp;
    vi.advanceTimersByTime(2000);
    
    (engine as any).tick();
    
    expect(engine.state.timestamp).not.toBe(oldTimestamp);
    vi.useRealTimers();
    
    engine.state.gates.forEach(g => {
      expect(g.queueTimeMinutes).toBeGreaterThanOrEqual(0);
      expect(g.capacityPercent).toBeGreaterThanOrEqual(0);
      expect(g.capacityPercent).toBeLessThanOrEqual(100);
    });

    engine.state.zones.forEach(z => {
      expect(z.crowdDensityPercent).toBeGreaterThanOrEqual(0);
      expect(z.crowdDensityPercent).toBeLessThanOrEqual(100);
    });
  });

  it('should trigger metro arrival logic when arrival time hits zero', () => {
    // Mock Math.random to return >0.5, so deltaQueue = 1, deltaCap = 2
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.6);

    // Set metro nextArrivalMinutes close to 0
    const metro = engine.state.transport.find(t => t.type === 'metro');
    expect(metro).toBeDefined();
    
    if (metro) {
      metro.nextArrivalMinutes = 0.1; // almost arrived
    }
    
    // Before tick
    const g6Before = engine.state.gates.find(g => g.id === 'g6');
    const zSouthBefore = engine.state.zones.find(z => z.id === 'z_south');
    const g6CapBefore = g6Before?.capacityPercent || 0;
    const g6QueueBefore = g6Before?.queueTimeMinutes || 0;
    const zSouthDensityBefore = zSouthBefore?.crowdDensityPercent || 0;
    
    (engine as any).tick();
    
    const g6After = engine.state.gates.find(g => g.id === 'g6');
    const zSouthAfter = engine.state.zones.find(z => z.id === 'z_south');
    
    // Assert spikes (incorporating +2 from Math.random and +15 from metro)
    expect(g6After?.capacityPercent).toBe(Math.min(100, g6CapBefore + 2 + 15));
    expect(g6After?.queueTimeMinutes).toBe(g6QueueBefore + 1 + 12);
    expect(zSouthAfter?.crowdDensityPercent).toBe(Math.min(100, zSouthDensityBefore + 1 + 10));
    
    // Metro arrival resets to 15
    expect(metro?.nextArrivalMinutes).toBe(15);

    randomSpy.mockRestore();
  });
});
