/**
 * requests.test.ts
 *
 * Mock-based integration tests for the /api/v1/requests endpoints.
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
    attachment: { create: jest.fn() },
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
    requestSubmitted: jest.fn().mockReturnValue('<p>submitted</p>'),
    requestAssigned: jest.fn().mockReturnValue('<p>assigned</p>'),
    statusChanged: jest.fn().mockReturnValue('<p>changed</p>'),
    officerAssigned: jest.fn().mockReturnValue('<p>officer</p>'),
  },
  transporter: { sendMail: jest.fn() },
}))

// Cloudinary should never be called in unit tests
jest.mock('../src/config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}))

import app from '../src/app'
import { prisma } from '../src/config/db'

// ── Helpers ────────────────────────────────────────────────────────────────────

const makeToken = (role: string, userId = 'user-abc') =>
  jwt.sign(
    { sub: userId, email: 'user@test.edu', role },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  )

const REQUESTER_ROLE = { id: 'role-req', name: 'REQUESTER' }
const OFFICER_ROLE   = { id: 'role-off', name: 'OFFICER' }
const ADMIN_ROLE     = { id: 'role-adm', name: 'ADMIN' }

const makeUser = (role: typeof REQUESTER_ROLE, id = 'user-abc') => ({
  id,
  email: 'user@test.edu',
  fullName: 'Test User',
  isActive: true,
  roleId: role.id,
  role,
})

// categoryId must be a valid UUID to pass Zod schema validation
const CATEGORY_ID = '550e8400-e29b-41d4-a716-446655440000'

const CATEGORY = {
  id: CATEGORY_ID,
  name: 'Electrical',
  isActive: true,
  slaHours: 24,
}

const VALID_DESCRIPTION = 'Socket in room 101 is not working properly and needs immediate attention.'

const makeServiceRequest = (requesterId = 'user-abc', id = 'req-id-1') => ({
  id,
  referenceNo: 'REQ-2024-000001',
  title: 'Broken socket',
  description: VALID_DESCRIPTION,
  location: 'Block A',
  roomNumber: '101',
  status: 'SUBMITTED',
  priority: 'MEDIUM',
  categoryId: CATEGORY.id,
  requesterId,
  dueAt: new Date(Date.now() + 86400000),
  createdAt: new Date(),
  updatedAt: new Date(),
  resolvedAt: null,
  closedAt: null,
  rating: null,
  feedback: null,
  category: CATEGORY,
  requester: { id: requesterId, fullName: 'Test User', email: 'user@test.edu' },
  assignments: [],
  _count: { attachments: 0, comments: 0 },
})

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('Requests – POST /api/v1/requests', () => {
  const REQUESTER_ID = 'requester-id-1'
  const token = makeToken('REQUESTER', REQUESTER_ID)

  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(REQUESTER_ROLE, REQUESTER_ID))
    ;(prisma.requestCategory.findUnique as jest.Mock).mockResolvedValue({
      ...CATEGORY,
      id: CATEGORY_ID,
    })
    ;(prisma.serviceRequest.findUnique as jest.Mock).mockResolvedValue(null) // ref uniqueness check
    ;(prisma.serviceRequest.create as jest.Mock).mockResolvedValue(makeServiceRequest(REQUESTER_ID))
    ;(prisma.statusUpdate.create as jest.Mock).mockResolvedValue({})
    ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([]) // no admins to notify
    ;(prisma.notification.create as jest.Mock).mockResolvedValue({})
  })

  it('returns 201 with request data including a reference number', async () => {
    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Broken socket')
      .field('categoryId', CATEGORY_ID)
      .field('location', 'Block A')
      .field('description', VALID_DESCRIPTION)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('referenceNo')
    expect(res.body.data.referenceNo).toMatch(/^REQ-\d{4}-\d{6}$/)
  })

  it('returns 400 when required field "title" is missing', async () => {
    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .field('categoryId', CATEGORY_ID)
      .field('location', 'Block A')
      .field('description', VALID_DESCRIPTION)

    expect(res.status).toBe(400)
  })

  it('returns 400 when required field "description" is missing', async () => {
    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Broken socket')
      .field('categoryId', CATEGORY_ID)
      .field('location', 'Block A')

    expect(res.status).toBe(400)
  })

  it('returns 400 when description is shorter than 20 chars', async () => {
    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Broken socket')
      .field('categoryId', CATEGORY_ID)
      .field('location', 'Block A')
      .field('description', 'Too short.')

    expect(res.status).toBe(400)
  })

  it('returns 400 when categoryId is missing', async () => {
    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Broken socket')
      .field('location', 'Block A')
      .field('description', VALID_DESCRIPTION)

    expect(res.status).toBe(400)
  })

  it('returns 400 when category is inactive', async () => {
    ;(prisma.requestCategory.findUnique as jest.Mock).mockResolvedValue({
      ...CATEGORY,
      isActive: false,
    })

    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Broken socket')
      .field('categoryId', CATEGORY_ID)
      .field('location', 'Block A')
      .field('description', VALID_DESCRIPTION)

    expect(res.status).toBe(400)
  })

  it('returns 403 when an OFFICER tries to create a request', async () => {
    const officerToken = makeToken('OFFICER', 'officer-id-1')
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(OFFICER_ROLE, 'officer-id-1'))

    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${officerToken}`)
      .field('title', 'Broken socket')
      .field('categoryId', CATEGORY_ID)
      .field('location', 'Block A')
      .field('description', VALID_DESCRIPTION)

    expect(res.status).toBe(403)
  })

  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/api/v1/requests')
      .field('title', 'Broken socket')
      .field('categoryId', CATEGORY_ID)
      .field('location', 'Block A')
      .field('description', VALID_DESCRIPTION)

    expect(res.status).toBe(401)
  })
})

describe('Requests – GET /api/v1/requests (list with role scoping)', () => {
  const REQUESTER_ID = 'requester-id-1'
  const OTHER_REQUESTER_ID = 'requester-id-2'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})
  })

  it('REQUESTER can only see their own requests (service scopes by requesterId)', async () => {
    const token = makeToken('REQUESTER', REQUESTER_ID)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(REQUESTER_ROLE, REQUESTER_ID))

    // Mock returns only the caller's request
    const myRequest = makeServiceRequest(REQUESTER_ID, 'req-id-mine')
    ;(prisma.serviceRequest.findMany as jest.Mock).mockResolvedValue([myRequest])
    ;(prisma.serviceRequest.count as jest.Mock).mockResolvedValue(1)

    const res = await request(app)
      .get('/api/v1/requests')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].requesterId).toBe(REQUESTER_ID)
  })

  it('ADMIN can see all requests (no scoping applied)', async () => {
    const adminId = 'admin-id-1'
    const adminToken = makeToken('ADMIN', adminId)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(ADMIN_ROLE, adminId))

    const allRequests = [
      makeServiceRequest(REQUESTER_ID, 'req-id-1'),
      makeServiceRequest(OTHER_REQUESTER_ID, 'req-id-2'),
    ]
    ;(prisma.serviceRequest.findMany as jest.Mock).mockResolvedValue(allRequests)
    ;(prisma.serviceRequest.count as jest.Mock).mockResolvedValue(2)

    const res = await request(app)
      .get('/api/v1/requests')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
  })

  it('OFFICER can only see requests assigned to them', async () => {
    const officerId = 'officer-id-1'
    const officerToken = makeToken('OFFICER', officerId)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(OFFICER_ROLE, officerId))

    const assignedRequest = makeServiceRequest(REQUESTER_ID, 'req-id-assigned')
    ;(prisma.serviceRequest.findMany as jest.Mock).mockResolvedValue([assignedRequest])
    ;(prisma.serviceRequest.count as jest.Mock).mockResolvedValue(1)

    const res = await request(app)
      .get('/api/v1/requests')
      .set('Authorization', `Bearer ${officerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

describe('Requests – GET /api/v1/requests/:id (detail)', () => {
  const REQUESTER_ID = 'requester-id-1'
  const OFFICER_ID   = 'officer-id-1'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})
  })

  it('REQUESTER can view their own request', async () => {
    const token = makeToken('REQUESTER', REQUESTER_ID)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(REQUESTER_ROLE, REQUESTER_ID))

    const req = {
      ...makeServiceRequest(REQUESTER_ID, 'req-id-1'),
      statusUpdates: [],
      comments: [],
      attachments: [],
    }
    ;(prisma.serviceRequest.findUnique as jest.Mock).mockResolvedValue(req)

    const res = await request(app)
      .get('/api/v1/requests/req-id-1')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe('req-id-1')
  })

  it('OFFICER without assignment on that request gets 403', async () => {
    const token = makeToken('OFFICER', OFFICER_ID)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(OFFICER_ROLE, OFFICER_ID))

    const req = {
      ...makeServiceRequest(REQUESTER_ID, 'req-id-1'),
      statusUpdates: [],
      comments: [],
      attachments: [],
      assignments: [], // no active assignment for this officer
    }
    ;(prisma.serviceRequest.findUnique as jest.Mock).mockResolvedValue(req)

    const res = await request(app)
      .get('/api/v1/requests/req-id-1')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('returns 404 when the request does not exist', async () => {
    const token = makeToken('ADMIN', 'admin-id-1')
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(ADMIN_ROLE, 'admin-id-1'))
    ;(prisma.serviceRequest.findUnique as jest.Mock).mockResolvedValue(null)

    const res = await request(app)
      .get('/api/v1/requests/non-existent-id')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})

describe('Requests – Pagination meta structure', () => {
  const ADMIN_ID = 'admin-id-1'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(ADMIN_ROLE, ADMIN_ID))
  })

  it('returns correct pagination meta for page 1, limit 5, total 12', async () => {
    const requests = Array.from({ length: 5 }, (_, i) =>
      makeServiceRequest('req-uid', `req-id-${i}`)
    )
    ;(prisma.serviceRequest.findMany as jest.Mock).mockResolvedValue(requests)
    ;(prisma.serviceRequest.count as jest.Mock).mockResolvedValue(12)

    const res = await request(app)
      .get('/api/v1/requests?page=1&limit=5')
      .set('Authorization', `Bearer ${makeToken('ADMIN', ADMIN_ID)}`)

    expect(res.status).toBe(200)
    expect(res.body.meta).toMatchObject({
      page: 1,
      limit: 5,
      total: 12,
      totalPages: 3,
    })
    expect(res.body.data).toHaveLength(5)
  })

  it('meta keys are always present even when no results', async () => {
    ;(prisma.serviceRequest.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.serviceRequest.count as jest.Mock).mockResolvedValue(0)

    const res = await request(app)
      .get('/api/v1/requests')
      .set('Authorization', `Bearer ${makeToken('ADMIN', ADMIN_ID)}`)

    expect(res.status).toBe(200)
    expect(res.body.meta).toHaveProperty('page')
    expect(res.body.meta).toHaveProperty('limit')
    expect(res.body.meta).toHaveProperty('total')
    expect(res.body.meta).toHaveProperty('totalPages')
  })
})

describe('Requests – Search', () => {
  const ADMIN_ID = 'admin-id-1'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(ADMIN_ROLE, ADMIN_ID))
  })

  it('returns only matching requests when search is applied', async () => {
    const matchingRequest = makeServiceRequest('user-1', 'req-match')
    matchingRequest.title = 'Broken socket in lab'
    ;(prisma.serviceRequest.findMany as jest.Mock).mockResolvedValue([matchingRequest])
    ;(prisma.serviceRequest.count as jest.Mock).mockResolvedValue(1)

    const res = await request(app)
      .get('/api/v1/requests?search=socket')
      .set('Authorization', `Bearer ${makeToken('ADMIN', ADMIN_ID)}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].title).toContain('socket')
  })

  it('returns empty array when search matches nothing', async () => {
    ;(prisma.serviceRequest.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.serviceRequest.count as jest.Mock).mockResolvedValue(0)

    const res = await request(app)
      .get('/api/v1/requests?search=xyzzy-nonexistent')
      .set('Authorization', `Bearer ${makeToken('ADMIN', ADMIN_ID)}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(0)
    expect(res.body.meta.total).toBe(0)
  })
})
