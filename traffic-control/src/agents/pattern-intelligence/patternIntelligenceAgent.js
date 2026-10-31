/**
 * Traffic Pattern Intelligence Agent — Module Three
 * Analyzes recurring congestion patterns, time-of-day bottlenecks,
 * and formulates operational traffic engineering solutions.
 */

import recurringPatternsData from '../../../data/patterns/recurring_patterns.json';

export class PatternIntelligenceAgent {
  /**
   * Evaluate recurring patterns for active city
   * @param {string} cityId 'mumbai' | 'nagpur' | 'pune'
   * @param {Array} activeRedZones Current red zones detected
   */
  static analyzePatterns(cityId, activeRedZones = []) {
    const cityPatterns = recurringPatternsData.filter((p) => p.cityId === cityId);
    const matchedPatterns = [];

    const currentHour = new Date().getHours();
    const isMorningPeak = currentHour >= 8 && currentHour <= 12;
    const isEveningPeak = currentHour >= 17 && currentHour <= 21;

    cityPatterns.forEach((pat) => {
      // Check if any active red zone matches this corridor
      const activeMatch = activeRedZones.find((rz) => rz.corridorCode === pat.corridorCode);

      matchedPatterns.push({
        id: pat.id,
        location: pat.location,
        corridorCode: pat.corridorCode,
        coordinates: pat.coordinates,
        isActiveNow: Boolean(activeMatch),
        currentRedZone: activeMatch || null,
        peakPeriodActive: isMorningPeak ? 'MORNING_PEAK' : isEveningPeak ? 'EVENING_PEAK' : 'OFF_PEAK',
        peakWindows: pat.peakWindows,
        primaryContributingFactor: pat.primaryContributingFactor,
        recurringPropagation: pat.recurringPropagation,
        recommendedInterventions: pat.recommendedInterventions,
        confidenceScore: 0.91,
      });
    });

    return {
      totalPatterns: cityPatterns.length,
      activePatternsCount: matchedPatterns.filter((m) => m.isActiveNow).length,
      patterns: matchedPatterns,
    };
  }
}
