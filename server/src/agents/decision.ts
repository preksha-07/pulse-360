import { PredictionState, TimelineRecommendation } from '../prediction/types';
import { AgentRecommendation } from './types';

export class DecisionEngine {
  
  public calculateRiskScore(state: PredictionState): number {
    const activeScenario = state.currentTelemetry.activeScenario;
    if (activeScenario === 'none') {
      const risks = state.risks;
      if (risks.length === 0) return 12; // low baseline risk
      return Math.min(100, risks.reduce((sum, r) => {
        const factor = r.category === 'gate_overload' ? 1.2 : 1.0;
        return sum + (r.probabilityPercent * 0.4 * factor);
      }, 15));
    }

    // Fixed realistic scenario risk scores
    switch (activeScenario) {
      case 'heavy_rain': return 78;
      case 'metro_delay': return 85;
      case 'medical': return 62;
      case 'gate_closure': return 92;
      case 'vip': return 48;
      case 'goal_surge': return 74;
      default: return 15;
    }
  }

  public process(state: PredictionState): AgentRecommendation[] {
    const recommendations: AgentRecommendation[] = [];
    const activeScenario = state.currentTelemetry.activeScenario;

    // Deterministic Decision Engine logic based on scenario and predictions
    if (activeScenario === 'heavy_rain') {
      recommendations.push({
        id: `rec_rain_drain_${Date.now()}`,
        domain: 'emergency',
        action: 'Deploy emergency roofing and drainage pumps at North and South Concourses',
        reasoning: 'Heavy rain is predicted to cause standing water and potential slips in low-elevation concourse pathways within 10 minutes.',
        priority: 'high',
        confidencePercent: 96
      });
      recommendations.push({
        id: `rec_rain_vol_${Date.now()}`,
        domain: 'volunteer',
        action: 'Reassign 8 concourse volunteers to hand out rain ponchos and direct fans at Gate 1 and Gate 6',
        reasoning: 'Crowd throughput is slowing by 32% due to rain; positioning volunteers at gates will clear entry lanes and reduce outdoor bottlenecks.',
        priority: 'high',
        confidencePercent: 94
      });
      recommendations.push({
        id: `rec_rain_energy_${Date.now()}`,
        domain: 'sustainability',
        action: 'Dim non-critical concourse lighting and advertising displays by 20%',
        reasoning: 'Stadium power load is exceeding safe limits due to auxiliary heating and fan-drying stations running at full capacity.',
        priority: 'medium',
        confidencePercent: 98
      });
    } 
    else if (activeScenario === 'metro_delay') {
      recommendations.push({
        id: `rec_metro_hold_${Date.now()}`,
        domain: 'navigation',
        action: 'Activate digital signage and broadcast warnings instructing fans to hold in South Concourse',
        reasoning: 'Metro arrival is delayed by 25 minutes, creating a hazardous crowd backup of 1,200+ people at Gate 6 platform.',
        priority: 'critical',
        confidencePercent: 97
      });
      recommendations.push({
        id: `rec_metro_shuttle_${Date.now()}`,
        domain: 'transport',
        action: 'Dispatch 6 standby shuttle buses to Route B transit hub loops',
        reasoning: 'Shuttle bus support is required to absorb passenger load from the delayed metro link and split transit capacity.',
        priority: 'high',
        confidencePercent: 95
      });
      recommendations.push({
        id: `rec_metro_security_${Date.now()}`,
        domain: 'security',
        action: 'Move 4 security details from Gate 11 to enforce crowd barriers at Gate 6 entrance',
        reasoning: 'High risk of fence breaches and local gate overcrowding due to delayed transit schedules and frustration.',
        priority: 'high',
        confidencePercent: 91
      });
    }
    else if (activeScenario === 'medical') {
      recommendations.push({
        id: `rec_med_dispatch_${Date.now()}`,
        domain: 'emergency',
        action: 'Dispatch EMT Unit 3 and Coordinator Charlie P. to South Concourse Section 104',
        reasoning: 'First-aid trigger reported. Crowd density is at 92% in South Concourse, requiring immediate path clearance.',
        priority: 'critical',
        confidencePercent: 99
      });
      recommendations.push({
        id: `rec_med_cordon_${Date.now()}`,
        domain: 'security',
        action: 'Establish temporary security cordon around Food Court A exit stairs',
        reasoning: 'Cordon is required to facilitate medical triage and keep access paths open for emergency response vehicles.',
        priority: 'high',
        confidencePercent: 92
      });
    }
    else if (activeScenario === 'gate_closure') {
      recommendations.push({
        id: `rec_gate_close_${Date.now()}`,
        domain: 'navigation',
        action: 'Re-route transit-link general admission pedestrians away from closed Gate 6 to Gate 1',
        reasoning: 'Gate 6 is completely closed. Gate 1 currently holds 45% reserve capacity and can safely absorb the overflow.',
        priority: 'critical',
        confidencePercent: 99
      });
      recommendations.push({
        id: `rec_gate_staff_${Date.now()}`,
        domain: 'volunteer',
        action: 'Reassign 10 volunteers from Gate 6 lanes to assist with ticketing bottlenecks at Gate 1',
        reasoning: 'Gate 1 is experiencing an influx of 800 additional fans, causing queue times to climb above 35 minutes.',
        priority: 'high',
        confidencePercent: 94
      });
    }
    else if (activeScenario === 'vip') {
      recommendations.push({
        id: `rec_vip_path_${Date.now()}`,
        domain: 'security',
        action: 'Isolate VIP route corridors in North Concourse and clear Gate 11 entrance',
        reasoning: 'VIP motorcade is arriving in 5 minutes. Security clearance is required to isolate high-profile transit lines.',
        priority: 'high',
        confidencePercent: 95
      });
      recommendations.push({
        id: `rec_vip_escort_${Date.now()}`,
        domain: 'volunteer',
        action: 'Reassign 2 VIP hospitality volunteers to escort delegation from Gate 11 directly to suite corridor',
        reasoning: 'Hospitality support is required to guide the delegation through high-density concourse areas.',
        priority: 'medium',
        confidencePercent: 90
      });
    }
    else if (activeScenario === 'goal_surge') {
      recommendations.push({
        id: `rec_goal_vent_${Date.now()}`,
        domain: 'crowd',
        action: 'Activate high-velocity exhaust fans at Food Court A and Concourse stands',
        reasoning: 'Halftime rush has spiked crowd density to 97% at Food Court A, causing elevated carbon dioxide and heat levels.',
        priority: 'high',
        confidencePercent: 93
      });
      recommendations.push({
        id: `rec_goal_sust_${Date.now()}`,
        domain: 'sustainability',
        action: 'Engage stadium auxiliary batteries and dim pitch spot-lighting',
        reasoning: 'Electricity demand is hitting peak load (6,500 kW) due to high food vendor and digital replay operations.',
        priority: 'medium',
        confidencePercent: 96
      });
      recommendations.push({
        id: `rec_goal_sanitation_${Date.now()}`,
        domain: 'volunteer',
        action: 'Deploy sanitation teams and volunteers to Food Court A waste receptacles',
        reasoning: 'High food court usage has resulted in a 40% increase in landfill waste buildup within 10 minutes.',
        priority: 'low',
        confidencePercent: 88
      });
    }
    else {
      // Normal state ('none') - deterministic rules on standard predictions
      state.risks.forEach(risk => {
        if (risk.category === 'transport_surge' && risk.targetId === 'g6') {
          recommendations.push({
            id: `rec_volunteer_${Date.now()}`,
            domain: 'volunteer',
            action: 'Reassign 5 volunteers from South Concourse to Gate 6',
            reasoning: `Expected metro surge in ${risk.timeToImpactMinutes} minutes will overwhelm current staff.`,
            priority: 'high',
            confidencePercent: 92
          });
          recommendations.push({
            id: `rec_nav_${Date.now()}`,
            domain: 'navigation',
            action: 'Redirect incoming general admission to Gate 1',
            reasoning: 'Gate 6 is projected to hit 100% capacity; Gate 1 has 55% reserve capacity.',
            priority: 'medium',
            confidencePercent: 89
          });
        }
        if (risk.category === 'gate_overload') {
          recommendations.push({
            id: `rec_crowd_${Date.now()}_${risk.targetId}`,
            domain: 'crowd',
            action: `Open overflow lanes at ${risk.targetId}`,
            reasoning: `Gate capacity at ${risk.targetId} is critically high. Wait times are unacceptable.`,
            priority: 'critical',
            confidencePercent: 95
          });
        }
      });

      if (state.currentTelemetry.sustainability.energyUsageKw > 4000) {
        recommendations.push({
          id: `rec_sust_${Date.now()}`,
          domain: 'sustainability',
          action: 'Dim concourse lighting by 15%',
          reasoning: 'Energy usage exceeds target threshold. Impact on visibility is negligible during daylight.',
          priority: 'low',
          confidencePercent: 98
        });
      }
    }

    return recommendations;
  }

