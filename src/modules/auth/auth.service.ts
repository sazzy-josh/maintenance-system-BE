import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../../config/db'
import { AppError } from '../../utils/AppError'
import { sendMail } from '../../config/mailer'
import { JwtPayload } from '../../middleware/authenticate'

const BCRYPT_ROUNDS = 12

export const generateTokens = async (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign(
    { sub: userId, email, role } as JwtPayload,
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'] }
  )
  const refreshToken = jwt.sign(
    { sub: userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
  )
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10)
  await prisma.user.update({ where: { id: userId }, data: { refreshTokenHash } })
  return { accessToken, refreshToken }
}

export const registerUser = async (data: {
  fullName: string
  email: string
  matricOrStaffId: string
  phone?: string
  department?: string
  password: string
}) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { matricOrStaffId: data.matricOrStaffId }] },
  })
  if (existing) {
    if (existing.email === data.email) throw new AppError(409, 'Email already registered', 'DUPLICATE_ENTRY')
    throw new AppError(409, 'Matric/Staff ID already registered', 'DUPLICATE_ENTRY')
  }

  const requesterRole = await prisma.role.findUnique({ where: { name: 'REQUESTER' } })
  if (!requesterRole) throw new AppError(500, 'Role not configured', 'SETUP_ERROR')

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS)
  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      matricOrStaffId: data.matricOrStaffId,
      phone: data.phone,
      department: data.department,
      passwordHash,
      roleId: requesterRole.id,
    },
    include: { role: true },
  })

  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role.name }
}

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  })
  if (!user) throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')
  if (!user.isActive) throw new AppError(403, 'Account is deactivated', 'INACTIVE_ACCOUNT')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

  const tokens = await generateTokens(user.id, user.email, user.role.name)
  return {
    tokens,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      department: user.department,
      phone: user.phone,
      specialization: user.specialization,
    },
  }
}

export const refreshAccessToken = async (refreshToken: string) => {
  let payload: { sub: string }
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { sub: string }
  } catch {
    throw new AppError(401, 'Invalid refresh token', 'INVALID_TOKEN')
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { role: true },
  })
  if (!user || !user.refreshTokenHash || !user.isActive) {
    throw new AppError(401, 'Invalid refresh token', 'INVALID_TOKEN')
  }

  const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash)
  if (!valid) throw new AppError(401, 'Invalid refresh token', 'INVALID_TOKEN')

  return generateTokens(user.id, user.email, user.role.name)
}

export const logoutUser = async (userId: string) => {
  await prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } })
}

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  })
  if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND')
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    matricOrStaffId: user.matricOrStaffId,
    phone: user.phone,
    department: user.department,
    role: user.role.name,
    specialization: user.specialization,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  }
}

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return // silently return to prevent user enumeration

  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expires = new Date(Date.now() + 30 * 60 * 1000)

  // Store token hash in refreshTokenHash field temporarily (reuse)
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: `reset:${tokenHash}:${expires.getTime()}` },
  })

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`
  await sendMail(
    email,
    'Password Reset Request – MIVA FixIt',
    `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Reset Your Password</h2>
      <p>You requested a password reset. Click the link below to set a new password.</p>
      <p><a href="${resetUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
      <p>This link expires in 30 minutes. If you did not request a reset, ignore this email.</p>
    </div>
    `
  )
}

export const resetPassword = async (token: string, newPassword: string) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const users = await prisma.user.findMany({
    where: { refreshTokenHash: { startsWith: 'reset:' } },
  })

  const user = users.find((u) => {
    if (!u.refreshTokenHash) return false
    const parts = u.refreshTokenHash.split(':')
    if (parts.length !== 3 || parts[0] !== 'reset') return false
    if (parts[1] !== tokenHash) return false
    return Date.now() < Number(parts[2])
  })

  if (!user) throw new AppError(400, 'Invalid or expired reset token', 'INVALID_TOKEN')

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, refreshTokenHash: null },
  })
}

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND')

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) throw new AppError(400, 'Current password is incorrect', 'INVALID_CREDENTIALS')

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash, refreshTokenHash: null } })
}
