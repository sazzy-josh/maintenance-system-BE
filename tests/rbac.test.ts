/**
 * rbac.test.ts
 *
 * Verifies that every "❌" cell in the permission matrix returns 403.
 * JWTs are signed with the test secret. Prisma is mocked so middleware
 * can resolve the user from the token payload.
 */

process.env.JWT_SECRET = 'test-secret-minimum-32-chars-ok!!'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32chars'
process.env.NODE_ENV = 'test'
process.env.RATE_LIMIT_MAX = '10000'

import request from 'supertest'
import jwt from 'jsonwebtoken'

// Disable all rate limiting so tests don't hit per-route limits
jest.mock('express-rate-limit', () => {
  return () => (_req: any, _res: any, next: any) => next()
})

jest.mock('../src/config/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    role: { findUnique: jest.fn() },
    auditLog: { create: jest.fn() },
    serviceRequest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    assignment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    requestCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  },
}))

jest.mock('../src/sockets/socket', () => ({
  emitToUser: jest.fn(),
  emitToRole: jest.fn(),
  emitToRequest: jest.fn(),
  getIO: jest.fn(),
}))

jest.mock('../src/config/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
  emailTemplates: {
    requestSubmitted: jest.fn().mockReturnValue(''),
    requestAssigned: jest.fn().mockReturnValue(''),
    statusChanged: jest.fn().mockReturnValue(''),
    officerAssigned: jest.fn().mockReturnValue(''),
  },
  transporter: { sendMail: jest.fn() },
}))

import app from '../src/app'
import { prisma } from '../src/config/db'

// ── Token factory ──────────────────────────────────────────────────────────────

const makeToken = (role: string, userId = 'test-user-id') =>
  jwt.sign(
    { sub: userId, email: 'test@test.com', role },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  )

// ── Fixtures ───────────────────────────────────────────────────────────────────

const officerRole = { id: 'role-officer', name: 'OFFICER' }
const requesterRole = { id: 'role-requester', name: 'REQUESTER' }
const adminRole = { id: 'role-admin', name: 'ADMIN' }

const makeDbUser = (role: { id: string; name: string }, userId = 'test-user-id') => ({
  id: userId,
  email: 'test@test.com',
  fullName: 'Test User',
  isActive: true,
  roleId: role.id,
  role,
})

