export interface AgentRecommendation {
  id: string;
  domain: 'crowd' | 'navigation' | 'volunteer' | 'emergency' | 'sustainability' | 'security' | 'transport';
  action: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidencePercent: number; // Added explainability confidence
}
