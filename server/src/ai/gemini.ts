import { GoogleGenerativeAI } from '@google/generative-ai';
import { PredictionState } from '../prediction/types';
import { AgentRecommendation } from '../agents/types';

const MOCK_MODE = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here';

let genAI: GoogleGenerativeAI | null = null;
if (!MOCK_MODE) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

/**
 * Generates an AI Operations Briefing for the Command Center.
 * Uses Gemini if API key is set, falls back to deterministic mock.
 */
export async function generateOperationalBriefing(
  prediction: PredictionState,
  recommendations: AgentRecommendation[]
): Promise<string> {
  const riskCount = prediction.risks.length;
  const topRisk = prediction.risks[0];
  const topRec = recommendations[0];

  if (MOCK_MODE) {
    if (riskCount === 0) {
      return `OPERATIONAL STATUS: GREEN. All stadium systems are within normal parameters. No crowd surges predicted in the next 30 minutes. Current volunteer deployment is optimal. Sustainability metrics are within target thresholds. Continue monitoring.`;
    }
    return `OPERATIONAL STATUS: AMBER. ${riskCount} risk(s) identified. PRIORITY: "${topRisk?.title}" with ${topRisk?.probabilityPercent}% probability, expected impact in ${topRisk?.timeToImpactMinutes} minutes. ${topRec ? `Recommended immediate action: ${topRec.action}` : ''} Coordinator has issued ${recommendations.length} directive(s). Assign personnel and monitor Gate 6 closely over the next 20 minutes.`;
  }

  try {
    const model = genAI!.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are Pulse360, an AI stadium operations intelligence system for the FIFA World Cup 2026. Generate a concise operational briefing (3-4 sentences, no markdown) based on this data:
- Active risks: ${riskCount}
- Top risk: ${topRisk ? `"${topRisk.title}" (${topRisk.probabilityPercent}% probability, impact in ${topRisk.timeToImpactMinutes} min)` : 'None'}
- Reasoning: ${topRisk?.reasoning?.join('; ') || 'N/A'}
- Recommended actions: ${recommendations.map(r => r.action).join('; ') || 'None'}
Write as a real operations officer reporting to the stadium director. Be specific and action-oriented.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('[Gemini] Briefing generation failed:', err);
    return `Briefing generation temporarily unavailable. ${riskCount} active risk(s) detected. Review AI recommendations panel.`;
  }
}

/**
 * Fan Assistant: multilingual, context-aware stadium helper powered by Gemini.
 */
export async function fanAssistant(
  userMessage: string,
  language: string,
  prediction: PredictionState
): Promise<string> {
  const bestGate = [...prediction.currentTelemetry.gates]
    .sort((a, b) => a.capacityPercent - b.capacityPercent)[0];
  const nextMetro = prediction.currentTelemetry.transport.find(t => t.type === 'metro');

  if (MOCK_MODE) {
    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes('gate') || lowerMsg.includes('enter') || lowerMsg.includes('entry')) {
      return `Your best entry right now is ${bestGate?.name} — only a ${bestGate?.queueTimeMinutes}-minute wait. Gate 6 is currently congested, so I'd avoid that one!`;
    }
    if (lowerMsg.includes('metro') || lowerMsg.includes('train') || lowerMsg.includes('transport')) {
      return `The next metro arrives in ${Math.floor(nextMetro?.nextArrivalMinutes || 0)} minutes and will carry about ${nextMetro?.expectedPassengers} passengers. I recommend arriving at the platform a few minutes early to beat the rush!`;
    }
    if (lowerMsg.includes('restroom') || lowerMsg.includes('toilet') || lowerMsg.includes('bathroom')) {
      return `The least crowded restrooms right now are in the South Concourse — just a 2-minute walk from your section. North Concourse restrooms have a short queue due to elevated density in that area.`;
    }
    if (lowerMsg.includes('food') || lowerMsg.includes('eat') || lowerMsg.includes('drink')) {
      return `Food Court A is currently at 82% crowd density — I'd suggest Food Court B in the South Concourse which is much quieter. Estimated wait: under 5 minutes!`;
    }
    return `I'm here to help you enjoy the match! I can advise on the best gates, shortest queues, food courts, transport, or accessibility routes. What do you need?`;
  }

  try {
    const model = genAI!.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are a helpful FIFA World Cup 2026 stadium assistant named Pulse. Answer the fan's question in ${language}. Be friendly, brief (2-3 sentences), and use the live stadium data below.

Live data:
- Best gate: ${bestGate?.name} (${bestGate?.capacityPercent}% full, ${bestGate?.queueTimeMinutes} min wait)
- Next metro: ${Math.floor(nextMetro?.nextArrivalMinutes || 0)} min (${nextMetro?.expectedPassengers} passengers)
- Crowd risks: ${prediction.risks.length > 0 ? prediction.risks.map(r => r.title).join(', ') : 'None'}

Fan question: "${userMessage}"`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('[Gemini] Fan assistant failed:', err);
    return `I'm having a moment — please check the live dashboard for gate and transport info!`;
  }
}
