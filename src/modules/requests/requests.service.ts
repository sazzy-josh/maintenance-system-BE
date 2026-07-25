import { prisma } from '../../config/db'
import { AppError } from '../../utils/AppError'
import { generateReference } from '../../utils/generateReference'
import { getPagination, getMeta } from '../../utils/pagination'
import { cloudinary } from '../../config/cloudinary'
import streamifier from 'streamifier'
import { emitToRequest, emitToRole, emitToUser } from '../../sockets/socket'
import { auditLog } from '../../middleware/auditLogger'
import { Request as ExpressRequest } from 'express'
import { sendMail, emailTemplates } from '../../config/mailer'

type RequestStatus = 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CLOSED' | 'REJECTED' | 'CANCELLED'

const TERMINAL_STATES: RequestStatus[] = ['CLOSED', 'REJECTED', 'CANCELLED']

export const canTransition = (from: RequestStatus, to: RequestStatus, role: string, isOwner: boolean): boolean => {
  if (TERMINAL_STATES.includes(from)) return false
  if (from === 'SUBMITTED') {
    if (role === 'ADMIN' && ['ASSIGNED', 'REJECTED'].includes(to)) return true
    if ((isOwner || role === 'ADMIN') && to === 'CANCELLED') return true
    return false
  }
  if (from === 'ASSIGNED') {
    if (role === 'ADMIN' && to === 'ASSIGNED') return true
    if (['OFFICER', 'ADMIN'].includes(role) && to === 'IN_PROGRESS') return true
    return false
  }
  if (from === 'IN_PROGRESS') {
    if (['OFFICER', 'ADMIN'].includes(role) && ['ON_HOLD', 'COMPLETED'].includes(to)) return true
    return false
  }
  if (from === 'ON_HOLD') {
    if (['OFFICER', 'ADMIN'].includes(role) && to === 'IN_PROGRESS') return true
    return false
  }
  if (from === 'COMPLETED') {
    if ((isOwner || role === 'ADMIN') && to === 'CLOSED') return true
    if (role === 'ADMIN' && to === 'IN_PROGRESS') return true
    return false
  }
  return false
}

const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'))
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    )
    streamifier.createReadStream(buffer).pipe(stream)
  })
}

export const createRequest = async (
  requesterId: string,
  data: {
    title: string
    categoryId: string
    location: string
    roomNumber?: string
    description: string
  },
  files: Express.Multer.File[],
  req: ExpressRequest
) => {
  const category = await prisma.requestCategory.findUnique({ where: { id: data.categoryId } })
  if (!category || !category.isActive) throw new AppError(400, 'Invalid or inactive category', 'INVALID_CATEGORY')

  let referenceNo = generateReference()
  let attempts = 0
  while (attempts < 5) {
    const exists = await prisma.serviceRequest.findUnique({ where: { referenceNo } })
    if (!exists) break
    referenceNo = generateReference()
    attempts++
  }

  const dueAt = new Date(Date.now() + category.slaHours * 60 * 60 * 1000)

  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      referenceNo,
      title: data.title,
      categoryId: data.categoryId,
      location: data.location,
      roomNumber: data.roomNumber,
      description: data.description,
      requesterId,
      dueAt,
    },
    include: { category: true, requester: true },
  })

  // Upload images
  for (const file of files) {
    try {
      const { url, publicId } = await uploadToCloudinary(file.buffer, `fixit/evidence`)
      await prisma.attachment.create({
        data: {
          requestId: serviceRequest.id,
          url,
          publicId,
          fileName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          kind: 'EVIDENCE',
          uploadedById: requesterId,
        },
      })
    } catch (err) {
      console.error('Image upload failed:', err)
    }
  }

  await prisma.statusUpdate.create({
    data: {
      requestId: serviceRequest.id,
      toStatus: 'SUBMITTED',
      note: 'Request submitted',
      actorId: requesterId,
    },
  })

  await auditLog(requesterId, 'REQUEST_CREATED', 'ServiceRequest', serviceRequest.id, { referenceNo }, req)

  // Notify admins
  const admins = await prisma.user.findMany({
    where: { role: { name: 'ADMIN' }, isActive: true },
  })
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'New maintenance request',
        body: `${serviceRequest.referenceNo}: ${serviceRequest.title}`,
        link: `/admin/requests/${serviceRequest.id}`,
      },
    })
    emitToUser(admin.id, 'notification:new', { title: 'New maintenance request', body: serviceRequest.referenceNo })
  }

  emitToRole('ADMIN', 'request:created', { id: serviceRequest.id, referenceNo })

  try {
    await sendMail(
      serviceRequest.requester.email,
      `Request Submitted – ${referenceNo}`,
      emailTemplates.requestSubmitted(referenceNo, serviceRequest.title)
    )
  } catch {}

  return serviceRequest
}

