/**
 * Police Dispatch Intelligence Agent — Module Two
 * Connects detected Red Zones with verified traffic police units.
 * 
 * Safety Rule:
 * - Only generates recommendations with status 'AWAITING_AUTHORIZATION'.
 * - Never executes an unverified dispatch without human operator approval.
 */

import policeResourcesData from '../../../data/police/police_resources.json';

export class PoliceDispatchAgent {
  /**
   * Evaluate police deployment recommendations for detected red zones
   * @param {Array} redZones List of detected red zones
   * @param {string} cityId 'mumbai' | 'nagpur' | 'pune'
   */
  static evaluateDispatch(redZones = [], cityId) {
    const cityResources = policeResourcesData.filter((r) => r.cityId === cityId);
    const recommendations = [];

    redZones.forEach((rz) => {
      if (!rz.requiresIntervention) return;

      const [rzLat, rzLng] = rz.centerCoordinates;

      // Calculate proximity to all city resources
      const evaluatedResources = cityResources.map((res) => {
        const [pLat, pLng] = res.location.coordinates;
        const distKm = this._calculateHaversineDistance(rzLat, rzLng, pLat, pLng);

        // Estimate response travel time accounting for urban traffic (avg 25 km/h for emergency interceptor)
        const etaMinutes = Math.max(3, Math.round((distKm / 25) * 60));

        return {
          ...res,
          distanceKm: +distKm.toFixed(2),
          estimatedResponseMinutes: etaMinutes,
        };
      });

      // Sort by proximity
      evaluatedResources.sort((a, b) => a.distanceKm - b.distanceKm);

      // Find closest AVAILABLE unit within 15 km
      const bestAvailable = evaluatedResources.find(
        (r) => r.availabilityStatus === 'AVAILABLE' && r.distanceKm <= 15
      );

      const closestAny = evaluatedResources[0];

      if (bestAvailable) {
        recommendations.push({
          id: `disp_rec_${rz.id}_${Date.now()}`,
          redZoneId: rz.id,
          cityId,
          corridorName: rz.corridorName,
          corridorCode: rz.corridorCode,
          severity: rz.severity,
          recommendedUnit: {
            unitCode: bestAvailable.unitCode,
            officerInCharge: bestAvailable.officerInCharge,
            policeStation: bestAvailable.policeStation,
            currentLocation: bestAvailable.location.name,
            deploymentType: bestAvailable.deploymentType,
            distanceKm: bestAvailable.distanceKm,
            estimatedEtaMins: bestAvailable.estimatedResponseMinutes,
          },
          status: 'AWAITING_AUTHORIZATION',
          reason: `Severe congestion (${rz.currentSpeedKmH || 15} km/h, ${rz.delayMinutes} mins delay) detected on ${rz.corridorName}. Nearby traffic unit is stationed ${bestAvailable.distanceKm} km away.`,
          suggestedAction: `Deploy unit ${bestAvailable.unitCode} to take over manual junction signal control and clear upstream merge choke point.`,
          createdAt: new Date().toISOString(),
          authorizedBy: null,
          decisionTimestamp: null,
        });
      } else {
        recommendations.push({
          id: `disp_rec_${rz.id}_${Date.now()}`,
          redZoneId: rz.id,
          cityId,
          corridorName: rz.corridorName,
          corridorCode: rz.corridorCode,
          severity: rz.severity,
          recommendedUnit: null,
          closestOccupiedUnit: closestAny
            ? {
                unitCode: closestAny.unitCode,
                status: closestAny.availabilityStatus,
                distanceKm: closestAny.distanceKm,
              }
            : null,
          status: 'RESOURCE_DEFICIT_AWAITING_CONTROL',
          reason: `No verified AVAILABLE traffic police unit found within 15 km response radius of ${rz.corridorName}. Closest unit (${closestAny?.unitCode || 'None'}) is currently ${closestAny?.availabilityStatus || 'BUSY'}.`,
          suggestedAction: 'Escalate to Regional Traffic Division Central Control for inter-divisional unit re-allocation.',
          createdAt: new Date().toISOString(),
          authorizedBy: null,
          decisionTimestamp: null,
        });
      }
    });

    return {
      totalCityResources: cityResources.length,
      availableUnits: cityResources.filter((r) => r.availabilityStatus === 'AVAILABLE').length,
      deployedUnits: cityResources.filter((r) => r.availabilityStatus === 'DEPLOYED').length,
      busyUnits: cityResources.filter((r) => r.availabilityStatus === 'BUSY').length,
      recommendations,
      resources: cityResources,
    };
  }

  static _calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
