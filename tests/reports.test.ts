/**
 * reports.test.ts
 *
 * Tests for /api/v1/reports endpoints. All Prisma calls are mocked.
 * Only ADMIN may access these routes; non-admin roles get 403.
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
      findMany: jest.fn(),
    },
    role: { findUnique: jest.fn() },
    auditLog: { create: jest.fn() },
    serviceRequest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    requestCategory: {
      findMany: jest.fn(),
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

// ── Helpers ────────────────────────────────────────────────────────────────────

const makeToken = (role: string, userId = 'user-abc') =>
  jwt.sign(
    { sub: userId, email: 'user@test.edu', role },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  )

const ADMIN_ROLE     = { id: 'role-admin',     name: 'ADMIN' }
const OFFICER_ROLE   = { id: 'role-officer',   name: 'OFFICER' }
const REQUESTER_ROLE = { id: 'role-requester', name: 'REQUESTER' }

const ADMIN_ID     = 'admin-user-id'
const OFFICER_ID   = 'officer-user-id'
const REQUESTER_ID = 'requester-user-id'

const makeUser = (role: { id: string; name: string }, id: string) => ({
  id,
  email: `${id}@test.edu`,
  fullName: 'Test User',
  isActive: true,
  roleId: role.id,
  role,
})

// Fixture for a minimal service request (used in CSV/PDF export mocks)
const makeRequest = (id: string) => ({
  id,
  referenceNo: `REQ-2024-${id}`,
  title: 'Test request',
  status: 'COMPLETED',
  priority: 'MEDIUM',
  location: 'Block A',
  createdAt: new Date('2024-01-15T10:00:00Z'),
  dueAt: new Date('2024-01-16T10:00:00Z'),
  resolvedAt: new Date('2024-01-15T20:00:00Z'),
  category: { name: 'Electrical' },
  requester: { fullName: 'Alice', email: 'alice@test.edu' },
  assignments: [],
})

// ── GET /api/v1/reports/summary ────────────────────────────────────────────────

describe('Reports – GET /api/v1/reports/summary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})
  })

  it('returns 200 with all expected keys for ADMIN', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(ADMIN_ROLE, ADMIN_ID))

    // getSummary calls count x4 and findMany x1
    ;(prisma.serviceRequest.count as jest.Mock)
      .mockResolvedValueOnce(50)  // total
      .mockResolvedValueOnce(20)  // open
      .mockResolvedValueOnce(10)  // completed
      .mockResolvedValueOnce(5)   // overdue

    ;(prisma.serviceRequest.findMany as jest.Mock).mockResolvedValue([
      { createdAt: new Date('2024-01-01'), resolvedAt: new Date('2024-01-02') },
      { createdAt: new Date('2024-01-03'), resolvedAt: new Date('2024-01-04') },
    ])

    const res = await request(app)
      .get('/api/v1/reports/summary')
      .set('Authorization', `Bearer ${makeToken('ADMIN', ADMIN_ID)}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    const data = res.body.data
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('open')
    expect(data).toHaveProperty('completed')
    expect(data).toHaveProperty('overdue')
    expect(data).toHaveProperty('completionRate')
    expect(data).toHaveProperty('avgResolutionHours')

    expect(data.total).toBe(50)
    expect(data.open).toBe(20)
    expect(data.completed).toBe(10)
    expect(data.overdue).toBe(5)
    expect(data.completionRate).toBe(20) // 10/50 * 100
  })

  it('returns 403 for OFFICER role', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(OFFICER_ROLE, OFFICER_ID))

    const res = await request(app)
      .get('/api/v1/reports/summary')
      .set('Authorization', `Bearer ${makeToken('OFFICER', OFFICER_ID)}`)

    expect(res.status).toBe(403)
    expect(res.body.code).toBe('FORBIDDEN')
  })

  it('returns 403 for REQUESTER role', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(REQUESTER_ROLE, REQUESTER_ID))

    const res = await request(app)
      .get('/api/v1/reports/summary')
      .set('Authorization', `Bearer ${makeToken('REQUESTER', REQUESTER_ID)}`)

    expect(res.status).toBe(403)
  })

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/v1/reports/summary')
    expect(res.status).toBe(401)
  })

  it('summary completionRate is 0 when total is 0', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(ADMIN_ROLE, ADMIN_ID))

    ;(prisma.serviceRequest.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.serviceRequest.findMany as jest.Mock).mockResolvedValue([])

    const res = await request(app)
      .get('/api/v1/reports/summary')
      .set('Authorization', `Bearer ${makeToken('ADMIN', ADMIN_ID)}`)

    expect(res.status).toBe(200)
    expect(res.body.data.completionRate).toBe(0)
    expect(res.body.data.avgResolutionHours).toBe(0)
  })
})

// ── GET /api/v1/reports/export/csv ────────────────────────────────────────────

describe('Reports – GET /api/v1/reports/export/csv', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})
  })

  it('returns 200 with Content-Type text/csv for ADMIN', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(ADMIN_ROLE, ADMIN_ID))
    ;(prisma.serviceRequest.findMany as jest.Mock).mockResolvedValue([
      makeRequest('001'),
      makeRequest('002'),
    ])

    const res = await request(app)
      .get('/api/v1/reports/export/csv')
      .set('Authorization', `Bearer ${makeToken('ADMIN', ADMIN_ID)}`)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/csv/)
    expect(res.headers['content-disposition']).toMatch(/attachment/)
  })

  it('CSV body contains the header row', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(ADMIN_ROLE, ADMIN_ID))
    ;(prisma.serviceRequest.findMany as jest.Mock).mockResolvedValue([makeRequest('001')])

    const res = await request(app)
      .get('/api/v1/reports/export/csv')
      .set('Authorization', `Bearer ${makeToken('ADMIN', ADMIN_ID)}`)

    expect(res.text).toContain('Reference')
    expect(res.text).toContain('Status')
    expect(res.text).toContain('Category')
  })

  it('CSV contains data rows matching mock requests', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(ADMIN_ROLE, ADMIN_ID))
    ;(prisma.serviceRequest.findMany as jest.Mock).mockResolvedValue([makeRequest('001')])

    const res = await request(app)
      .get('/api/v1/reports/export/csv')
      .set('Authorization', `Bearer ${makeToken('ADMIN', ADMIN_ID)}`)

    expect(res.text).toContain('REQ-2024-001')
    expect(res.text).toContain('COMPLETED')
    expect(res.text).toContain('Electrical')
  })

  it('returns empty CSV (header only) when no requests exist', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(ADMIN_ROLE, ADMIN_ID))
    ;(prisma.serviceRequest.findMany as jest.Mock).mockResolvedValue([])

    const res = await request(app)
      .get('/api/v1/reports/export/csv')
      .set('Authorization', `Bearer ${makeToken('ADMIN', ADMIN_ID)}`)

    expect(res.status).toBe(200)
    // Only the header row should be present
    const lines = res.text.trim().split('\n')
    expect(lines).toHaveLength(1)
  })

  it('returns 403 for OFFICER', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(OFFICER_ROLE, OFFICER_ID))

    const res = await request(app)
      .get('/api/v1/reports/export/csv')
      .set('Authorization', `Bearer ${makeToken('OFFICER', OFFICER_ID)}`)

    expect(res.status).toBe(403)
  })

  it('returns 403 for REQUESTER', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(REQUESTER_ROLE, REQUESTER_ID))

    const res = await request(app)
      .get('/api/v1/reports/export/csv')
      .set('Authorization', `Bearer ${makeToken('REQUESTER', REQUESTER_ID)}`)

    expect(res.status).toBe(403)
  })
})

// ── GET /api/v1/reports/export/pdf ────────────────────────────────────────────

describe('Reports – GET /api/v1/reports/export/pdf', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})
  })

  it('returns 200 with Content-Type application/pdf for ADMIN', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(ADMIN_ROLE, ADMIN_ID))
    ;(prisma.serviceRequest.findMany as jest.Mock).mockResolvedValue([
      makeRequest('001'),
      makeRequest('002'),
    ])

    const res = await request(app)
      .get('/api/v1/reports/export/pdf')
      .set('Authorization', `Bearer ${makeToken('ADMIN', ADMIN_ID)}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => callback(null, Buffer.concat(chunks)))
      })

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/application\/pdf/)
    expect(res.headers['content-disposition']).toMatch(/attachment/)
  })

  it('PDF response body starts with the PDF magic bytes (%PDF)', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(ADMIN_ROLE, ADMIN_ID))
    ;(prisma.serviceRequest.findMany as jest.Mock).mockResolvedValue([makeRequest('001')])

    const res = await request(app)
      .get('/api/v1/reports/export/pdf')
      .set('Authorization', `Bearer ${makeToken('ADMIN', ADMIN_ID)}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => callback(null, Buffer.concat(chunks)))
      })

    // PDFkit output begins with %PDF
    const body = res.body as Buffer
    expect(body.slice(0, 4).toString()).toBe('%PDF')
  })

  it('returns 403 for OFFICER', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(OFFICER_ROLE, OFFICER_ID))

    const res = await request(app)
      .get('/api/v1/reports/export/pdf')
      .set('Authorization', `Bearer ${makeToken('OFFICER', OFFICER_ID)}`)

    expect(res.status).toBe(403)
  })

  it('returns 403 for REQUESTER', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(REQUESTER_ROLE, REQUESTER_ID))

    const res = await request(app)
      .get('/api/v1/reports/export/pdf')
      .set('Authorization', `Bearer ${makeToken('REQUESTER', REQUESTER_ID)}`)

    expect(res.status).toBe(403)
  })

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/v1/reports/export/pdf')
    expect(res.status).toBe(401)
  })
})

// ── GET /api/v1/reports/by-category ───────────────────────────────────────────

describe('Reports – GET /api/v1/reports/by-category', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})
  })

  it('returns 200 with an array of category stats for ADMIN', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(ADMIN_ROLE, ADMIN_ID))
    ;(prisma.requestCategory.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Electrical',
        requests: [
          { createdAt: new Date('2024-01-01'), resolvedAt: new Date('2024-01-02') },
          { createdAt: new Date('2024-01-05'), resolvedAt: null },
        ],
      },
      {
        id: 'cat-2',
        name: 'Plumbing',
        requests: [],
      },
    ])

    const res = await request(app)
      .get('/api/v1/reports/by-category')
      .set('Authorization', `Bearer ${makeToken('ADMIN', ADMIN_ID)}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data[0]).toHaveProperty('category')
    expect(res.body.data[0]).toHaveProperty('total')
    expect(res.body.data[0]).toHaveProperty('avgResolutionHours')
  })

  it('returns 403 for REQUESTER', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(REQUESTER_ROLE, REQUESTER_ID))

    const res = await request(app)
      .get('/api/v1/reports/by-category')
      .set('Authorization', `Bearer ${makeToken('REQUESTER', REQUESTER_ID)}`)

    expect(res.status).toBe(403)
  })
})

// ── GET /api/v1/reports/monthly-trend ─────────────────────────────────────────

describe('Reports – GET /api/v1/reports/monthly-trend', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})
  })

  it('returns 200 with 12 data points for ADMIN', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser(ADMIN_ROLE, ADMIN_ID))
    // getMonthlyTrend calls count 12 times
    ;(prisma.serviceRequest.count as jest.Mock).mockResolvedValue(3)

    const res = await request(app)
      .get('/api/v1/reports/monthly-trend')
      .set('Authorization', `Bearer ${makeToken('ADMIN', ADMIN_ID)}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(12)
    expect(res.body.data[0]).toHaveProperty('month')
    expect(res.body.data[0]).toHaveProperty('count')
  })
})
