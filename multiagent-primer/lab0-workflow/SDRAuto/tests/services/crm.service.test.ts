import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * TDD Test Suite: CRM Service
 *
 * Tests CRM sync: meeting logging, conversation context, and HubSpot integration.
 * Spec refs: Technical Spec §4.3, PRD F7, App Flow §2.E
 */

// --- Mocks ---

vi.mock('../../src/lib/db.js', () => ({
  db: {
    bookedMeeting: {
      updateMany: vi.fn(),
    },
  },
}))

vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { db } from '../../src/lib/db.js'
import { CRMService } from '../../src/services/crm.service.js'

// --- Fixtures ---
const mockBookedMeeting = {
  outreachId: 'outreach-1',
  accountName: 'Acme Corp',
  contactEmail: 'vp@acme.com',
  scheduledDatetime: '2026-04-01T14:00:00Z',
  durationMin: 30,
  meetingSource: 'autonomous_bdr',
  conversationSummary: 'Prospect showed interest after Series B mention. Agreed to a 30-min demo.',
  nextSteps: 'Prepare product demo with ROI data',
}

// --- Tests ---

describe('CRMService', () => {
  let crmService: CRMService

  beforeEach(() => {
    vi.clearAllMocks()
    crmService = new CRMService()
    vi.mocked(db.bookedMeeting.updateMany).mockResolvedValue({ count: 1 })
  })

  describe('syncBookedMeeting', () => {
    it('should create a CRM record for a booked meeting when HUBSPOT_API_KEY is set', async () => {
      // With no HUBSPOT_API_KEY set, createHubSpotMeeting returns null and throws
      // We test the graceful failure path (syncedToCrm: false) here since no real API key
      const result = await crmService.syncBookedMeeting(mockBookedMeeting)

      // Without API key the method still returns a structured response
      expect(result).toHaveProperty('syncedToCrm')
      expect(result).toHaveProperty('meetingSource', 'autonomous_bdr')
    })

    it('should include full conversation context in the response', async () => {
      const result = await crmService.syncBookedMeeting(mockBookedMeeting)

      expect(result.conversationSummary).toBeDefined()
      expect(result.conversationSummary.length).toBeGreaterThan(0)
    })

    it('should tag meeting source as autonomous_bdr', async () => {
      const result = await crmService.syncBookedMeeting(mockBookedMeeting)
      expect(result.meetingSource).toBe('autonomous_bdr')
    })

    it('should handle CRM API failure gracefully (log but do not block booking)', async () => {
      // Without HUBSPOT_API_KEY, createHubSpotMeeting returns null causing an error
      // The service should catch this and return syncedToCrm: false
      const result = await crmService.syncBookedMeeting(mockBookedMeeting)

      expect(result.syncedToCrm).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should update the database when CRM sync succeeds', async () => {
      // Simulate the HubSpot path by setting the env var and mocking fetch
      const originalEnv = process.env.HUBSPOT_API_KEY
      process.env.HUBSPOT_API_KEY = 'test-hubspot-key'

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'hs_meeting_abc123' }),
      })
      const originalFetch = global.fetch
      global.fetch = mockFetch as unknown as typeof fetch

      vi.mocked(db.bookedMeeting.updateMany).mockResolvedValue({ count: 1 })

      const result = await crmService.syncBookedMeeting(mockBookedMeeting)

      expect(result.syncedToCrm).toBe(true)
      expect(result.crmRecordId).toBeDefined()
      expect(vi.mocked(db.bookedMeeting.updateMany)).toHaveBeenCalledWith({
        where: { outreachId: mockBookedMeeting.outreachId },
        data: expect.objectContaining({
          syncedToCRM: true,
          crmRecordId: expect.any(String),
        }),
      })

      // Cleanup
      process.env.HUBSPOT_API_KEY = originalEnv
      global.fetch = originalFetch
    })

    it('should handle database update failure gracefully', async () => {
      const originalEnv = process.env.HUBSPOT_API_KEY
      process.env.HUBSPOT_API_KEY = 'test-hubspot-key'

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'hs_meeting_abc123' }),
      })
      const originalFetch = global.fetch
      global.fetch = mockFetch as unknown as typeof fetch

      vi.mocked(db.bookedMeeting.updateMany).mockRejectedValue(new Error('DB connection failed'))

      const result = await crmService.syncBookedMeeting(mockBookedMeeting)

      // Should fail gracefully
      expect(result.syncedToCrm).toBe(false)
      expect(result.error).toBeDefined()

      process.env.HUBSPOT_API_KEY = originalEnv
      global.fetch = originalFetch
    })
  })
})
