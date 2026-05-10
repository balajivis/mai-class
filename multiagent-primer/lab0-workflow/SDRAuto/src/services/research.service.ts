import { llmGenerateJSON } from '../lib/anthropic.js'
import { logger } from '../lib/logger.js'
import type { ResearchBrief } from '../types/index.js'

export class ResearchService {
  async buildResearchBrief(
    accountId: string,
    companyName: string,
    domain: string,
    buyerEmail?: string
  ): Promise<ResearchBrief> {
    logger.info('Building research brief', { accountId, companyName, domain })

    // In production, this would call enrichment APIs (LinkedIn, Crunchbase, BuiltWith)
    // For Phase 1, we use Claude to generate a research brief from available data
    const brief = await llmGenerateJSON<Omit<ResearchBrief, 'accountId'>>(
      `You are a B2B sales research analyst. Generate a research brief for a target account.
Return valid JSON:
{
  "companyName": "string",
  "recentNews": [{ "headline": "string", "date": "YYYY-MM-DD", "sourceUrl": "https://..." }],
  "painIndicators": [{ "signal": "string", "confidence": 0.0-1.0, "date": "YYYY-MM-DD" }],
  "buyerPersona": { "role": "string", "seniority": "string", "likelyGoals": ["string"] },
  "icpFitScore": 0.0-1.0
}`,
      `Research the company "${companyName}" (domain: ${domain}).
${buyerEmail ? `Target buyer email: ${buyerEmail}` : ''}
Focus on: recent funding, hiring signals, product launches, pain points that an outbound sales tool could solve.
Generate realistic research data based on the company name and domain.`
    )

    return {
      accountId,
      ...brief,
    }
  }
}

export const researchService = new ResearchService()
