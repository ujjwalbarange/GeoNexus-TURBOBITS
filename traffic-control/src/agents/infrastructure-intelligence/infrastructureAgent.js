/**
 * Infrastructure Intelligence Agent — Module Five
 * Evaluates structural road grade-separations, flyovers, and bridge interventions
 * based on verified chronic traffic bottlenecks.
 */

import bridgeClassifications from '../../../data/infrastructure/bridges/bridge_classifications.json';
import corridorProposals from '../../../data/infrastructure/bridges/corridor_proposals.json';

export class InfrastructureAgent {
  /**
   * Evaluate long-term infrastructure interventions for city
   * @param {string} cityId 'mumbai' | 'nagpur' | 'pune'
   */
  static evaluateInfrastructure(cityId) {
    const proposals = corridorProposals.filter((p) => p.cityId === cityId);

    return {
      totalClassifications: bridgeClassifications.length,
      classifications: bridgeClassifications,
      proposalsCount: proposals.length,
      proposals: proposals.map((prop) => {
        const fullClass = bridgeClassifications.find(
          (b) => b.typeId === prop.recommendedInfrastructure.typeId
        );
        return {
          ...prop,
          structuralDetails: fullClass || null,
        };
      }),
    };
  }
}
