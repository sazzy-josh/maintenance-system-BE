import bcrypt from 'bcryptjs'
import { prisma } from '../../config/db'
import { AppError } from '../../utils/AppError'
import { getPagination, getMeta } from '../../utils/pagination'

export const listUsers = async (query: {
  role?: string
  search?: string
  isActive?: string
  page?: string
  limit?: string
}) => {
  const { skip, take } = getPagination(Number(query.page), Number(query.limit))

  const where: Record<string, unknown> = {}
  if (query.role) {
    const role = await prisma.role.findUnique({ where: { name: query.role as any } })
    if (role) where.roleId = role.id
  }
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true'
  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { matricOrStaffId: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ])

  const data = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    matricOrStaffId: u.matricOrStaffId,
    phone: u.phone,
    department: u.department,
    role: u.role.name,
    specialization: u.specialization,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  }))

  return { data, meta: getMeta(total, Number(query.page), Number(query.limit)) }
}

export const getOfficers = async () => {
  const officerRole = await prisma.role.findUnique({ where: { name: 'OFFICER' } })
  if (!officerRole) return []

  const officers = await prisma.user.findMany({
    where: { roleId: officerRole.id, isActive: true },
    include: {
      assignmentsAsOfficer: {
        where: { status: 'ACTIVE' },
        select: { id: true },
      },
    },
  })

  return officers.map((o) => ({
    id: o.id,
    fullName: o.fullName,
    email: o.email,
    specialization: o.specialization,
    activeJobCount: o.assignmentsAsOfficer.length,
  }))
}

export const getUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  })
  if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND')
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
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

export const createUser = async (data: {
  fullName: string
  email: string
  matricOrStaffId: string
  phone?: string
  department?: string
  password: string
  role: string
  specialization?: string
}) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { matricOrStaffId: data.matricOrStaffId }] },
  })
  if (existing) throw new AppError(409, 'Email or Matric/Staff ID already exists', 'DUPLICATE_ENTRY')

  const role = await prisma.role.findUnique({ where: { name: data.role as any } })
  if (!role) throw new AppError(400, 'Invalid role', 'INVALID_ROLE')

  const passwordHash = await bcrypt.hash(data.password, 12)
  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      matricOrStaffId: data.matricOrStaffId,
      phone: data.phone,
      department: data.department,
      passwordHash,
      roleId: role.id,
      specialization: data.specialization,
    },
    include: { role: true },
  })
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role.name,
    specialization: user.specialization,
  }
}

export const updateUser = async (id: string, data: {
  fullName?: string
  phone?: string
  department?: string
  specialization?: string
}) => {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND')

  const updated = await prisma.user.update({
    where: { id },
    data,
    include: { role: true },
  })
  return { id: updated.id, fullName: updated.fullName, role: updated.role.name }
}

export const changeRole = async (id: string, roleName: string, specialization?: string) => {
  const role = await prisma.role.findUnique({ where: { name: roleName as any } })
  if (!role) throw new AppError(400, 'Invalid role', 'INVALID_ROLE')

  await prisma.user.update({
    where: { id },
    data: { roleId: role.id, specialization: specialization ?? null },
  })
}

export const changeStatus = async (id: string, requestingUserId: string, isActive: boolean) => {
  if (id === requestingUserId) throw new AppError(400, 'Cannot deactivate your own account', 'SELF_DEACTIVATION')
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND')
  await prisma.user.update({ where: { id }, data: { isActive } })
}
