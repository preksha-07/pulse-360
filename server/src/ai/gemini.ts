import { GoogleGenerativeAI } from '@google/generative-ai';
import { PredictionState } from '../prediction/types';
import { AgentRecommendation } from '../agents/types';

function getGenAI(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key_here' || key === 'undefined') {
    return null;
  }
  return new GoogleGenerativeAI(key);
}

export async function generateOperationalBriefing(
  state: PredictionState,
  recommendations: AgentRecommendation[]
): Promise<string> {
  const genAI = getGenAI();
  if (!genAI) {
    // Offline Mock Mode Briefings
    const activeScenario = state.currentTelemetry.activeScenario;
    if (activeScenario === 'heavy_rain') {
      return `🌧 OPERATIONAL STATUS: AMBER (Heavy Rain Simulation)
- Gate entry capacities reduced to 42% due to water accumulation and security bottlenecks.
- Slips and falls risks reported in Concourse zones; volunteer squads reassigned to high-hazard transit paths.
- Sustainability systems report a 15% reduction in non-essential power.`;
    }
    if (activeScenario === 'metro_delay') {
      return `🚇 OPERATIONAL STATUS: AMBER (Metro Delay Simulation)
- Major transit platform bottlenecks at Gate 6; passenger arrivals delayed by 8.5 minutes.
- Crowd management volunteers deployed to reroute incoming general admissions to Gate 1.
- Emergency services placed on standby near main gates.`;
    }
    if (activeScenario === 'medical') {
      return `🚑 OPERATIONAL STATUS: RED (Medical Emergency Simulation)
- Cardiac alert at Section 104; emergency lanes activated.
- Volunteer team deployed to clear and isolate the pathway for EMT ambulance access.
- Standard crowd control recommendations in place.`;
    }
    if (activeScenario === 'gate_closure') {
      return `🚪 OPERATIONAL STATUS: AMBER (Gate Closure Simulation)
- Gate 6 has been shut down; crowd density spiking.
- General admission flow rerouted to Gate 1. Volunteer roster reallocated to manage Gate 1 lines.`;
    }
    if (activeScenario === 'vip') {
      return `⭐ OPERATIONAL STATUS: GREEN (VIP Arrival Simulation)
- VIP Greeting protocols active at Gate 11.
- High-level delegation safely escorted; security teams positioned.`;
    }
    if (activeScenario === 'goal_surge') {
      return `⚽ OPERATIONAL STATUS: GREEN (Halftime Goal Surge)
- Concourse concessions experiencing high crowd density due to halftime rush.
- Power grids demand peaking. Volunteers monitoring crowd flow.`;
    }

    // Default normal state mock briefing
    if (state.risks.length === 0) {
      return `🏟 OPERATIONAL STATUS: GREEN
- Stadium systems are functioning normally across all sectors.
- Gate flows are balanced and below thresholds. No crowd surges predicted.
- All volunteer stations are fully covered.`;
    } else {
      const riskTitles = state.risks.map(r => r.title).join(', ');
      return `🏟 OPERATIONAL STATUS: AMBER
- Alert: ${riskTitles} active.
- Recommended action: ${recommendations.map(r => r.action).join('; ')}`;
    }
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are the Lead Stadium Director's Assistant for Pulse360.
Analyze this stadium state and write a brief, 3-sentence operational update for the dashboard.
Telemetry: ${JSON.stringify(state.currentTelemetry)}
Risks: ${JSON.stringify(state.risks)}
Recommendations: ${JSON.stringify(recommendations)}
Focus on current status, immediate risks, and key volunteer actions. Keep it professional.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('[Gemini] Briefing generation failed:', err);
    return `Briefing generation temporarily unavailable. Status details: ${state.risks.length} active risk(s) detected.`;
  }
}

