import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Setup mock before importing gemini module
const mockGenerateContent = vi.fn();
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => {
      return {
        getGenerativeModel: vi.fn().mockImplementation(() => {
          return {
            generateContent: mockGenerateContent
          };
        })
      };
    })
  };
});

import { generateOperationalBriefing, fanAssistant } from '../ai/gemini';
import { PredictionState } from '../prediction/types';
import { AgentRecommendation } from '../agents/types';

describe('Gemini Integration Helpers', () => {
  let mockPrediction: PredictionState;
  let mockRecommendations: AgentRecommendation[];

  beforeEach(() => {
    vi.resetModules();
    mockGenerateContent.mockReset();
    
    mockPrediction = {
      currentTelemetry: {
        timestamp: new Date().toISOString(),
        gates: [
          { id: 'g1', name: 'Gate 1 (North)', queueTimeMinutes: 5, capacityPercent: 30 },
          { id: 'g6', name: 'Gate 6 (Transit Link)', queueTimeMinutes: 20, capacityPercent: 85 },
          { id: 'g11', name: 'Gate 11 (VIP)', queueTimeMinutes: 2, capacityPercent: 15 }
        ],
        zones: [
          { id: 'z_north', name: 'North Concourse', crowdDensityPercent: 45 }
        ],
        transport: [
          { id: 'm1', type: 'metro', nextArrivalMinutes: 5, expectedPassengers: 350 }
        ],
        sustainability: {
          energyUsageKw: 3500,
          waterUsageLiters: 1000,
          wasteKg: 100
        },
        volunteers: []
      },
      risks: [
        {
          id: 'risk_metro',
          category: 'transport_surge',
          targetId: 'g6',
          title: 'Impending Metro Surge at Gate 6',
          probabilityPercent: 92,
          timeToImpactMinutes: 5,
          reasoning: ['Metro arriving in 5 mins']
        }
      ],
      timeline: { gates: {} }
    };

    mockRecommendations = [
      {
        id: 'rec_volunteer',
        domain: 'volunteer',
        action: 'Reassign 5 volunteers to Gate 6',
        reasoning: 'Help clear queues',
        priority: 'high'
      }
    ];
  });

  describe('generateOperationalBriefing', () => {
    it('should return operational status Green in mock mode when risks are 0', async () => {
      // Forcing mock mode by checking if we have MOCK_MODE behavior
      mockPrediction.risks = [];
      const briefing = await generateOperationalBriefing(mockPrediction, []);
      expect(briefing).toContain('OPERATIONAL STATUS: GREEN');
      expect(briefing).toContain('No crowd surges predicted');
    });

    it('should return operational status Amber in mock mode when risks are >0', async () => {
      const briefing = await generateOperationalBriefing(mockPrediction, mockRecommendations);
      expect(briefing).toContain('OPERATIONAL STATUS: AMBER');
      expect(briefing).toContain('Impending Metro Surge at Gate 6');
      expect(briefing).toContain('Reassign 5 volunteers to Gate 6');
    });

    it('should call Gemini API when not in mock mode', async () => {
      // Mock process.env.GEMINI_API_KEY
      const originalApiKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'valid_api_key_test';
      
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => 'Live Operational Briefing from Gemini!' }
      });

      // Re-import to re-evaluate the MOCK_MODE constant at module top
      const liveGemini = await import('../ai/gemini');
      const briefing = await liveGemini.generateOperationalBriefing(mockPrediction, mockRecommendations);
      
      expect(briefing).toBe('Live Operational Briefing from Gemini!');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      
      // Cleanup
      process.env.GEMINI_API_KEY = originalApiKey;
    });

    it('should fall back to default error text if Gemini API fails', async () => {
      const originalApiKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'valid_api_key_test';
      
      mockGenerateContent.mockRejectedValueOnce(new Error('API quota reached'));

      const liveGemini = await import('../ai/gemini');
      const briefing = await liveGemini.generateOperationalBriefing(mockPrediction, mockRecommendations);
      
      expect(briefing).toContain('Briefing generation temporarily unavailable');
      expect(briefing).toContain('1 active risk(s) detected');
      
      process.env.GEMINI_API_KEY = originalApiKey;
    });
  });

  describe('fanAssistant', () => {
    it('should return gate info in mock mode when asking about entry', async () => {
      const reply = await fanAssistant('Which gate is the best to enter?', 'English', mockPrediction);
      // Best gate is Gate 11 (VIP) with 15% capacity
      expect(reply).toContain('Gate 11 (VIP)');
      expect(reply).toContain('2-minute wait');
      expect(reply).toContain('Gate 6 is currently congested');
    });

    it('should return transport info in mock mode when asking about metro', async () => {
      const reply = await fanAssistant('When is the next train arriving?', 'English', mockPrediction);
      expect(reply).toContain('metro arrives in 5 minutes');
      expect(reply).toContain('350 passengers');
    });

    it('should return food info in mock mode when asking about eating', async () => {
      const reply = await fanAssistant('Where can I get some food?', 'English', mockPrediction);
      expect(reply).toContain('Food Court B');
    });

    it('should return default response for unhandled queries in mock mode', async () => {
      const reply = await fanAssistant('Hello!', 'English', mockPrediction);
      expect(reply).toContain("I'm here to help you enjoy the match");
    });

    it('should call Gemini API when not in mock mode', async () => {
      const originalApiKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'valid_api_key_test';
      
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => 'Hola, el próximo metro llega en 5 minutos.' }
      });

      const liveGemini = await import('../ai/gemini');
      const reply = await liveGemini.fanAssistant('next metro', 'Spanish', mockPrediction);
      
      expect(reply).toBe('Hola, el próximo metro llega en 5 minutos.');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      
      process.env.GEMINI_API_KEY = originalApiKey;
    });

    it('should fall back to helpful notice if Gemini API fails', async () => {
      const originalApiKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'valid_api_key_test';
      
      mockGenerateContent.mockRejectedValueOnce(new Error('Network error'));

      const liveGemini = await import('../ai/gemini');
      const reply = await liveGemini.fanAssistant('help', 'English', mockPrediction);
      
      expect(reply).toContain('please check the live dashboard');
      
      process.env.GEMINI_API_KEY = originalApiKey;
    });
  });
});
