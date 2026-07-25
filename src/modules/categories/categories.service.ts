import { prisma } from '../../config/db'
import { AppError } from '../../utils/AppError'

export const listCategories = async (includeInactive = false) => {
  return prisma.requestCategory.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
  })
}

export const createCategory = async (data: {
  name: string
  description: string
  slaHours?: number
}) => {
  return prisma.requestCategory.create({ data })
}

export const updateCategory = async (id: string, data: {
  name?: string
  description?: string
  slaHours?: number
  isActive?: boolean
}) => {
  const category = await prisma.requestCategory.findUnique({ where: { id } })
  if (!category) throw new AppError(404, 'Category not found', 'NOT_FOUND')
  return prisma.requestCategory.update({ where: { id }, data })
}

export const deleteCategory = async (id: string) => {
  const category = await prisma.requestCategory.findUnique({
    where: { id },
    include: { requests: { take: 1 } },
  })
  if (!category) throw new AppError(404, 'Category not found', 'NOT_FOUND')
  if (category.requests.length > 0) {
    await prisma.requestCategory.update({ where: { id }, data: { isActive: false } })
    return { deactivated: true }
  }
  await prisma.requestCategory.delete({ where: { id } })
  return { deleted: true }
}