export const listRequests = async (
  userId: string,
  role: string,
  query: {
    status?: string
    category?: string
    priority?: string
    officerId?: string
    search?: string
    dateFrom?: string
    dateTo?: string
    sortBy?: string
    order?: string
    page?: string
    limit?: string
  }
) => {
  const { skip, take } = getPagination(Number(query.page || 1), Number(query.limit || 10))
  const where: Record<string, unknown> = {}

  if (role === 'REQUESTER') {
    where.requesterId = userId
  } else if (role === 'OFFICER') {
    where.assignments = { some: { officerId: userId, status: { in: ['ACTIVE', 'COMPLETED'] } } }
  }

  if (query.status) where.status = query.status
  if (query.priority) where.priority = query.priority
  if (query.category) where.categoryId = query.category
  if (query.officerId && role === 'ADMIN') {
    where.assignments = { some: { officerId: query.officerId } }
  }
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { referenceNo: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ]
  }
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {
      ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
      ...(query.dateTo && { lte: new Date(query.dateTo) }),
    }
  }

  const orderBy: Record<string, string> = {}
  const validSortFields = ['createdAt', 'updatedAt', 'status', 'priority', 'dueAt']
  const sortField = validSortFields.includes(query.sortBy || '') ? query.sortBy! : 'createdAt'
  orderBy[sortField] = query.order === 'asc' ? 'asc' : 'desc'

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        category: true,
        requester: { select: { id: true, fullName: true, email: true } },
        assignments: {
          where: { status: 'ACTIVE' },
          include: { officer: { select: { id: true, fullName: true, specialization: true } } },
          take: 1,
        },
        _count: { select: { attachments: true, comments: true } },
      },
    }),
    prisma.serviceRequest.count({ where }),
  ])

  return {
    data: requests,
    meta: getMeta(total, Number(query.page || 1), Number(query.limit || 10)),
  }
}

export const getRequestStats = async (userId: string, role: string) => {
  if (role === 'REQUESTER') {
    const [total, open, inProgress, completed] = await Promise.all([
      prisma.serviceRequest.count({ where: { requesterId: userId } }),
      prisma.serviceRequest.count({ where: { requesterId: userId, status: 'SUBMITTED' } }),
      prisma.serviceRequest.count({ where: { requesterId: userId, status: 'IN_PROGRESS' } }),
      prisma.serviceRequest.count({ where: { requesterId: userId, status: 'COMPLETED' } }),
    ])
    return { total, open, inProgress, completed }
  }

  if (role === 'OFFICER') {
    const [assigned, inProgress, completedToday, overdue] = await Promise.all([
      prisma.assignment.count({ where: { officerId: userId, status: 'ACTIVE' } }),
      prisma.serviceRequest.count({
        where: { assignments: { some: { officerId: userId, status: 'ACTIVE' } }, status: 'IN_PROGRESS' },
      }),
      prisma.assignment.count({
        where: {
          officerId: userId,
          status: 'COMPLETED',
          completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.serviceRequest.count({
        where: {
          assignments: { some: { officerId: userId, status: 'ACTIVE' } },
          dueAt: { lt: new Date() },
          status: { notIn: ['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'] },
        },
      }),
    ])
    return { assigned, inProgress, completedToday, overdue }
  }

  // ADMIN — rich stats for dashboard
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)

  const [totalRequests, openRequests, completedToday, slaBreaches, totalUsers, byStatusRaw, byCategoryRaw, resolvedWithTime] = await Promise.all([
    prisma.serviceRequest.count(),
    prisma.serviceRequest.count({ where: { status: { notIn: ['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'] } } }),
    prisma.serviceRequest.count({ where: { status: { in: ['COMPLETED', 'CLOSED'] }, resolvedAt: { gte: todayStart } } }),
    prisma.serviceRequest.count({
      where: { dueAt: { lt: new Date() }, status: { notIn: ['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'] } },
    }),
    prisma.user.count(),
    prisma.serviceRequest.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.serviceRequest.groupBy({ by: ['categoryId'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 6 }),
    prisma.serviceRequest.findMany({ where: { resolvedAt: { not: null } }, select: { createdAt: true, resolvedAt: true }, take: 200 }),
  ])

  const avgResolutionHours = resolvedWithTime.length > 0
    ? Math.round(resolvedWithTime.reduce((acc, r) => acc + (r.resolvedAt!.getTime() - r.createdAt.getTime()) / 3600000, 0) / resolvedWithTime.length * 10) / 10
    : 0

  const requestsByStatus = byStatusRaw.map(s => ({ status: s.status, count: s._count.id }))

  const categoryIds = byCategoryRaw.map(r => r.categoryId)
  const categories = await prisma.requestCategory.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } })
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const requestsByCategory = byCategoryRaw.map(r => ({ category: catMap[r.categoryId] ?? r.categoryId, count: r._count.id }))

  // Last 7 days trend
  const weeklyTrend: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0)
    const end = new Date(d); end.setHours(23, 59, 59, 999)
    const count = await prisma.serviceRequest.count({ where: { createdAt: { gte: d, lte: end } } })
    weeklyTrend.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), count })
  }

  return { totalRequests, openRequests, completedToday, avgResolutionHours, slaBreaches, totalUsers, requestsByStatus, requestsByCategory, weeklyTrend }
}

