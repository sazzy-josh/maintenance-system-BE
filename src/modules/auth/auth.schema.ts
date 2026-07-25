import { z } from 'zod'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

export const registerSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  matricOrStaffId: z.string().min(6).max(20).regex(/^[a-zA-Z0-9]+$/, 'Alphanumeric only'),
  phone: z.string().optional(),
  department: z.string().optional(),
  password: z.string().regex(passwordRegex, 'Password must be at least 8 chars with uppercase, lowercase, digit, and symbol'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  password: z.string().regex(passwordRegex, 'Password must be at least 8 chars with uppercase, lowercase, digit, and symbol'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().regex(passwordRegex, 'Password must be at least 8 chars with uppercase, lowercase, digit, and symbol'),
})
