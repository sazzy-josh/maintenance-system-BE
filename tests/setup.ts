import { prisma } from '../src/config/db'

// Tests use TEST_DATABASE_URL env variable when available.
// When mocking Prisma (the default in this suite), no real DB connection is made.

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-minimum-32-chars-ok!!'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32chars'
  process.env.JWT_EXPIRES_IN = '15m'
  process.env.JWT_REFRESH_EXPIRES_IN = '7d'
  process.env.NODE_ENV = 'test'
})

afterAll(async () => {
  await prisma.$disconnect()
})

/** Generate a short unique string suffix for test data isolation. */
export const uid = () => Math.random().toString(36).slice(2, 10)