  public getTimelineRecommendations(state: PredictionState): TimelineRecommendation[] {
    const activeScenario = state.currentTelemetry.activeScenario;
    
    if (activeScenario === 'heavy_rain') {
      return [
        { timeOffsetMinutes: 0, label: 'Now', title: 'Rain Commences', action: 'Activate canopy gutters & supply wet floor signage.', confidencePercent: 98 },
        { timeOffsetMinutes: 10, label: '+10 min', title: 'Concourse Crowd Build', action: 'Position volunteers at gate cover points to direct traffic.', confidencePercent: 94 },
        { timeOffsetMinutes: 20, label: '+20 min', title: 'Power Grid Peak', action: 'Dim non-essential screens by 20% to support heater grid.', confidencePercent: 91 },
        { timeOffsetMinutes: 30, label: '+30 min', title: 'Transit Load Increase', action: 'Extend shuttle bus frequencies for fans leaving early.', confidencePercent: 85 }
      ];
    }
    if (activeScenario === 'metro_delay') {
      return [
        { timeOffsetMinutes: 0, label: 'Now', title: 'Delay Announcement', action: 'Inform fans on concourse displays; pause exit gate release.', confidencePercent: 99 },
        { timeOffsetMinutes: 10, label: '+10 min', title: 'Platform Surge', action: 'Mobilize crowd control units to Gate 6 transit link.', confidencePercent: 95 },
        { timeOffsetMinutes: 20, label: '+20 min', title: 'Bus Bridge Startup', action: 'Redirect general transit lines to backup shuttle bus bay.', confidencePercent: 90 },
        { timeOffsetMinutes: 30, label: '+30 min', title: 'Gate 6 Overload', action: 'Open auxiliary security lanes at Gate 1 to divide flow.', confidencePercent: 86 }
      ];
    }
    if (activeScenario === 'medical') {
      return [
        { timeOffsetMinutes: 0, label: 'Now', title: 'Incident Triggered', action: 'Dispatch Section 104 first-aid team & coordinator Bob T.', confidencePercent: 99 },
        { timeOffsetMinutes: 10, label: '+10 min', title: 'Triage Cordon', action: 'Secure egress corridor with temporary crowd partitions.', confidencePercent: 93 },
        { timeOffsetMinutes: 20, label: '+20 min', title: 'Egress Clearance', action: 'Ensure main driveway from Gate 11 is cleared for ambulance.', confidencePercent: 89 },
        { timeOffsetMinutes: 30, label: '+30 min', title: 'Resolution & Reset', action: 'Reopen stairs and resume normal volunteer patrol layout.', confidencePercent: 82 }
      ];
    }
    if (activeScenario === 'gate_closure') {
      return [
        { timeOffsetMinutes: 0, label: 'Now', title: 'Gate 6 Shut Down', action: 'Deactivate digital ticket scanners at Gate 6 immediately.', confidencePercent: 98 },
        { timeOffsetMinutes: 10, label: '+10 min', title: 'Pedestrian Rerouting', action: 'Redirect main approach pathways to Gate 1 using banners.', confidencePercent: 95 },
        { timeOffsetMinutes: 20, label: '+20 min', title: 'Gate 1 Bottleneck', action: 'Move 10 screening operators from Gate 6 to Gate 1.', confidencePercent: 90 },
        { timeOffsetMinutes: 30, label: '+30 min', title: 'Closure Investigation', action: 'Confirm secure sweeps at Gate 6 before planning reopening.', confidencePercent: 80 }
      ];
    }
    if (activeScenario === 'vip') {
      return [
        { timeOffsetMinutes: 0, label: 'Now', title: 'Motorcade Escort', action: 'Lock down suite lifts; line vip path with security details.', confidencePercent: 97 },
        { timeOffsetMinutes: 10, label: '+10 min', title: 'Gate 11 Screening', action: 'Expedite screening process for delegation arrival.', confidencePercent: 92 },
        { timeOffsetMinutes: 20, label: '+20 min', title: 'Pathway Transit', action: 'Escort VIP group through North Concourse corridor.', confidencePercent: 88 },
        { timeOffsetMinutes: 30, label: '+30 min', title: 'Resume Normalcy', action: 'Release general corridor blocks and normal patrol cycles.', confidencePercent: 81 }
      ];
    }
    if (activeScenario === 'goal_surge') {
      return [
        { timeOffsetMinutes: 0, label: 'Now', title: 'Halftime Rush', action: 'Increase food stall ventilation; spin up concessions.', confidencePercent: 96 },
        { timeOffsetMinutes: 10, label: '+10 min', title: 'Concourse Peak', action: 'Deploy extra bins and sanitation workers to Food Court A.', confidencePercent: 92 },
        { timeOffsetMinutes: 20, label: '+20 min', title: 'Grid Load Spike', action: 'Switch stadium sub-station to battery grid power.', confidencePercent: 88 },
        { timeOffsetMinutes: 30, label: '+30 min', title: 'Return to Seats', action: 'Resume baseline ventilation and stand-by power states.', confidencePercent: 83 }
      ];
    }

    // Default Timeline
    return [
      { timeOffsetMinutes: 0, label: 'Now', title: 'Monitor Transit', action: 'Watch Gate 6 link closely for incoming arrivals.', confidencePercent: 95 },
      { timeOffsetMinutes: 10, label: '+10 min', title: 'Prepare Staff', action: 'Standby reassignments for Gate 6 crowd support.', confidencePercent: 90 },
      { timeOffsetMinutes: 20, label: '+20 min', title: 'Activate Lanes', action: 'Open auxiliary queue lanes to absorb metro transit.', confidencePercent: 85 },
      { timeOffsetMinutes: 30, label: '+30 min', title: 'Redistribute', action: 'Resume standard zone patrols as surge clears.', confidencePercent: 80 }
    ];
  }
}

export const decisionEngine = new DecisionEngine();
