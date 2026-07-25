import { z } from 'zod'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

export const createUserSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  matricOrStaffId: z.string().min(6).max(20).regex(/^[a-zA-Z0-9]+$/),
  phone: z.string().optional(),
  department: z.string().optional(),
  password: z.string().regex(passwordRegex),
  role: z.enum(['REQUESTER', 'OFFICER', 'ADMIN']),
  specialization: z.enum(['ELECTRICAL', 'PLUMBING', 'CARPENTRY', 'IT', 'GENERAL']).optional(),
})

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  specialization: z.enum(['ELECTRICAL', 'PLUMBING', 'CARPENTRY', 'IT', 'GENERAL']).optional(),
})

export const changeRoleSchema = z.object({
  role: z.enum(['REQUESTER', 'OFFICER', 'ADMIN']),
  specialization: z.enum(['ELECTRICAL', 'PLUMBING', 'CARPENTRY', 'IT', 'GENERAL']).optional(),
})

export const listUsersSchema = z.object({
  role: z.string().optional(),
  search: z.string().optional(),
  isActive: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('10'),
})
