import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as authController from './auth.controller'
import { validate } from '../../middleware/validate'
import { authenticate } from '../../middleware/authenticate'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.schema'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 100,
  message: { success: false, message: 'Too many attempts, please try again in 15 minutes', code: 'RATE_LIMITED' },
  skip: () => process.env.NODE_ENV === 'development',
})

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new requester account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, matricOrStaffId, password, confirmPassword]
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string, format: email }
 *               matricOrStaffId: { type: string }
 *               phone: { type: string }
 *               department: { type: string }
 *               password: { type: string }
 *               confirmPassword: { type: string }
 *     responses:
 *       201: { description: Registration successful }
 *       400: { description: Validation error }
 *       409: { description: Email or ID already exists }
 */
router.post('/register', authLimiter, validate(registerSchema), authController.register)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive tokens
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful with access token }
 *       401: { description: Invalid credentials }
 */
router.post('/login', authLimiter, validate(loginSchema), authController.login)

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rotate refresh token and get new access token
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200: { description: New access token issued }
 */
router.post('/refresh', authController.refresh)

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and invalidate refresh token
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', authenticate, authController.logout)

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     responses:
 *       200: { description: Current user data }
 *       401: { description: Unauthenticated }
 */
router.get('/me', authenticate, authController.me)

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Reset email sent if registered }
 */
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword)

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password using token from email
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, confirmPassword]
 *             properties:
 *               password: { type: string }
 *               confirmPassword: { type: string }
 *     responses:
 *       200: { description: Password reset successful }
 *       400: { description: Invalid or expired token }
 */
router.post('/reset-password/:token', validate(resetPasswordSchema), authController.resetPassword)

/**
 * @swagger
 * /auth/change-password:
 *   patch:
 *     summary: Change own password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Password changed }
 */
router.patch('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword)

export default router