// Seed findUnique so authenticate middleware can resolve the caller
const seedUserForToken = (role: { id: string; name: string }, userId = 'test-user-id') => {
  ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeDbUser(role, userId))
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('RBAC – permission matrix ❌ cells return 403', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // OFFICER restrictions
  // ─────────────────────────────────────────────────────────────────────────────

  describe('OFFICER cannot create a service request', () => {
    it('POST /api/v1/requests → 403', async () => {
      seedUserForToken(officerRole)

      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${makeToken('OFFICER')}`)
        .field('title', 'Broken AC')
        .field('categoryId', 'cat-id-1')
        .field('location', 'Block A')
        .field('description', 'The AC unit in room 101 stopped working.')

      expect(res.status).toBe(403)
    })
  })

  describe('OFFICER cannot assign a request', () => {
    it('POST /api/v1/assignments → 403', async () => {
      seedUserForToken(officerRole)

      const res = await request(app)
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${makeToken('OFFICER')}`)
        .send({ requestId: 'req-uuid-1', officerId: 'officer-uuid-2' })

      expect(res.status).toBe(403)
    })
  })

  describe('OFFICER cannot reassign a request', () => {
    it('PATCH /api/v1/assignments/:id/reassign → 403', async () => {
      seedUserForToken(officerRole)

      const res = await request(app)
        .patch('/api/v1/assignments/assign-id-1/reassign')
        .set('Authorization', `Bearer ${makeToken('OFFICER')}`)
        .send({ officerId: 'other-officer-id' })

      expect(res.status).toBe(403)
    })
  })

  describe('OFFICER cannot set priority', () => {
    it('PATCH /api/v1/requests/:id/priority → 403', async () => {
      seedUserForToken(officerRole)

      const res = await request(app)
        .patch('/api/v1/requests/req-uuid-1/priority')
        .set('Authorization', `Bearer ${makeToken('OFFICER')}`)
        .send({ priority: 'HIGH' })

      expect(res.status).toBe(403)
    })
  })

  describe('OFFICER cannot manage users', () => {
    it('GET /api/v1/users → 403', async () => {
      seedUserForToken(officerRole)

      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${makeToken('OFFICER')}`)

      expect(res.status).toBe(403)
    })

    it('POST /api/v1/users → 403', async () => {
      seedUserForToken(officerRole)

      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${makeToken('OFFICER')}`)
        .send({
          fullName: 'Bob',
          email: 'bob@test.edu',
          matricOrStaffId: 'STF001',
          password: 'Password1!',
          role: 'OFFICER',
        })

      expect(res.status).toBe(403)
    })
  })

  describe('OFFICER cannot view audit log', () => {
    it('GET /api/v1/audit → 403', async () => {
      seedUserForToken(officerRole)

      const res = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${makeToken('OFFICER')}`)

      expect(res.status).toBe(403)
    })
  })

  describe('OFFICER cannot access reports', () => {
    it('GET /api/v1/reports/summary → 403', async () => {
      seedUserForToken(officerRole)

      const res = await request(app)
        .get('/api/v1/reports/summary')
        .set('Authorization', `Bearer ${makeToken('OFFICER')}`)

      expect(res.status).toBe(403)
    })

    it('GET /api/v1/reports/export/csv → 403', async () => {
      seedUserForToken(officerRole)

      const res = await request(app)
        .get('/api/v1/reports/export/csv')
        .set('Authorization', `Bearer ${makeToken('OFFICER')}`)

      expect(res.status).toBe(403)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // REQUESTER restrictions
  // ─────────────────────────────────────────────────────────────────────────────

  describe('REQUESTER cannot manage categories', () => {
    it('POST /api/v1/categories → 403', async () => {
      seedUserForToken(requesterRole)

      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${makeToken('REQUESTER')}`)
        .send({ name: 'Plumbing', description: 'Water-related issues', slaHours: 24 })

      expect(res.status).toBe(403)
    })

    it('PATCH /api/v1/categories/:id → 403', async () => {
      seedUserForToken(requesterRole)

      const res = await request(app)
        .patch('/api/v1/categories/cat-id-1')
        .set('Authorization', `Bearer ${makeToken('REQUESTER')}`)
        .send({ name: 'Updated Name' })

      expect(res.status).toBe(403)
    })

    it('DELETE /api/v1/categories/:id → 403', async () => {
      seedUserForToken(requesterRole)

      const res = await request(app)
        .delete('/api/v1/categories/cat-id-1')
        .set('Authorization', `Bearer ${makeToken('REQUESTER')}`)

      expect(res.status).toBe(403)
    })
  })

  describe('REQUESTER cannot manage users', () => {
    it('GET /api/v1/users → 403', async () => {
      seedUserForToken(requesterRole)

      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${makeToken('REQUESTER')}`)

      expect(res.status).toBe(403)
    })

    it('POST /api/v1/users → 403', async () => {
      seedUserForToken(requesterRole)

      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${makeToken('REQUESTER')}`)
        .send({
          fullName: 'Bob',
          email: 'bob@test.edu',
          matricOrStaffId: 'STF001',
          password: 'Password1!',
          role: 'OFFICER',
        })

      expect(res.status).toBe(403)
    })
  })

  describe('REQUESTER cannot view audit log', () => {
    it('GET /api/v1/audit → 403', async () => {
      seedUserForToken(requesterRole)

      const res = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${makeToken('REQUESTER')}`)

      expect(res.status).toBe(403)
    })
  })

  describe('REQUESTER cannot export reports', () => {
    it('GET /api/v1/reports/summary → 403', async () => {
      seedUserForToken(requesterRole)

      const res = await request(app)
        .get('/api/v1/reports/summary')
        .set('Authorization', `Bearer ${makeToken('REQUESTER')}`)

      expect(res.status).toBe(403)
    })

    it('GET /api/v1/reports/export/csv → 403', async () => {
      seedUserForToken(requesterRole)

      const res = await request(app)
        .get('/api/v1/reports/export/csv')
        .set('Authorization', `Bearer ${makeToken('REQUESTER')}`)

      expect(res.status).toBe(403)
    })

    it('GET /api/v1/reports/export/pdf → 403', async () => {
      seedUserForToken(requesterRole)

      const res = await request(app)
        .get('/api/v1/reports/export/pdf')
        .set('Authorization', `Bearer ${makeToken('REQUESTER')}`)

      expect(res.status).toBe(403)
    })
  })

  describe('REQUESTER cannot transition to a status they do not own', () => {
    /**
     * Trying to move a request they do NOT own to CANCELLED should return 403
     * (the service checks ownership inside transitionStatus).
     */
    it('PATCH /api/v1/requests/:id/status (non-owner cancel) → 403 or 409', async () => {
      const requesterId = 'different-user-id'
      const callerId = 'caller-user-id'
      const token = makeToken('REQUESTER', callerId)

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(
        makeDbUser(requesterRole, callerId)
      )
      ;(prisma.serviceRequest.findUnique as jest.Mock).mockResolvedValue({
        id: 'req-id-1',
        requesterId, // owned by someone else
        status: 'SUBMITTED',
        referenceNo: 'REQ-2024-000001',
        assignments: [],
        requester: { email: 'other@test.edu' },
      })

      const res = await request(app)
        .patch('/api/v1/requests/req-id-1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'CANCELLED' })

      // Either 403 (canTransition false → FORBIDDEN from inside service) or
      // 409 (INVALID_TRANSITION) are acceptable — both mean "denied".
      expect([403, 409]).toContain(res.status)
    })
  })

  describe('REQUESTER cannot set request priority', () => {
    it('PATCH /api/v1/requests/:id/priority → 403', async () => {
      seedUserForToken(requesterRole)

      const res = await request(app)
        .patch('/api/v1/requests/req-id-1/priority')
        .set('Authorization', `Bearer ${makeToken('REQUESTER')}`)
        .send({ priority: 'URGENT' })

      expect(res.status).toBe(403)
    })
  })
})
