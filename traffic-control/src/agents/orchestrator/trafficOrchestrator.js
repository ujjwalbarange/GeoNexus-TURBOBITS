/**
 * Central AI Agent Orchestration Engine
 * Coordinates the specialist intelligence modules:
 * - Module 1: Live Traffic Detection & Red Zone Identification
 * - Module 2: Intelligent Traffic Police Dispatch
 * - Module 3: Recurring Traffic Pattern Intelligence
 * - Module 4: Road Construction & Alternative Route Optimization
 * - Module 5: Bridge & Urban Infrastructure Intelligence
 * - Module 6: Government Reporting & Recommendation System
 */

import { RedZoneDetector } from '../traffic-detection/redZoneDetector';
import { PoliceDispatchAgent } from '../police-dispatch/policeDispatchAgent';
import { PatternIntelligenceAgent } from '../pattern-intelligence/patternIntelligenceAgent';
import { RouteOptimizationAgent } from '../route-optimization/routeOptimizationAgent';
import { InfrastructureAgent } from '../infrastructure-intelligence/infrastructureAgent';
import { GovernmentReportingAgent } from '../government-reporting/governmentReportingAgent';

export class TrafficControlOrchestrator {
  /**
   * Run the complete multi-module analysis pipeline on the current traffic state
   * @param {Object} normalizedTrafficData Output of normalizeTrafficData
   * @param {string} cityId 'mumbai' | 'nagpur' | 'pune'
   */
  static runAnalysis(normalizedTrafficData, cityId) {
    const timestamp = new Date().toISOString();

    // 1. Module One: Red Zone Detection
    const detectionResult = RedZoneDetector.detectRedZones(normalizedTrafficData, cityId);
    const redZones = detectionResult.redZones || [];

    // 2. Module Two: Police Dispatch Intelligence
    const dispatchResult = PoliceDispatchAgent.evaluateDispatch(redZones, cityId);

    // 3. Module Three: Recurring Traffic Pattern Intelligence
    const patternResult = PatternIntelligenceAgent.analyzePatterns(cityId, redZones);

    // 4. Module Four: Road Construction & Route Optimization
    const routingResult = RouteOptimizationAgent.evaluateRoutes(cityId, redZones);

    // 5. Module Five: Bridge & Infrastructure Intelligence
    const infraResult = InfrastructureAgent.evaluateInfrastructure(cityId);

    // 6. Module Six: Government Reporting Synthesis
    const reports = GovernmentReportingAgent.generateReports({
      cityId,
      redZones,
      dispatchRecs: dispatchResult.recommendations,
      patterns: patternResult.patterns,
      routings: routingResult.routings,
      infraProposals: infraResult.proposals,
    });

    // 7. Determine Highest Priority Situation
    let highestPriority = 'NORMAL';
    if (detectionResult.criticalCount > 0) {
      highestPriority = 'P0_EMERGENCY';
    } else if (redZones.length > 0) {
      highestPriority = 'P1_CRITICAL';
    } else if (routingResult.activeRestrictionsCount > 0) {
      highestPriority = 'P2_HIGH';
    } else if (patternResult.activePatternsCount > 0) {
      highestPriority = 'P3_MEDIUM';
    }

    return {
      cityId,
      timestamp,
      highestPriority,
      systemStatus: 'ONLINE_ACTIVE',
      // Module Outputs
      detection: detectionResult,
      dispatch: dispatchResult,
      patterns: patternResult,
      routings: routingResult,
      infrastructure: infraResult,
      reports,
      // Operational Stats
      kpis: {
        activeRedZones: redZones.length,
        criticalBlockages: detectionResult.criticalCount,
        availablePoliceUnits: dispatchResult.availableUnits,
        totalPoliceUnits: dispatchResult.totalCityResources,
        dispatchRecommendationsCount: dispatchResult.recommendations.length,
        activeRestrictions: routingResult.activeRestrictionsCount,
        recurringPatternsCount: patternResult.totalPatterns,
        infrastructureProposalsCount: infraResult.proposalsCount,
        governmentReportsCount: reports.length,
      },
    };
  }
}