export const getRequest = async (requestId: string, userId: string, role: string) => {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: {
      category: true,
      requester: { select: { id: true, fullName: true, email: true, department: true } },
      assignments: {
        include: {
          officer: { select: { id: true, fullName: true, email: true, specialization: true } },
          assignedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { assignedAt: 'desc' },
      },
      statusUpdates: {
        include: { actor: { select: { id: true, fullName: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
      attachments: { orderBy: { createdAt: 'asc' } },
      comments: {
        include: { author: { select: { id: true, fullName: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!request) throw new AppError(404, 'Request not found', 'NOT_FOUND')

  const isOwner = request.requesterId === userId
  const isAssignedOfficer = role === 'OFFICER' && request.assignments.some(
    (a) => a.officerId === userId && a.status === 'ACTIVE'
  )

  if (role !== 'ADMIN' && !isOwner && !isAssignedOfficer) {
    throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN')
  }

  // Filter internal comments from requesters
  if (role === 'REQUESTER') {
    request.comments = request.comments.filter((c) => !c.isInternal)
  }

  return request
}

export const updateRequest = async (
  requestId: string,
  userId: string,
  role: string,
  data: Record<string, unknown>
) => {
  const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } })
  if (!request) throw new AppError(404, 'Request not found', 'NOT_FOUND')

  if (role !== 'ADMIN') {
    if (request.requesterId !== userId) throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN')
    if (request.status !== 'SUBMITTED') throw new AppError(409, 'Can only edit while SUBMITTED', 'INVALID_STATUS')
  }

  return prisma.serviceRequest.update({ where: { id: requestId }, data })
}

export const transitionStatus = async (
  requestId: string,
  userId: string,
  role: string,
  toStatus: RequestStatus,
  note: string | undefined,
  files: Express.Multer.File[],
  req: ExpressRequest
) => {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: {
      requester: true,
      assignments: { where: { status: 'ACTIVE' }, include: { officer: true } },
    },
  })
  if (!request) throw new AppError(404, 'Request not found', 'NOT_FOUND')

  const isOwner = request.requesterId === userId
  const isAssignedOfficer = role === 'OFFICER' && request.assignments.some((a) => a.officerId === userId)

  if (role === 'OFFICER' && !isAssignedOfficer) {
    throw new AppError(403, 'You are not assigned to this request', 'FORBIDDEN')
  }

  if (!canTransition(request.status as RequestStatus, toStatus, role, isOwner)) {
    throw new AppError(409, `Cannot transition from ${request.status} to ${toStatus}`, 'INVALID_TRANSITION')
  }

  if (toStatus === 'COMPLETED') {
    if (files.length === 0) {
      throw new AppError(400, 'At least one completion proof image is required', 'PROOF_REQUIRED')
    }
    for (const file of files) {
      const { url, publicId } = await uploadToCloudinary(file.buffer, 'fixit/completion')
      await prisma.attachment.create({
        data: {
          requestId,
          url,
          publicId,
          fileName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          kind: 'COMPLETION_PROOF',
          uploadedById: userId,
        },
      })
    }
    // Mark assignment completed
    await prisma.assignment.updateMany({
      where: { requestId, status: 'ACTIVE' },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
  }

  const updateData: Record<string, unknown> = { status: toStatus }
  if (toStatus === 'COMPLETED') updateData.resolvedAt = new Date()
  if (toStatus === 'CLOSED') updateData.closedAt = new Date()

  const updated = await prisma.serviceRequest.update({
    where: { id: requestId },
    data: updateData,
  })

  await prisma.statusUpdate.create({
    data: {
      requestId,
      fromStatus: request.status,
      toStatus,
      note,
      actorId: userId,
    },
  })

  await auditLog(userId, 'STATUS_CHANGED', 'ServiceRequest', requestId, {
    from: request.status,
    to: toStatus,
  }, req)

  // Notifications
  const notifyUserId = request.requesterId
  if (notifyUserId !== userId) {
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        title: `Request ${toStatus.replace('_', ' ')}`,
        body: `${request.referenceNo} status changed to ${toStatus}`,
        link: `/requests/${requestId}`,
      },
    })
    emitToUser(notifyUserId, 'notification:new', { title: 'Status update', body: toStatus })
  }

  emitToRequest(requestId, 'request:statusChanged', { requestId, status: toStatus })
  emitToRole('ADMIN', 'request:statusChanged', { requestId, status: toStatus })

  try {
    await sendMail(
      request.requester.email,
      `Request Status Updated – ${request.referenceNo}`,
      emailTemplates.statusChanged(request.referenceNo, toStatus)
    )
  } catch {}

  return updated
}

export const setPriority = async (requestId: string, priority: string) => {
  const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } })
  if (!request) throw new AppError(404, 'Request not found', 'NOT_FOUND')
  return prisma.serviceRequest.update({ where: { id: requestId }, data: { priority: priority as any } })
}

