"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportsController = __importStar(require("./reports.controller"));
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate, (0, authorize_1.authorize)('ADMIN'));
/**
 * @swagger
 * /reports/summary:
 *   get:
 *     summary: KPI summary (admin only)
 *     tags: [Reports]
 *     responses:
 *       200: { description: Summary stats }
 */
router.get('/summary', reportsController.getSummary);
/**
 * @swagger
 * /reports/by-category:
 *   get:
 *     summary: Requests by category (admin only)
 *     tags: [Reports]
 *     responses:
 *       200: { description: Category breakdown }
 */
router.get('/by-category', reportsController.getByCategory);
/**
 * @swagger
 * /reports/by-officer:
 *   get:
 *     summary: Officer workload (admin only)
 *     tags: [Reports]
 *     responses:
 *       200: { description: Officer stats }
 */
router.get('/by-officer', reportsController.getByOfficer);
/**
 * @swagger
 * /reports/monthly-trend:
 *   get:
 *     summary: Last 12 months volume (admin only)
 *     tags: [Reports]
 *     responses:
 *       200: { description: Monthly trend }
 */
router.get('/monthly-trend', reportsController.getMonthlyTrend);
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
router.get('/export/csv', reportsController.exportCsv);
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
router.get('/export/pdf', reportsController.exportPdf);
exports.default = router;
//# sourceMappingURL=reports.routes.js.map