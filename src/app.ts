import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { requestId } from './middleware/requestId'
import { errorHandler } from './middleware/errorHandler'
import { swaggerSpec } from './config/swagger'

import authRoutes from './modules/auth/auth.routes'
import userRoutes from './modules/users/users.routes'
import requestRoutes from './modules/requests/requests.routes'
import commentRoutes from './modules/comments/comments.routes'
import categoryRoutes from './modules/categories/categories.routes'
import assignmentRoutes from './modules/assignments/assignments.routes'
import notificationRoutes from './modules/notifications/notifications.routes'
import reportRoutes from './modules/reports/reports.routes'
import auditRoutes from './modules/audit/audit.routes'

const app = express()

app.set('trust proxy', 1)

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server / curl (no Origin header)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true)
    callback(new Error(`CORS: origin '${origin}' not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}))

app.use(requestId)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: Number(process.env.RATE_LIMIT_MAX || 100),
  message: { success: false, message: 'Too many requests', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
})
app.use('/api', globalLimiter)

// Health check
app.get('/api/v1/health', async (_req, res) => {
  let dbConnected = false
  try {
    const { prisma } = await import('./config/db')
    await prisma.$queryRaw`SELECT 1`
    dbConnected = true
  } catch {}
  res.json({ status: 'ok', uptime: process.uptime(), dbConnected, timestamp: new Date().toISOString() })
})

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'MIVA FixIt API Docs',
  swaggerOptions: { persistAuthorization: true },
}))

// Routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/requests/:id/comments', commentRoutes)
app.use('/api/v1/requests', requestRoutes)
app.use('/api/v1/categories', categoryRoutes)
app.use('/api/v1/assignments', assignmentRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/reports', reportRoutes)
app.use('/api/v1/audit', auditRoutes)

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', code: 'NOT_FOUND' })
})

app.use(errorHandler)

export default app
