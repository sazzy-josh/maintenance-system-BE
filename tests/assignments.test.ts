/**
 * assignments.test.ts
 *
 * Mock-based integration tests for the assignments endpoints.
 * Note: the assignments controller uses Zod with z.string().uuid(), so all
 * requestId and officerId values sent in request bodies must be valid UUIDs.
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
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    notification: { create: jest.fn() },
    statusUpdate: { create: jest.fn() },
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

const makeToken = (role: string, userId: string) =>
  jwt.sign(
    { sub: userId, email: `${userId}@test.edu`, role },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  )

// ── UUID fixtures (must be real UUID format for Zod validation) ───────────────

const ADMIN_ROLE     = { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'ADMIN' }
const OFFICER_ROLE   = { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480', name: 'OFFICER' }
const REQUESTER_ROLE = { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d481', name: 'REQUESTER' }

const ADMIN_ID      = 'a0000000-0000-0000-0000-000000000001'
const OFFICER_ID    = 'b0000000-0000-0000-0000-000000000002'
const OFFICER_ID_2  = 'b0000000-0000-0000-0000-000000000003'
const REQUESTER_ID  = 'c0000000-0000-0000-0000-000000000004'
const REQUEST_ID    = 'd0000000-0000-0000-0000-000000000005'
const ASSIGN_ID_1   = 'e0000000-0000-0000-0000-000000000006'
const ASSIGN_ID_2   = 'e0000000-0000-0000-0000-000000000007'

const makeUser = (role: { id: string; name: string }, id: string) => ({
  id,
  email: `${id}@test.edu`,
  fullName: 'Test User',
  isActive: true,
  roleId: role.id,
  role,
  specialization: 'Electrical',
  refreshTokenHash: null,
})

const SUBMITTED_REQUEST = {
  id: REQUEST_ID,
  referenceNo: 'REQ-2024-000001',
  title: 'Broken socket',
  description: 'Socket in room 101 is not working.',
  location: 'Block A',
  status: 'SUBMITTED',
  requesterId: REQUESTER_ID,
  categoryId: 'cat-id-1',
  dueAt: new Date(Date.now() + 86400000),
  createdAt: new Date(),
  requester: { id: REQUESTER_ID, email: 'requester@test.edu' },
}

const makeAssignment = (
  requestId = REQUEST_ID,
  officerId = OFFICER_ID,
  id = ASSIGN_ID_1,
  assignedById = ADMIN_ID
) => ({
  id,
  requestId,
  officerId,
  assignedById,
  status: 'ACTIVE',
  note: null,
  assignedAt: new Date(),
  completedAt: null,
})

// ── Suite: POST /api/v1/assignments ───────────────────────────────────────────

describe('Assignments – POST /api/v1/assignments (create)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})
    ;(prisma.notification.create as jest.Mock).mockResolvedValue({})
    ;(prisma.statusUpdate.create as jest.Mock).mockResolvedValue({})
    ;(prisma.assignment.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(prisma.serviceRequest.update as jest.Mock).mockResolvedValue({})
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
  })

  it('returns 201 and the request status becomes ASSIGNED', async () => {
    const adminToken = makeToken('ADMIN', ADMIN_ID)

    // authenticate → admin user; assignRequest → officer lookup; sendMail → requester
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(makeUser(ADMIN_ROLE, ADMIN_ID))
      .mockResolvedValueOnce(makeUser(OFFICER_ROLE, OFFICER_ID))
      .mockResolvedValueOnce(makeUser(REQUESTER_ROLE, REQUESTER_ID))

    ;(prisma.serviceRequest.findUnique as jest.Mock).mockResolvedValue(SUBMITTED_REQUEST)
    ;(prisma.assignment.create as jest.Mock).mockResolvedValue(makeAssignment())

    const res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ requestId: REQUEST_ID, officerId: OFFICER_ID })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toMatchObject({
      requestId: REQUEST_ID,
      officerId: OFFICER_ID,
      status: 'ACTIVE',
    })

    // Confirm serviceRequest.update was called to set status ASSIGNED
    expect(prisma.serviceRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: REQUEST_ID },
        data: { status: 'ASSIGNED' },
      })
    )
  })

  it('returns 400 when the targeted user is not an OFFICER', async () => {
    const adminToken = makeToken('ADMIN', ADMIN_ID)

    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(makeUser(ADMIN_ROLE, ADMIN_ID))
      .mockResolvedValueOnce(makeUser(REQUESTER_ROLE, REQUESTER_ID)) // not an officer

    ;(prisma.serviceRequest.findUnique as jest.Mock).mockResolvedValue(SUBMITTED_REQUEST)

    const res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ requestId: REQUEST_ID, officerId: REQUESTER_ID })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('INVALID_OFFICER')
  })

  it('returns 400 when the targeted officer is inactive', async () => {
    const adminToken = makeToken('ADMIN', ADMIN_ID)

    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(makeUser(ADMIN_ROLE, ADMIN_ID))
      .mockResolvedValueOnce({ ...makeUser(OFFICER_ROLE, OFFICER_ID), isActive: false })

    ;(prisma.serviceRequest.findUnique as jest.Mock).mockResolvedValue(SUBMITTED_REQUEST)

    const res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ requestId: REQUEST_ID, officerId: OFFICER_ID })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('INVALID_OFFICER')
  })

  it('returns 409 when the request is not in SUBMITTED or ASSIGNED status', async () => {
    const adminToken = makeToken('ADMIN', ADMIN_ID)

    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(makeUser(ADMIN_ROLE, ADMIN_ID))
      .mockResolvedValueOnce(makeUser(OFFICER_ROLE, OFFICER_ID))

    ;(prisma.serviceRequest.findUnique as jest.Mock).mockResolvedValue({
      ...SUBMITTED_REQUEST,
      status: 'IN_PROGRESS', // not assignable
    })

    const res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ requestId: REQUEST_ID, officerId: OFFICER_ID })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('INVALID_STATUS')
  })

  it('returns 400 when requestId is not a valid UUID', async () => {
    // Reset and then set a fresh implementation so Once queues from prior tests don't bleed
    ;(prisma.user.findUnique as jest.Mock).mockReset().mockResolvedValue(makeUser(ADMIN_ROLE, ADMIN_ID))

    const adminToken = makeToken('ADMIN', ADMIN_ID)
    const res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ requestId: 'not-a-uuid', officerId: OFFICER_ID })

    expect(res.status).toBe(400)
  })

  it('returns 403 when a non-ADMIN (OFFICER) tries to assign', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockImplementation(() =>
      Promise.resolve(makeUser(OFFICER_ROLE, OFFICER_ID))
    )

    const officerToken = makeToken('OFFICER', OFFICER_ID)
    const res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ requestId: REQUEST_ID, officerId: OFFICER_ID })

    expect(res.status).toBe(403)
  })

  it('marks old ACTIVE assignment as REASSIGNED when reassigning', async () => {
    const adminToken = makeToken('ADMIN', ADMIN_ID)

    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(makeUser(ADMIN_ROLE, ADMIN_ID))
      .mockResolvedValueOnce(makeUser(OFFICER_ROLE, OFFICER_ID_2))
      .mockResolvedValueOnce(makeUser(REQUESTER_ROLE, REQUESTER_ID))

    ;(prisma.serviceRequest.findUnique as jest.Mock).mockResolvedValue({
      ...SUBMITTED_REQUEST,
      status: 'ASSIGNED',
    })
    ;(prisma.assignment.create as jest.Mock).mockResolvedValue(
      makeAssignment(REQUEST_ID, OFFICER_ID_2, ASSIGN_ID_2)
    )

    const res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ requestId: REQUEST_ID, officerId: OFFICER_ID_2 })

    expect(res.status).toBe(201)

    // Old ACTIVE assignment must be marked REASSIGNED
    expect(prisma.assignment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { requestId: REQUEST_ID, status: 'ACTIVE' },
        data: { status: 'REASSIGNED' },
      })
    )
  })
})

// ── Suite: PATCH /api/v1/assignments/:id/reassign ─────────────────────────────

describe('Assignments – PATCH /api/v1/assignments/:id/reassign', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})
    ;(prisma.notification.create as jest.Mock).mockResolvedValue({})
    ;(prisma.statusUpdate.create as jest.Mock).mockResolvedValue({})
    ;(prisma.assignment.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
    ;(prisma.serviceRequest.update as jest.Mock).mockResolvedValue({})
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
  })

  it('returns 200 when admin successfully reassigns', async () => {
    const adminToken = makeToken('ADMIN', ADMIN_ID)

    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(makeUser(ADMIN_ROLE, ADMIN_ID))         // authenticate
      .mockResolvedValueOnce(makeUser(OFFICER_ROLE, OFFICER_ID_2))   // officer check
      .mockResolvedValueOnce(makeUser(REQUESTER_ROLE, REQUESTER_ID)) // requester email

    ;(prisma.assignment.findUnique as jest.Mock).mockResolvedValue({
      ...makeAssignment(),
      request: SUBMITTED_REQUEST,
    })
    ;(prisma.serviceRequest.findUnique as jest.Mock).mockResolvedValue({
      ...SUBMITTED_REQUEST,
      status: 'ASSIGNED',
    })
    ;(prisma.assignment.create as jest.Mock).mockResolvedValue(
      makeAssignment(REQUEST_ID, OFFICER_ID_2, ASSIGN_ID_2)
    )

    const res = await request(app)
      .patch(`/api/v1/assignments/${ASSIGN_ID_1}/reassign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ officerId: OFFICER_ID_2, note: 'Specialist needed' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('returns 403 when an OFFICER tries to reassign', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(OFFICER_ROLE, OFFICER_ID))

    const res = await request(app)
      .patch(`/api/v1/assignments/${ASSIGN_ID_1}/reassign`)
      .set('Authorization', `Bearer ${makeToken('OFFICER', OFFICER_ID)}`)
      .send({ officerId: OFFICER_ID_2 })

    expect(res.status).toBe(403)
  })

  it('returns 403 when a REQUESTER tries to reassign', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(REQUESTER_ROLE, REQUESTER_ID))

    const res = await request(app)
      .patch(`/api/v1/assignments/${ASSIGN_ID_1}/reassign`)
      .set('Authorization', `Bearer ${makeToken('REQUESTER', REQUESTER_ID)}`)
      .send({ officerId: OFFICER_ID })

    expect(res.status).toBe(403)
  })
})

// ── Suite: GET /api/v1/assignments/my ─────────────────────────────────────────

describe('Assignments – GET /api/v1/assignments/my', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})
  })

  it('returns 200 with the officer\'s active assignments', async () => {
    const officerToken = makeToken('OFFICER', OFFICER_ID)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(OFFICER_ROLE, OFFICER_ID))

    const assignments = [
      {
        ...makeAssignment(),
        request: {
          id: REQUEST_ID,
          title: 'Broken socket',
          status: 'ASSIGNED',
          category: { name: 'Electrical' },
          requester: { id: REQUESTER_ID, fullName: 'Test User' },
        },
      },
    ]
    ;(prisma.assignment.findMany as jest.Mock).mockResolvedValue(assignments)

    const res = await request(app)
      .get('/api/v1/assignments/my')
      .set('Authorization', `Bearer ${officerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0]).toHaveProperty('requestId', REQUEST_ID)
  })

  it('returns 200 with an empty array when officer has no active assignments', async () => {
    const officerToken = makeToken('OFFICER', OFFICER_ID)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(OFFICER_ROLE, OFFICER_ID))
    ;(prisma.assignment.findMany as jest.Mock).mockResolvedValue([])

    const res = await request(app)
      .get('/api/v1/assignments/my')
      .set('Authorization', `Bearer ${officerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(0)
  })

  it('returns 403 when a REQUESTER tries to access officer assignments', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(REQUESTER_ROLE, REQUESTER_ID))

    const res = await request(app)
      .get('/api/v1/assignments/my')
      .set('Authorization', `Bearer ${makeToken('REQUESTER', REQUESTER_ID)}`)

    expect(res.status).toBe(403)
  })

  it('returns 403 when an ADMIN tries to access the officer-only route', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(ADMIN_ROLE, ADMIN_ID))

    const res = await request(app)
      .get('/api/v1/assignments/my')
      .set('Authorization', `Bearer ${makeToken('ADMIN', ADMIN_ID)}`)

    expect(res.status).toBe(403)
  })

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/v1/assignments/my')
    expect(res.status).toBe(401)
  })
})