export async function fanAssistant(
  query: string,
  language: string = 'English',
  state: PredictionState
): Promise<string> {
  const genAI = getGenAI();
  if (!genAI) {
    const q = query.toLowerCase();
    if (q.includes('gate') || q.includes('entry') || q.includes('congest')) {
      const bestGate = state.currentTelemetry.gates.reduce((prev, curr) => 
        (curr.capacityPercent < prev.capacityPercent && curr.capacityPercent > 0) ? curr : prev
      );
      const busyGate = state.currentTelemetry.gates.find(g => g.capacityPercent > 70);
      const busyName = busyGate ? busyGate.name.split(' (')[0] : '';
      return `For the fastest entry, I recommend using ${bestGate.name} which has a ${bestGate.queueTimeMinutes}-minute wait. ${busyGate ? `${busyName} is currently congested.` : ''}`;
    }
    if (q.includes('metro') || q.includes('train') || q.includes('transport')) {
      const metro = state.currentTelemetry.transport.find(t => t.type === 'metro');
      const time = metro ? Math.floor(metro.nextArrivalMinutes) : 10;
      const pax = metro ? metro.expectedPassengers : 300;
      return `The next metro arrives in ${time} minutes carrying approximately ${pax} passengers. Gate 6 is expected to be busy.`;
    }
    if (q.includes('food') || q.includes('eat') || q.includes('concession')) {
      return `Food Court B has shorter lines than Food Court A. You can find pretzels, burgers, and drinks there.`;
    }
    return `Hello! I'm here to help you enjoy the match. You can ask me about entry gates, transport, or concessions!`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are a helpful stadium assistant. Answer the fan's query in ${language}.
Query: "${query}"
Stadium State: ${JSON.stringify(state.currentTelemetry)}
Keep the response friendly, helpful, and concise (under 3 sentences).`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('[Gemini] Fan assistant failed:', err);
    return "I'm having a moment — please check the live dashboard for gate and transport info!";
  }
}

export async function generateIncidentReplay(scenario: string): Promise<string> {
  const genAI = getGenAI();
  if (!genAI) {
    // Generate beautiful markdown mock reports for simulation analysis
    if (scenario === 'heavy_rain') {
      return `# AI Incident Replay: Heavy Rain Mitigation Analysis

### Incident Summary
During the stadium simulation, a sudden **Heavy Rain** cell impacted the venue. Telemetry recorded water accumulation rates and wet surface indicators which spiked crowd safety concerns.

### Timeline of Events
* **00:00** Simulation started. Normal operations.
* **05:00** Influx of rain overrides detected. Gate capacities reduced by 8% due to wet ticket scanners.
* **10:00** Concourse crowd density peaked. Wet pavement slip hazards triggered amber alerts in North and South Concourses.
* **15:00** Sustainability systems reduced heating and non-essential lighting by 15% to conserve energy.

### AI Coordination Actions
* **Volunteer Deployment:** Reassigned 5 volunteers to Concourse zones to deploy wet floor warning signs and guide fans along covered walkways.
* **Crowd Redirection:** Adjusted overhead digital signage to balance the entry queues between Gate 1 and Gate 11.
* **Safety Protocols:** Coordinated with cleaning teams to optimize drainage pumps at low-lying entry bays.

### Lessons Learned
* **Drainage Capacity:** Installing permanent rain awnings at Gate 6 ticket checkers would prevent capacity drop from scanner wetness.
* **Slip Hazards:** Deploying slip-resistant mats along high-traffic concourse entrances should be pre-staged before matches with >40% rain probability.`;
    }

    if (scenario === 'metro_delay') {
      return `# AI Incident Replay: Metro Delay Surge Management

### Incident Summary
A technical glitch on the main transit line caused a **Metro Delay**, followed by a sudden discharge of two trainloads of fans arriving simultaneously at Gate 6 (Transit Link).

### Timeline of Events
* **00:00** Simulation started.
* **07:00** Metro arrival delayed by 8.5 minutes.
* **12:00** Dual-train arrival triggered a massive crowd density spike at the Gate 6 platform.
* **15:00** Queue times at Gate 6 reached 20 minutes, exceeding standard operating safety bounds.

### AI Coordination Actions
* **Volunteer Deployment:** Dispatched 5 volunteers from South Concourse to Gate 6 to assist with queue line segmentation and crowd safety monitoring.
* **Dynamic Rerouting:** Broadcasted entry directions to fan smartphones and display boards, redirecting incoming traffic to the underutilized Gate 1.
* **Gate Capacity:** Coordinated with security staff to open overflow lanes at Gate 6 to clear the backlog.

### Lessons Learned
* **Pre-emptive Reallocation:** Roster adjustments should be triggered as soon as the transit agency flags a delay >5 minutes, rather than waiting for the arrival surge.
* **Sustained Flow:** Secondary exit pathways from the metro platform should be configured to split the queue before fans reach the ticketing turnstiles.`;
    }

    return `# AI Incident Replay: ${scenario.toUpperCase()} Analysis

### Incident Summary
The simulation of **${scenario}** was initiated. AI engines monitored metrics, identified risk factors, and recommended real-time mitigation actions.

### AI Coordination Actions
* Coordinated volunteer deployments.
* Adjusted sustainability resource consumption.
* Dispatched safety alerts to local marshals.

### Lessons Learned
* AI decision engine successfully handled telemetry spikes.
* Future drills will incorporate cross-domain coordination variables.`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are a Senior Event Planner. Write a post-incident analysis report in Markdown for the simulation scenario: "${scenario}".
Include sections:
1. Incident Summary
2. Timeline of Events
3. AI Coordination Actions
4. Lessons Learned
Keep it looking like a high-fidelity dashboard report.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('[Gemini] Replay report failed:', err);
    return `# AI Incident Replay Report: ${scenario}

Operational data collection completed. Briefing synthesis temporarily offline. Please refer to standard SOPs for simulation cleanup.`;
  }
}
