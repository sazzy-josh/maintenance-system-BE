import { prisma } from '../../config/db'
import { AppError } from '../../utils/AppError'
import { emitToRequest } from '../../sockets/socket'

export const getComments = async (requestId: string, userId: string, role: string) => {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: { assignments: { where: { status: 'ACTIVE' } } },
  })
  if (!request) throw new AppError(404, 'Request not found', 'NOT_FOUND')

  const isOwner = request.requesterId === userId
  const isAssigned = role === 'OFFICER' && request.assignments.some((a) => a.officerId === userId)
  if (role !== 'ADMIN' && !isOwner && !isAssigned) {
    throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN')
  }

  const comments = await prisma.comment.findMany({
    where: {
      requestId,
      ...(role === 'REQUESTER' ? { isInternal: false } : {}),
    },
    include: { author: { select: { id: true, fullName: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return comments
}

export const addComment = async (
  requestId: string,
  authorId: string,
  role: string,
  body: string,
  isInternal: boolean
) => {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: { assignments: { where: { status: 'ACTIVE' } } },
  })
  if (!request) throw new AppError(404, 'Request not found', 'NOT_FOUND')

  const isOwner = request.requesterId === authorId
  const isAssigned = role === 'OFFICER' && request.assignments.some((a) => a.officerId === authorId)

  if (role === 'REQUESTER' && !isOwner) throw new AppError(403, 'Can only comment on own requests', 'FORBIDDEN')
  if (role === 'OFFICER' && !isAssigned) throw new AppError(403, 'Not assigned to this request', 'FORBIDDEN')

  // Requesters can't create internal comments
  const internal = role === 'REQUESTER' ? false : isInternal

  const comment = await prisma.comment.create({
    data: { requestId, authorId, body, isInternal: internal },
    include: { author: { select: { id: true, fullName: true, role: true } } },
  })

  emitToRequest(requestId, 'comment:added', { requestId, comment })

  // Notify requester if comment from officer/admin
  if (role !== 'REQUESTER' && !internal) {
    await prisma.notification.create({
      data: {
        userId: request.requesterId,
        title: 'New comment on your request',
        body: `${body.substring(0, 80)}...`,
        link: `/requests/${requestId}`,
      },
    })
  }

  return comment
}