export const addAttachments = async (
  requestId: string,
  userId: string,
  role: string,
  files: Express.Multer.File[]
) => {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: { assignments: { where: { status: 'ACTIVE' } } },
  })
  if (!request) throw new AppError(404, 'Request not found', 'NOT_FOUND')

  const isOwner = request.requesterId === userId
  const isAssigned = role === 'OFFICER' && request.assignments.some((a) => a.officerId === userId)
  if (!isOwner && !isAssigned && role !== 'ADMIN') {
    throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN')
  }

  const attachments = []
  for (const file of files) {
    const { url, publicId } = await uploadToCloudinary(file.buffer, 'fixit/evidence')
    const att = await prisma.attachment.create({
      data: {
        requestId,
        url,
        publicId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        kind: 'EVIDENCE',
        uploadedById: userId,
      },
    })
    attachments.push(att)
  }
  return attachments
}

export const deleteAttachment = async (requestId: string, attId: string, userId: string, role: string) => {
  const att = await prisma.attachment.findFirst({ where: { id: attId, requestId } })
  if (!att) throw new AppError(404, 'Attachment not found', 'NOT_FOUND')
  if (att.uploadedById !== userId && role !== 'ADMIN') {
    throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN')
  }
  if (att.publicId) {
    try { await cloudinary.uploader.destroy(att.publicId) } catch {}
  }
  await prisma.attachment.delete({ where: { id: attId } })
}

export const rateRequest = async (requestId: string, userId: string, rating: number, feedback?: string) => {
  const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } })
  if (!request) throw new AppError(404, 'Request not found', 'NOT_FOUND')
  if (request.requesterId !== userId) throw new AppError(403, 'Only the requester can rate', 'FORBIDDEN')
  if (!['COMPLETED', 'CLOSED'].includes(request.status)) {
    throw new AppError(409, 'Can only rate completed or closed requests', 'INVALID_STATUS')
  }
  return prisma.serviceRequest.update({ where: { id: requestId }, data: { rating, feedback } })
}
