import { Router } from 'express'
import * as reportsController from './reports.controller'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'

const router = Router()
router.use(authenticate, authorize('ADMIN'))

/**
 * @swagger
 * /reports/summary:
 *   get:
 *     summary: KPI summary (admin only)
 *     tags: [Reports]
 *     responses:
 *       200: { description: Summary stats }
 */
router.get('/summary', reportsController.getSummary)

/**
 * @swagger
 * /reports/by-category:
 *   get:
 *     summary: Requests by category (admin only)
 *     tags: [Reports]
 *     responses:
 *       200: { description: Category breakdown }
 */
router.get('/by-category', reportsController.getByCategory)

/**
 * @swagger
 * /reports/by-officer:
 *   get:
 *     summary: Officer workload (admin only)
 *     tags: [Reports]
 *     responses:
 *       200: { description: Officer stats }
 */
router.get('/by-officer', reportsController.getByOfficer)

/**
 * @swagger
 * /reports/monthly-trend:
 *   get:
 *     summary: Last 12 months volume (admin only)
 *     tags: [Reports]
 *     responses:
 *       200: { description: Monthly trend }
 */
router.get('/monthly-trend', reportsController.getMonthlyTrend)

/**
 * @swagger
 * /reports/export/csv:
 *   get:
 *     summary: Export requests as CSV (admin only)
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/export/csv', reportsController.exportCsv)

/**
 * @swagger
 * /reports/export/pdf:
 *   get:
 *     summary: Export report as PDF (admin only)
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/export/pdf', reportsController.exportPdf)

export default router
