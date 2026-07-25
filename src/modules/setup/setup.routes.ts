import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../../config/db'

const router = Router()

/**
 * POST /api/v1/setup/admin
 * Creates the first admin user. Returns 409 if any admin already exists.
 * This endpoint is intentionally unauthenticated but self-disabling.
 */
router.post('/admin', async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body

  if (!email || !password || !fullName) {
    return res.status(400).json({ success: false, message: 'email, password and fullName are required', code: 'VALIDATION_ERROR' })
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
  if (!adminRole) {
    return res.status(500).json({ success: false, message: 'Roles not seeded yet', code: 'SETUP_ERROR' })
  }

  const existingAdmin = await prisma.user.findFirst({ where: { roleId: adminRole.id } })
  if (existingAdmin) {
    return res.status(409).json({ success: false, message: 'Admin user already exists', code: 'ALREADY_EXISTS' })
  }

  const hash = await bcrypt.hash(password, 12)
  const admin = await prisma.user.create({
    data: {
      email,
      fullName,
      matricOrStaffId: 'ADMIN001',
      passwordHash: hash,
      roleId: adminRole.id,
      isActive: true,
    },
  })

  return res.status(201).json({
    success: true,
    message: 'Admin user created',
    data: { id: admin.id, email: admin.email, fullName: admin.fullName, role: 'ADMIN' },
  })
})

export default router
