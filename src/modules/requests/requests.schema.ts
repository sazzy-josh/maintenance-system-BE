import { z } from 'zod'

export const createRequestSchema = z.object({
  title: z.string().min(3).max(200),
  categoryId: z.string().uuid(),
  location: z.string().min(2).max(200),
  roomNumber: z.string().optional(),
  description: z.string().min(20).max(5000),
})

export const updateRequestSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  categoryId: z.string().uuid().optional(),
  location: z.string().min(2).max(200).optional(),
  roomNumber: z.string().optional(),
  description: z.string().min(20).max(5000).optional(),
})

export const statusUpdateSchema = z.object({
  status: z.enum(['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'REJECTED', 'CANCELLED']),
  note: z.string().optional(),
})

export const setPrioritySchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
})

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(1000).optional(),
})

export const listRequestsSchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  officerId: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.string().default('1'),
  limit: z.string().default('10'),
})
