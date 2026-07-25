import { prisma } from '../../config/db'

export const getSummary = async (query: { dateFrom?: string; dateTo?: string }) => {
  const dateFilter = {
    ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
    ...(query.dateTo && { lte: new Date(query.dateTo) }),
  }
  const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}

  const [total, open, completed, overdue, closedWithTime] = await Promise.all([
    prisma.serviceRequest.count({ where }),
    prisma.serviceRequest.count({
      where: { ...where, status: { notIn: ['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'] } },
    }),
    prisma.serviceRequest.count({ where: { ...where, status: { in: ['COMPLETED', 'CLOSED'] } } }),
    prisma.serviceRequest.count({
      where: {
        ...where,
        dueAt: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'] },
      },
    }),
    prisma.serviceRequest.findMany({
      where: { ...where, resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    }),
  ])

  const avgResolutionHours =
    closedWithTime.length > 0
      ? closedWithTime.reduce((acc, r) => {
          const diff = (r.resolvedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60)
          return acc + diff
        }, 0) / closedWithTime.length
      : 0

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return { total, open, completed, overdue, completionRate, avgResolutionHours: Math.round(avgResolutionHours * 10) / 10 }
}

export const getByCategory = async () => {
  const categories = await prisma.requestCategory.findMany({ include: { requests: { select: { resolvedAt: true, createdAt: true } } } })
  return categories.map((c) => {
    const resolved = c.requests.filter((r) => r.resolvedAt)
    const avgHours = resolved.length > 0
      ? resolved.reduce((acc, r) => acc + (r.resolvedAt!.getTime() - r.createdAt.getTime()) / 3600000, 0) / resolved.length
      : 0
    return {
      category: c.name,
      total: c.requests.length,
      avgResolutionHours: Math.round(avgHours * 10) / 10,
    }
  })
}

export const getByOfficer = async () => {
  const officers = await prisma.user.findMany({
    where: { role: { name: 'OFFICER' }, isActive: true },
    include: {
      assignmentsAsOfficer: {
        include: {
          request: { select: { status: true, resolvedAt: true, createdAt: true } },
        },
      },
    },
  })

  return officers.map((o) => {
    const total = o.assignmentsAsOfficer.length
    const completed = o.assignmentsAsOfficer.filter((a) => a.request.status === 'COMPLETED' || a.request.status === 'CLOSED').length
    const active = o.assignmentsAsOfficer.filter((a) => a.status === 'ACTIVE').length
    return {
      id: o.id,
      name: o.fullName,
      specialization: o.specialization,
      totalAssigned: total,
      completed,
      active,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  })
}

export const getMonthlyTrend = async () => {
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const count = await prisma.serviceRequest.count({ where: { createdAt: { gte: start, lte: end } } })
    months.push({
      month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
      count,
    })
  }
  return months
}
