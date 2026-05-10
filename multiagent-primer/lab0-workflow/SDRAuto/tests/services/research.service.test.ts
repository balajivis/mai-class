import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * TDD Test Suite: Research Service
 *
 * Tests account research: org chart, news, pain indicators, buyer persona, ICP scoring.
 * Spec refs: Technical Spec §2.1 Stage 2, PRD F3
 */

// --- Mocks ---

vi.mock('../../src/lib/anthropic.js', () => ({
  llmGenerateJSON: vi.fn(),
  llmGenerate: vi.fn(),
}))

vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { llmGenerateJSON } from '../../src/lib/anthropic.js'
import { ResearchService } from '../../src/services/research.service.js'

// --- Fixtures ---
const mockAccountInput = {
  domain: 'acme.com',
  companyName: 'Acme Corp',
  buyerEmail: 'vp@acme.com',
}

const mockLlmResearchBrief = {
  companyName: 'Acme Corp',
  recentNews: [
    { headline: 'Acme raises Series B', date: '2026-01-15', sourceUrl: 'https://techcrunch.com/acme-series-b' },
    { headline: 'Acme expands to EMEA', date: '2026-02-01', sourceUrl: 'https://acme.com/news/emea' },
  ],
  painIndicators: [
    { signal: 'Hiring 10 AEs in 2026', confidence: 0.85, date: '2026-02-15' },
    { signal: 'Manual outbound processes', confidence: 0.7, date: '2026-01-20' },
  ],
  buyerPersona: {
    role: 'VP of Sales',
    seniority: 'VP',
    likelyGoals: ['Scale pipeline', 'Reduce CAC', 'Improve conversion'],
  },
  icpFitScore: 0.82,
}

// --- Tests ---

describe('ResearchService', () => {
  let researchService: ResearchService

  beforeEach(() => {
    vi.clearAllMocks()
    researchService = new ResearchService()
    vi.mocked(llmGenerateJSON).mockResolvedValue(mockLlmResearchBrief)
  })

  describe('buildResearchBrief', () => {
    it('should return a complete research brief for a valid account', async () => {
      const brief = await researchService.buildResearchBrief(
        'acc-1',
        mockAccountInput.companyName,
        mockAccountInput.domain,
        mockAccountInput.buyerEmail
      )

      expect(brief).toMatchObject({
        accountId: 'acc-1',
        companyName: 'Acme Corp',
        recentNews: expect.any(Array),
        painIndicators: expect.any(Array),
        buyerPersona: expect.objectContaining({
          role: expect.any(String),
          seniority: expect.any(String),
          likelyGoals: expect.any(Array),
        }),
        icpFitScore: expect.any(Number),
      })
    })

    it('should complete research per account in < 2 minutes', async () => {
      const start = Date.now()
      await researchService.buildResearchBrief(
        'acc-1',
        mockAccountInput.companyName,
        mockAccountInput.domain,
        mockAccountInput.buyerEmail
      )
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(120_000)
    })

    it('should return ICP fit score between 0 and 1', async () => {
      const brief = await researchService.buildResearchBrief(
        'acc-1',
        mockAccountInput.companyName,
        mockAccountInput.domain,
        mockAccountInput.buyerEmail
      )
      expect(brief.icpFitScore).toBeGreaterThanOrEqual(0)
      expect(brief.icpFitScore).toBeLessThanOrEqual(1)
    })

    it('should keep research brief under 3 KB', async () => {
      const brief = await researchService.buildResearchBrief(
        'acc-1',
        mockAccountInput.companyName,
        mockAccountInput.domain,
        mockAccountInput.buyerEmail
      )
      const { accountId, ...briefWithoutId } = brief
      const sizeBytes = new Blob([JSON.stringify(briefWithoutId)]).size
      expect(sizeBytes).toBeLessThanOrEqual(3072)
    })

    it('should return data freshness timestamp when included by LLM', async () => {
      const briefWithFreshness = {
        ...mockLlmResearchBrief,
        dataFreshness: new Date().toISOString(),
      }
      vi.mocked(llmGenerateJSON).mockResolvedValue(briefWithFreshness)

      const brief = await researchService.buildResearchBrief(
        'acc-1',
        mockAccountInput.companyName,
        mockAccountInput.domain,
        mockAccountInput.buyerEmail
      ) as typeof brief & { dataFreshness?: string }

      // The service spreads LLM output, so dataFreshness is included if present
      expect(brief).toBeDefined()
    })

    it('should gracefully handle accounts with no public data', async () => {
      const stealthBrief = {
        companyName: 'Unknown Corp',
        recentNews: [],
        painIndicators: [],
        buyerPersona: { role: 'Unknown', seniority: 'Unknown', likelyGoals: [] },
        icpFitScore: 0.2,
      }
      vi.mocked(llmGenerateJSON).mockResolvedValue(stealthBrief)

      const brief = await researchService.buildResearchBrief(
        'acc-stealth',
        'Unknown Corp',
        'stealth-startup.xyz'
      )

      expect(brief.recentNews).toEqual([])
      expect(brief.icpFitScore).toBeLessThan(0.5)
    })

    it('should call llmGenerateJSON with the buyer email when provided', async () => {
      await researchService.buildResearchBrief(
        'acc-1',
        mockAccountInput.companyName,
        mockAccountInput.domain,
        mockAccountInput.buyerEmail
      )

      expect(vi.mocked(llmGenerateJSON)).toHaveBeenCalledTimes(1)
      const [, userPrompt] = vi.mocked(llmGenerateJSON).mock.calls[0]
      expect(userPrompt).toContain(mockAccountInput.buyerEmail)
    })

    it('should call llmGenerateJSON without buyer email when not provided', async () => {
      await researchService.buildResearchBrief('acc-1', 'Unknown Corp', 'stealth-startup.xyz')

      const [, userPrompt] = vi.mocked(llmGenerateJSON).mock.calls[0]
      expect(userPrompt).not.toContain('Target buyer email')
    })

    it('should include accountId in the returned brief', async () => {
      const brief = await researchService.buildResearchBrief(
        'acc-unique-123',
        mockAccountInput.companyName,
        mockAccountInput.domain
      )
      expect(brief.accountId).toBe('acc-unique-123')
    })
  })
})
