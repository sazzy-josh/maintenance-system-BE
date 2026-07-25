import { Request, Response } from 'express'
import * as authService from './auth.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { success, created } from '../../utils/response'
import { auditLog } from '../../middleware/auditLogger'

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.registerUser(req.body)
  await auditLog(user.id, 'USER_REGISTERED', 'User', user.id, { email: user.email }, req)
  return created(res, user, 'Registration successful')
})

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { tokens, user } = await authService.loginUser(req.body.email, req.body.password)
  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS)
  await auditLog(user.id, 'LOGIN_SUCCESS', 'User', user.id, {}, req)
  return success(res, { accessToken: tokens.accessToken, user }, 'Login successful')
})

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'No refresh token', code: 'UNAUTHENTICATED' })
  }
  const tokens = await authService.refreshAccessToken(refreshToken)
  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS)
  return success(res, { accessToken: tokens.accessToken }, 'Token refreshed')
})

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await authService.logoutUser(req.user.id)
    await auditLog(req.user.id, 'LOGOUT', 'User', req.user.id, {}, req)
  }
  res.clearCookie('refreshToken')
  return success(res, null, 'Logged out successfully')
})

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id)
  return success(res, user)
})

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email)
  return success(res, null, 'If that email is registered, a reset link has been sent')
})

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.params.token, req.body.password)
  return success(res, null, 'Password reset successfully')
})

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword)
  return success(res, null, 'Password changed successfully')
})
