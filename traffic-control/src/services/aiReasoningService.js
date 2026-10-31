/**
 * Groq AI Reasoning Service
 * Powered by Groq's high-speed inference engine (Default: openai/gpt-oss-120b).
 * 
 * Functions:
 * - Real-time tactical incident assessments
 * - Geometric bottleneck causality explanation
 * - Urban bridge & grade-separation feasibility comparative studies
 * - Official statutory government briefing generation
 * - Context-aware interactive Q&A for traffic control operators
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PRIMARY_MODEL = import.meta.env.VITE_GROQ_MODEL || 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'openai/gpt-oss-20b';

export class AiReasoningService {
  constructor(apiKey = import.meta.env.VITE_GROQ_API_KEY || '') {
    this.apiKey = apiKey.trim();
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.startsWith('gsk_'));
  }

  /**
   * Execute chat completion against Groq API with automatic model fallback
   */
  async _queryGroq(systemPrompt, userPrompt, temperature = 0.2) {
    if (!this.isConfigured()) {
      return {
        success: false,
        content: 'Groq AI key not configured. Please verify VITE_GROQ_API_KEY in .env.local.',
      };
    }

    const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];

    for (const model of modelsToTry) {
      try {
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature,
            max_tokens: 650,
          }),
        });

        if (response.ok) {
          const json = await response.json();
          const message = json.choices?.[0]?.message;
          return {
            success: true,
            model,
            content: message?.content || '',
            reasoning: message?.reasoning || null,
          };
        }
      } catch (err) {
        console.warn(`[AiReasoning] Error querying model ${model}:`, err);
      }
    }

    return {
      success: false,
      content: 'AI reasoning temporarily unavailable due to network timeout.',
    };
  }

  /**
   * Tactical Incident & Dispatch Assessment
   */
  async analyzeIncidentTactics(redZone, policeUnit) {
    const systemPrompt = `You are the Chief AI Traffic Operations Strategist for the Metropolitan Police Traffic Branch.
Your duty is to produce an authoritative, concise, and structured tactical action plan for a live traffic emergency.
Do not hallucinate fake numbers. Rely strictly on provided sensor metrics.`;

    const userPrompt = `A severe congestion Red Zone has been identified:
- Corridor: ${redZone.corridorName} (${redZone.corridorCode})
- Severity: ${redZone.severityLabel} (${redZone.severity})
- Current Speed: ${redZone.currentSpeedKmH || 15} km/h (Limit: ${redZone.freeFlowSpeedKmH || 80} km/h)
- Measured Queue Delay: +${redZone.delayMinutes} minutes
- Estimated Congestion Length: ${redZone.affectedLengthKm} km
- Recommended Police Unit: ${policeUnit ? `${policeUnit.unitCode} (${policeUnit.officerInCharge}) stationed ${policeUnit.distanceKm} km away` : 'No immediate available unit'}

Provide:
1. Operational Risk Assessment (propagation risk to connected corridors).
2. Tactical Directive for On-Ground Police Unit (specific manual signal override, slip-road metering, or merge control).
3. Recommended Citizen Advisory wording.`;

    return this._queryGroq(systemPrompt, userPrompt);
  }

  /**
   * Geometric Bottleneck Causality & Pattern Explanation
   */
  async explainBottleneckCausality(pattern) {
    const systemPrompt = `You are a Senior Urban Traffic Engineer specializing in Indian metropolitan corridor congestion.
Analyze the provided chronic bottleneck with technical rigor (queueing theory, merging friction, signal split).`;

    const userPrompt = `Corridor Bottleneck: ${pattern.location} (${pattern.corridorCode})
- Peak Commute Windows: ${pattern.peakWindows?.map((p) => `${p.period} (${p.time}) - ${p.direction}`).join('; ')}
- Documented Contributing Factor: ${pattern.primaryContributingFactor}
- Spatial Propagation: ${pattern.recurringPropagation}

Explain:
1. Why this intersection fails specifically during these peak windows (capacity vs demand choke).
2. Assessment of Proposed Intervention (${pattern.recommendedInterventions?.[0]?.description}).
3. Expected traffic velocity gains and implementation challenges.`;

    return this._queryGroq(systemPrompt, userPrompt);
  }

  /**
   * Comparative Infrastructure Feasibility Analysis
   */
  async evaluateBridgeFeasibility(proposal) {
    const systemPrompt = `You are a Principal Civil & Structural Highway Engineer advising municipal development authorities.
Evaluate this urban grade-separation proposal with strict engineering objectivity.`;

    const userPrompt = `Bottleneck Location: ${proposal.junctionName || proposal.title || 'Arterial Junction'}
- Identified Problem: ${proposal.identifiedBottleneck || proposal.problemDescription || 'Chronic congestion'}
- Proposed Structure: ${proposal.recommendedInfrastructure?.name || proposal.title || proposal.proposedInfrastructureType} (${proposal.recommendedInfrastructure?.configuration || proposal.category || 'Grade Separator'})
- Alternative Considered: ${proposal.alternativeOption?.name || 'Surface widening'} (Reason: ${proposal.alternativeOption?.reasonRejected || 'Geometric and ROW constraints'})
- Cost Class: ${proposal.recommendedInfrastructure?.preliminaryCostCategory || proposal.estCost || 'Statutory Budget Class'}

Provide:
1. Engineering validation of why the recommended structure outperforms the rejected alternative.
2. Key utility and foundation risks (e.g., underground water mains, metro pier clash, soil strata).
3. Recommended next steps for Detailed Project Report (DPR).`;

    return this._queryGroq(systemPrompt, userPrompt);
  }

  /**
   * Ad-hoc Operator Intelligence Chat
   */
  async chatWithTrafficAgent(userQuery, cityId, activeRedZones = []) {
    const systemPrompt = `You are the central AI Assistant for the ${cityId.toUpperCase()} Traffic Mission Control Center.
Current active red zones in ${cityId}: ${activeRedZones.map((r) => `${r.corridorName} (${r.currentSpeedKmH || 15} km/h, +${r.delayMinutes}m delay)`).join(', ') || 'None'}.
Answer operator questions with crisp, professional brevity. Focus on actionable routing, police deployment, and corridor management.`;

    return this._queryGroq(systemPrompt, userQuery, 0.4);
  }
}

export const aiReasoningService = new AiReasoningService();
