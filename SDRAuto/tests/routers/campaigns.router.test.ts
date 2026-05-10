import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockDb } = vi.hoisted(() => {
  const mockDb = {
    campaign: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    account: {
      createMany: vi.fn(),
    },
  }
  return { mockDb }
})

vi.mock('../../src/lib/db.js', () => ({ db: mockDb }))

import { appRouter } from '../../src/routers/index.js'
import type { Context } from '../../src/trpc.js'

/**
 * TDD Test Suite: Campaigns Router
 *
 * Tests campaign CRUD, ICP definition, CSV upload/validation, and stats.
 * Spec refs: Technical Spec §3.3, PRD F1, M1, M4, App Flow §2.B
 */

// --- Fixtures ---
const validCampaignInput = {
  name: 'Q2 Founder Outreach',
  icpDefinition: {
    companySize: [10, 200],
    industry: ['SaaS', 'Fintech'],
    revenueSignals: ['Series A', 'Series B'],
    techStack: ['React', 'Node.js'],
  },
  autonomyLevel: 'L2' as const,
}

const validCsvContent = `domain,company_name,buyer_email
acme.com,Acme Corp,vp@acme.com
beta.io,Beta Inc,cto@beta.io
gamma.co,Gamma LLC,founder@gamma.co`

const invalidCsvContent = `domain,company_name
,Missing Domain Corp
beta.io,`

// --- Tests ---

