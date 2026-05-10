import { describe, it, expect } from 'vitest'
import {
  emailSchema,
  domainSchema,
  uuidSchema,
  autonomyLevelSchema,
  dailyCapSchema,
} from '../../src/lib/validation.js'

/**
 * TDD Test Suite: Shared Validation Schemas
 *
 * Tests Zod schemas for email, URL, UUID, and domain validation.
 * Spec refs: Backend §2 (lib/validation.ts)
 */

describe('Validation Schemas', () => {
  describe('email validation', () => {
    it('should accept valid email addresses', () => {
      expect(emailSchema.safeParse('user@example.com').success).toBe(true)
      expect(emailSchema.safeParse('vp.sales@acme.co.uk').success).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(emailSchema.safeParse('not-an-email').success).toBe(false)
      expect(emailSchema.safeParse('@missing-local.com').success).toBe(false)
      expect(emailSchema.safeParse('missing-domain@').success).toBe(false)
      expect(emailSchema.safeParse('').success).toBe(false)
    })
  })

  describe('domain validation', () => {
    it('should accept valid domains', () => {
      expect(domainSchema.safeParse('acme.com').success).toBe(true)
      expect(domainSchema.safeParse('sub.acme.co.uk').success).toBe(true)
    })

    it('should reject invalid domains', () => {
      expect(domainSchema.safeParse('not a domain').success).toBe(false)
      expect(domainSchema.safeParse('').success).toBe(false)
    })
  })

  describe('UUID validation', () => {
    it('should accept valid UUIDs', () => {
      expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false)
    })
  })

  describe('autonomy level validation', () => {
    it('should accept L1, L2, L3, L4', () => {
      ;['L1', 'L2', 'L3', 'L4'].forEach(level => {
        expect(autonomyLevelSchema.safeParse(level).success).toBe(true)
      })
    })

    it('should reject invalid autonomy levels', () => {
      expect(autonomyLevelSchema.safeParse('L0').success).toBe(false)
      expect(autonomyLevelSchema.safeParse('L5').success).toBe(false)
      expect(autonomyLevelSchema.safeParse('high').success).toBe(false)
    })
  })

  describe('daily cap validation', () => {
    it('should accept values between 1 and 100', () => {
      expect(dailyCapSchema.safeParse(1).success).toBe(true)
      expect(dailyCapSchema.safeParse(20).success).toBe(true)
      expect(dailyCapSchema.safeParse(100).success).toBe(true)
    })

    it('should reject values outside 1-100', () => {
      expect(dailyCapSchema.safeParse(0).success).toBe(false)
      expect(dailyCapSchema.safeParse(101).success).toBe(false)
      expect(dailyCapSchema.safeParse(-1).success).toBe(false)
    })
  })
})
