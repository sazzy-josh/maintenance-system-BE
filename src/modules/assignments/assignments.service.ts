import { prisma } from '../../config/db'
import { AppError } from '../../utils/AppError'
import { auditLog } from '../../middleware/auditLogger'
import { emitToUser, emitToRole } from '../../sockets/socket'
import { sendMail, emailTemplates } from '../../config/mailer'
import { Request as ExpressRequest } from 'express'

export const assignRequest = async (
  adminId: string,
  data: { requestId: string; officerId: string; note?: string },
  req: ExpressRequest
) => {
  const request = await prisma.serviceRequest.findUnique({ where: { id: data.requestId } })
  if (!request) throw new AppError(404, 'Request not found', 'NOT_FOUND')
  if (!['SUBMITTED', 'ASSIGNED'].includes(request.status)) {
    throw new AppError(409, 'Request cannot be assigned in its current status', 'INVALID_STATUS')
  }

  const officer = await prisma.user.findUnique({
    where: { id: data.officerId },
    include: { role: true },
  })
  if (!officer || officer.role.name !== 'OFFICER' || !officer.isActive) {
    throw new AppError(400, 'Invalid or inactive officer', 'INVALID_OFFICER')
  }

  // Reassign: mark existing active assignment as REASSIGNED
  await prisma.assignment.updateMany({
    where: { requestId: data.requestId, status: 'ACTIVE' },
    data: { status: 'REASSIGNED' },
  })

  const assignment = await prisma.assignment.create({
    data: {
      requestId: data.requestId,
      officerId: data.officerId,
      assignedById: adminId,
      note: data.note,
    },
  })

  await prisma.serviceRequest.update({
    where: { id: data.requestId },
    data: { status: 'ASSIGNED' },
  })

  await prisma.statusUpdate.create({
    data: {
      requestId: data.requestId,
      fromStatus: request.status,
      toStatus: 'ASSIGNED',
      note: data.note || `Assigned to ${officer.fullName}`,
      actorId: adminId,
    },
  })

  await auditLog(adminId, 'REQUEST_ASSIGNED', 'Assignment', assignment.id, {
    requestId: data.requestId,
    officerId: data.officerId,
  }, req)

  // Notify officer
  await prisma.notification.create({
    data: {
      userId: data.officerId,
      title: 'New job assigned',
      body: `${request.referenceNo}: ${request.title}`,
      link: `/officer/jobs/${data.requestId}`,
    },
  })
  emitToUser(data.officerId, 'notification:new', { title: 'New job assigned', body: request.referenceNo })
  emitToUser(data.officerId, 'request:assigned', { requestId: data.requestId })
  emitToRole('ADMIN', 'request:statusChanged', { requestId: data.requestId, status: 'ASSIGNED' })

  // Notify requester
  await prisma.notification.create({
    data: {
      userId: request.requesterId,
      title: 'Request assigned',
      body: `${request.referenceNo} has been assigned to a maintenance officer`,
      link: `/requests/${data.requestId}`,
    },
  })

  try {
    await sendMail(
      officer.email,
      `New Job Assigned – ${request.referenceNo}`,
      emailTemplates.officerAssigned(request.referenceNo, request.title, data.note)
    )
    const requester = await prisma.user.findUnique({ where: { id: request.requesterId } })
    if (requester) {
      await sendMail(
        requester.email,
        `Request Assigned – ${request.referenceNo}`,
        emailTemplates.requestAssigned(request.referenceNo, officer.fullName)
      )
    }
  } catch {}

  return assignment
}

export const reassignRequest = async (
  assignmentId: string,
  adminId: string,
  data: { officerId: string; note?: string },
  req: ExpressRequest
) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { request: true },
  })
  if (!assignment) throw new AppError(404, 'Assignment not found', 'NOT_FOUND')

  return assignRequest(adminId, {
    requestId: assignment.requestId,
    officerId: data.officerId,
    note: data.note,
  }, req)
}

export const getMyAssignments = async (officerId: string) => {
  return prisma.assignment.findMany({
    where: { officerId, status: 'ACTIVE' },
    include: {
      request: {
        include: {
          category: true,
          requester: { select: { id: true, fullName: true } },
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  })
}

export const getRequestAssignments = async (requestId: string, userId: string, role: string) => {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: { assignments: { where: { status: 'ACTIVE' } } },
  })
  if (!request) throw new AppError(404, 'Request not found', 'NOT_FOUND')

  const isAssigned = role === 'OFFICER' && request.assignments.some((a) => a.officerId === userId)
  if (role !== 'ADMIN' && !isAssigned) {
    throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN')
  }

  return prisma.assignment.findMany({
    where: { requestId },
    include: {
      officer: { select: { id: true, fullName: true, specialization: true } },
      assignedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { assignedAt: 'desc' },
  })
}