describe('CampaignsRouter', () => {
  const ctx: Context = {
    req: {} as any,
    user: { id: 'user-1', email: 'test@test.com', role: 'founder' },
  }
  const caller = appRouter.createCaller(ctx)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a campaign with valid input', async () => {
      const createdCampaign = {
        id: 'camp-1',
        userId: 'user-1',
        name: 'Q2 Founder Outreach',
        status: 'draft',
        autonomyLevel: 'L2',
        icpDefinition: validCampaignInput.icpDefinition,
        createdAt: new Date(),
      }
      mockDb.campaign.create.mockResolvedValue(createdCampaign)

      const result = await caller.campaigns.create(validCampaignInput)
      expect(result.id).toBeDefined()
      expect(result.name).toBe('Q2 Founder Outreach')
      expect(result.status).toBe('draft')
      expect(result.autonomyLevel).toBe('L2')
    })

    it('should default autonomy level to L2 when not specified', async () => {
      const createdCampaign = {
        id: 'camp-2',
        userId: 'user-1',
        name: 'Test Campaign',
        status: 'draft',
        autonomyLevel: 'L2',
        icpDefinition: validCampaignInput.icpDefinition,
        createdAt: new Date(),
      }
      mockDb.campaign.create.mockResolvedValue(createdCampaign)

      const result = await caller.campaigns.create({
        name: 'Test Campaign',
        icpDefinition: validCampaignInput.icpDefinition,
      })
      expect(result.autonomyLevel).toBe('L2')
    })

    it('should reject empty campaign name', async () => {
      await expect(
        caller.campaigns.create({ ...validCampaignInput, name: '' })
      ).rejects.toThrow()
    })

    it('should only allow valid autonomy levels (L1-L4)', async () => {
      await expect(
        caller.campaigns.create({ ...validCampaignInput, autonomyLevel: 'L5' as any })
      ).rejects.toThrow()
    })
  })

  describe('list', () => {
    it('should return only campaigns belonging to the authenticated user', async () => {
      const campaigns = [
        { id: 'camp-1', userId: 'user-1', name: 'Campaign 1', createdAt: new Date('2024-01-02') },
        { id: 'camp-2', userId: 'user-1', name: 'Campaign 2', createdAt: new Date('2024-01-01') },
      ]
      mockDb.campaign.findMany.mockResolvedValue(campaigns)

      const results = await caller.campaigns.list()
      results.forEach(c => expect(c.userId).toBe('user-1'))
    })

    it('should order campaigns by creation date descending', async () => {
      const campaigns = [
        { id: 'camp-1', userId: 'user-1', name: 'Campaign 1', createdAt: new Date('2024-01-03') },
        { id: 'camp-2', userId: 'user-1', name: 'Campaign 2', createdAt: new Date('2024-01-02') },
        { id: 'camp-3', userId: 'user-1', name: 'Campaign 3', createdAt: new Date('2024-01-01') },
      ]
      mockDb.campaign.findMany.mockResolvedValue(campaigns)

      const results = await caller.campaigns.list()
      for (let i = 1; i < results.length; i++) {
        expect(new Date(results[i - 1].createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(results[i].createdAt).getTime())
      }
    })
  })

  describe('stats', () => {
    it('should return campaign KPIs', async () => {
      mockDb.campaign.findFirst.mockResolvedValue({
        id: 'camp-1',
        userId: 'user-1',
        accountsAdded: 10,
        firstTouchesSent: 8,
        repliesReceived: 2,
        meetingsBooked: 1,
      })

      const stats = await caller.campaigns.stats({ campaignId: 'camp-1' })
      expect(stats).toMatchObject({
        accountsAdded: expect.any(Number),
        firstTouchesSent: expect.any(Number),
        repliesReceived: expect.any(Number),
        meetingsBooked: expect.any(Number),
        replyRate: expect.any(Number),
      })
    })

    it('should not expose stats for campaigns owned by other users', async () => {
      mockDb.campaign.findFirst.mockResolvedValue(null)

      await expect(
        caller.campaigns.stats({ campaignId: 'other-user-campaign' })
      ).rejects.toThrow()
    })
  })

  describe('CSV Upload Validation', () => {
    it('should accept valid CSV with required columns', async () => {
      mockDb.campaign.findFirst.mockResolvedValue({ id: 'camp-1', userId: 'user-1' })
      mockDb.account.createMany.mockResolvedValue({ count: 3 })
      mockDb.campaign.update.mockResolvedValue({ id: 'camp-1' })

      const result = await caller.campaigns.uploadCSV({
        campaignId: 'camp-1',
        csvContent: validCsvContent,
      })
      expect(result.accountsImported).toBe(3)
      expect(result.validationErrors).toHaveLength(0)
    })

    it('should reject CSV with missing required columns', async () => {
      mockDb.campaign.findFirst.mockResolvedValue({ id: 'camp-1', userId: 'user-1' })

      const result = await caller.campaigns.uploadCSV({
        campaignId: 'camp-1',
        csvContent: 'name,email\nAcme,vp@acme.com',
      })
      expect(result.validationErrors.length).toBeGreaterThan(0)
      expect(result.validationErrors[0].field).toContain('domain')
    })

    it('should report empty rows with row numbers', async () => {
      mockDb.campaign.findFirst.mockResolvedValue({ id: 'camp-1', userId: 'user-1' })
      mockDb.account.createMany.mockResolvedValue({ count: 1 })
      mockDb.campaign.update.mockResolvedValue({ id: 'camp-1' })

      const result = await caller.campaigns.uploadCSV({
        campaignId: 'camp-1',
        csvContent: invalidCsvContent,
      })
      expect(result.validationErrors).toContainEqual(
        expect.objectContaining({ row: 2, field: 'domain' })
      )
    })

    it('should validate email format for buyer_email column', async () => {
      mockDb.campaign.findFirst.mockResolvedValue({ id: 'camp-1', userId: 'user-1' })

      const badEmailCsv = 'domain,company_name,buyer_email\nacme.com,Acme,not-an-email'
      const result = await caller.campaigns.uploadCSV({
        campaignId: 'camp-1',
        csvContent: badEmailCsv,
      })
      expect(result.validationErrors[0]).toMatchObject({ row: 2, field: 'buyer_email' })
    })

    it('should validate 95%+ of domains (per PRD F1)', async () => {
      mockDb.campaign.findFirst.mockResolvedValue({ id: 'camp-1', userId: 'user-1' })
      mockDb.account.createMany.mockResolvedValue({ count: 3 })
      mockDb.campaign.update.mockResolvedValue({ id: 'camp-1' })

      const result = await caller.campaigns.uploadCSV({
        campaignId: 'camp-1',
        csvContent: validCsvContent,
      })
      const total = result.accountsImported + result.invalidAccounts
      const validRate = total > 0 ? result.accountsImported / total : 1
      expect(validRate).toBeGreaterThanOrEqual(0.95)
    })

    it('should warn when ICP matches > 500 accounts', async () => {
      mockDb.campaign.findFirst.mockResolvedValue({ id: 'camp-1', userId: 'user-1' })
      mockDb.account.createMany.mockResolvedValue({ count: 501 })
      mockDb.campaign.update.mockResolvedValue({ id: 'camp-1' })

      // Build a CSV with 501 valid rows
      const header = 'domain,company_name,buyer_email'
      const rows = Array.from({ length: 501 }, (_, i) => `domain${i}.com,Company${i},user${i}@domain${i}.com`)
      const largeCsv = [header, ...rows].join('\n')

      const result = await caller.campaigns.uploadCSV({
        campaignId: 'camp-1',
        csvContent: largeCsv,
      })
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ type: 'too_many_accounts' })
      )
    })
  })
})
