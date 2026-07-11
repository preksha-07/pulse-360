export interface AgentRecommendation {
  id: string;
  domain: 'crowd' | 'navigation' | 'volunteer' | 'emergency' | 'sustainability';
  action: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}
