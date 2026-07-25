/**
 * statusTransitions.test.ts
 *
 * Pure unit tests for the canTransition function from requests.service.ts.
 * No HTTP calls, no mocks required – this exercises the logic directly.
 */

import { canTransition } from '../src/modules/requests/requests.service'

describe('canTransition', () => {
  // ── SUBMITTED transitions ──────────────────────────────────────────────────

  describe('from SUBMITTED', () => {
    it('allows ADMIN to transition SUBMITTED → ASSIGNED', () => {
      expect(canTransition('SUBMITTED', 'ASSIGNED', 'ADMIN', false)).toBe(true)
    })

    it('allows ADMIN to transition SUBMITTED → REJECTED', () => {
      expect(canTransition('SUBMITTED', 'REJECTED', 'ADMIN', false)).toBe(true)
    })

    it('allows the request owner to CANCEL from SUBMITTED', () => {
      expect(canTransition('SUBMITTED', 'CANCELLED', 'REQUESTER', true)).toBe(true)
    })

    it('allows ADMIN to CANCEL from SUBMITTED (even if not owner)', () => {
      expect(canTransition('SUBMITTED', 'CANCELLED', 'ADMIN', false)).toBe(true)
    })

    it('prevents non-owner REQUESTER from cancelling', () => {
      expect(canTransition('SUBMITTED', 'CANCELLED', 'REQUESTER', false)).toBe(false)
    })

    it('prevents OFFICER from transitioning SUBMITTED → ASSIGNED', () => {
      expect(canTransition('SUBMITTED', 'ASSIGNED', 'OFFICER', false)).toBe(false)
    })

    it('prevents OFFICER from transitioning SUBMITTED → REJECTED', () => {
      expect(canTransition('SUBMITTED', 'REJECTED', 'OFFICER', false)).toBe(false)
    })

    it('prevents REQUESTER from transitioning SUBMITTED → IN_PROGRESS', () => {
      expect(canTransition('SUBMITTED', 'IN_PROGRESS', 'REQUESTER', true)).toBe(false)
    })

    it('prevents ADMIN from going SUBMITTED → IN_PROGRESS directly', () => {
      expect(canTransition('SUBMITTED', 'IN_PROGRESS', 'ADMIN', false)).toBe(false)
    })
  })

  // ── ASSIGNED transitions ───────────────────────────────────────────────────

  describe('from ASSIGNED', () => {
    it('allows OFFICER to start work (ASSIGNED → IN_PROGRESS)', () => {
      expect(canTransition('ASSIGNED', 'IN_PROGRESS', 'OFFICER', false)).toBe(true)
    })

    it('allows ADMIN to start work (ASSIGNED → IN_PROGRESS)', () => {
      expect(canTransition('ASSIGNED', 'IN_PROGRESS', 'ADMIN', false)).toBe(true)
    })

    it('allows ADMIN to reassign (ASSIGNED → ASSIGNED)', () => {
      expect(canTransition('ASSIGNED', 'ASSIGNED', 'ADMIN', false)).toBe(true)
    })

    it('prevents REQUESTER from transitioning ASSIGNED → IN_PROGRESS', () => {
      expect(canTransition('ASSIGNED', 'IN_PROGRESS', 'REQUESTER', false)).toBe(false)
    })

    it('prevents REQUESTER owner from transitioning ASSIGNED → IN_PROGRESS', () => {
      expect(canTransition('ASSIGNED', 'IN_PROGRESS', 'REQUESTER', true)).toBe(false)
    })

    it('prevents OFFICER from transitioning ASSIGNED → REJECTED', () => {
      expect(canTransition('ASSIGNED', 'REJECTED', 'OFFICER', false)).toBe(false)
    })
  })

  // ── IN_PROGRESS transitions ────────────────────────────────────────────────

  describe('from IN_PROGRESS', () => {
    it('allows OFFICER to put request ON_HOLD', () => {
      expect(canTransition('IN_PROGRESS', 'ON_HOLD', 'OFFICER', false)).toBe(true)
    })

    it('allows ADMIN to put request ON_HOLD', () => {
      expect(canTransition('IN_PROGRESS', 'ON_HOLD', 'ADMIN', false)).toBe(true)
    })

    it('allows OFFICER to COMPLETE a request', () => {
      expect(canTransition('IN_PROGRESS', 'COMPLETED', 'OFFICER', false)).toBe(true)
    })

    it('allows ADMIN to COMPLETE a request', () => {
      expect(canTransition('IN_PROGRESS', 'COMPLETED', 'ADMIN', false)).toBe(true)
    })

    it('prevents REQUESTER from changing IN_PROGRESS → COMPLETED', () => {
      expect(canTransition('IN_PROGRESS', 'COMPLETED', 'REQUESTER', true)).toBe(false)
    })

    it('prevents REQUESTER from changing IN_PROGRESS → ON_HOLD', () => {
      expect(canTransition('IN_PROGRESS', 'ON_HOLD', 'REQUESTER', false)).toBe(false)
    })

    it('prevents OFFICER from rejecting an in-progress request', () => {
      expect(canTransition('IN_PROGRESS', 'REJECTED', 'OFFICER', false)).toBe(false)
    })
  })

  // ── ON_HOLD transitions ────────────────────────────────────────────────────

  describe('from ON_HOLD', () => {
    it('allows OFFICER to resume (ON_HOLD → IN_PROGRESS)', () => {
      expect(canTransition('ON_HOLD', 'IN_PROGRESS', 'OFFICER', false)).toBe(true)
    })

    it('allows ADMIN to resume (ON_HOLD → IN_PROGRESS)', () => {
      expect(canTransition('ON_HOLD', 'IN_PROGRESS', 'ADMIN', false)).toBe(true)
    })

    it('prevents REQUESTER from resuming ON_HOLD', () => {
      expect(canTransition('ON_HOLD', 'IN_PROGRESS', 'REQUESTER', false)).toBe(false)
    })

    it('prevents REQUESTER owner from resuming ON_HOLD', () => {
      expect(canTransition('ON_HOLD', 'IN_PROGRESS', 'REQUESTER', true)).toBe(false)
    })

    it('prevents OFFICER from going ON_HOLD → COMPLETED directly', () => {
      expect(canTransition('ON_HOLD', 'COMPLETED', 'OFFICER', false)).toBe(false)
    })
  })

  // ── COMPLETED transitions ──────────────────────────────────────────────────

  describe('from COMPLETED', () => {
    it('allows the request owner to CLOSE a COMPLETED request', () => {
      expect(canTransition('COMPLETED', 'CLOSED', 'REQUESTER', true)).toBe(true)
    })

    it('allows ADMIN to close a COMPLETED request', () => {
      expect(canTransition('COMPLETED', 'CLOSED', 'ADMIN', false)).toBe(true)
    })

    it('allows ADMIN to reopen (COMPLETED → IN_PROGRESS)', () => {
      expect(canTransition('COMPLETED', 'IN_PROGRESS', 'ADMIN', false)).toBe(true)
    })

    it('prevents a non-owner REQUESTER from closing COMPLETED', () => {
      expect(canTransition('COMPLETED', 'CLOSED', 'REQUESTER', false)).toBe(false)
    })

    it('prevents OFFICER from closing COMPLETED', () => {
      expect(canTransition('COMPLETED', 'CLOSED', 'OFFICER', false)).toBe(false)
    })

    it('prevents OFFICER from reopening COMPLETED → IN_PROGRESS', () => {
      expect(canTransition('COMPLETED', 'IN_PROGRESS', 'OFFICER', false)).toBe(false)
    })
  })

  // ── Terminal states ────────────────────────────────────────────────────────

  describe('terminal states block all further transitions', () => {
    it('prevents any transition from CLOSED (ADMIN)', () => {
      expect(canTransition('CLOSED', 'IN_PROGRESS', 'ADMIN', false)).toBe(false)
    })

    it('prevents any transition from CLOSED (REQUESTER owner)', () => {
      expect(canTransition('CLOSED', 'SUBMITTED', 'REQUESTER', true)).toBe(false)
    })

    it('prevents any transition from REJECTED (ADMIN)', () => {
      expect(canTransition('REJECTED', 'ASSIGNED', 'ADMIN', false)).toBe(false)
    })

    it('prevents any transition from REJECTED (OFFICER)', () => {
      expect(canTransition('REJECTED', 'IN_PROGRESS', 'OFFICER', false)).toBe(false)
    })

    it('prevents any transition from CANCELLED (ADMIN)', () => {
      expect(canTransition('CANCELLED', 'SUBMITTED', 'ADMIN', false)).toBe(false)
    })

    it('prevents any transition from CANCELLED (REQUESTER owner)', () => {
      expect(canTransition('CANCELLED', 'SUBMITTED', 'REQUESTER', true)).toBe(false)
    })
  })
})
