import { Request, Response } from 'express'
import * as reportsService from './reports.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { success } from '../../utils/response'
import { prisma } from '../../config/db'
import PDFDocument from 'pdfkit'

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportsService.getSummary(req.query as any)
  return success(res, data)
})

export const getByCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportsService.getByCategory()
  return success(res, data)
})

export const getByOfficer = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportsService.getByOfficer()
  return success(res, data)
})

export const getMonthlyTrend = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportsService.getMonthlyTrend()
  return success(res, data)
})

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const { dateFrom, dateTo, status, categoryId } = req.query as Record<string, string>
  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (categoryId) where.categoryId = categoryId
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) }),
    }
  }

  const requests = await prisma.serviceRequest.findMany({
    where,
    include: {
      category: true,
      requester: { select: { fullName: true, email: true } },
      assignments: {
        where: { status: 'ACTIVE' },
        include: { officer: { select: { fullName: true } } },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = ['Reference', 'Title', 'Category', 'Status', 'Priority', 'Location', 'Requester', 'Officer', 'Created', 'Due', 'Resolved']
  const rows = requests.map((r) => [
    r.referenceNo,
    r.title,
    r.category.name,
    r.status,
    r.priority,
    r.location,
    r.requester.fullName,
    r.assignments[0]?.officer.fullName || '',
    r.createdAt.toISOString(),
    r.dueAt?.toISOString() || '',
    r.resolvedAt?.toISOString() || '',
  ])

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=fixit-report.csv')
  return res.send(csv)
})

export const exportPdf = asyncHandler(async (req: Request, res: Response) => {
  const requests = await prisma.serviceRequest.findMany({
    include: { category: true, requester: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const doc = new PDFDocument({ margin: 50 })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename=fixit-report.pdf')
  doc.pipe(res)

  doc.fontSize(20).fillColor('#1e40af').text('MIVA FixIt — Maintenance Report', { align: 'center' })
  doc.fontSize(12).fillColor('#374151').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
  doc.moveDown(2)

  doc.fontSize(14).fillColor('#111827').text('Summary')
  doc.fontSize(11).fillColor('#374151').text(`Total Requests: ${requests.length}`)
  doc.text(`Completed: ${requests.filter((r) => ['COMPLETED', 'CLOSED'].includes(r.status)).length}`)
  doc.text(`Open: ${requests.filter((r) => ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS'].includes(r.status)).length}`)
  doc.moveDown(2)

  doc.fontSize(14).fillColor('#111827').text('Recent Requests')
  doc.moveDown()

  requests.slice(0, 50).forEach((r) => {
    doc.fontSize(10)
      .fillColor('#1e40af').text(r.referenceNo, { continued: true })
      .fillColor('#374151').text(` | ${r.title.substring(0, 50)} | ${r.status} | ${r.category.name}`)
  })

  doc.end()
})
