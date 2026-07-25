import { Request, Response } from 'express'
import * as requestsService from './requests.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { success, created } from '../../utils/response'

export const createRequest = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || []
  const request = await requestsService.createRequest(req.user!.id, req.body, files, req)
  return created(res, request, 'Request submitted successfully')
})

export const listRequests = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await requestsService.listRequests(req.user!.id, req.user!.role, req.query as any)
  return success(res, data, 'Requests retrieved', 200, meta)
})

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await requestsService.getRequestStats(req.user!.id, req.user!.role)
  return success(res, stats)
})

export const getRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await requestsService.getRequest(req.params.id, req.user!.id, req.user!.role)
  return success(res, request)
})

export const updateRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await requestsService.updateRequest(req.params.id, req.user!.id, req.user!.role, req.body)
  return success(res, request, 'Request updated')
})

export const transitionStatus = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || []
  const request = await requestsService.transitionStatus(
    req.params.id,
    req.user!.id,
    req.user!.role,
    req.body.status,
    req.body.note,
    files,
    req
  )
  return success(res, request, 'Status updated')
})

export const setPriority = asyncHandler(async (req: Request, res: Response) => {
  const request = await requestsService.setPriority(req.params.id, req.body.priority)
  return success(res, request, 'Priority updated')
})

export const addAttachments = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || []
  const attachments = await requestsService.addAttachments(req.params.id, req.user!.id, req.user!.role, files)
  return created(res, attachments, 'Attachments uploaded')
})

export const deleteAttachment = asyncHandler(async (req: Request, res: Response) => {
  await requestsService.deleteAttachment(req.params.id, req.params.attId, req.user!.id, req.user!.role)
  return success(res, null, 'Attachment deleted')
})

export const rateRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await requestsService.rateRequest(req.params.id, req.user!.id, req.body.rating, req.body.feedback)
  return success(res, request, 'Rating submitted')
})
