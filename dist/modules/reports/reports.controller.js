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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportPdf = exports.exportCsv = exports.getMonthlyTrend = exports.getByOfficer = exports.getByCategory = exports.getSummary = void 0;
const reportsService = __importStar(require("./reports.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
const db_1 = require("../../config/db");
const pdfkit_1 = __importDefault(require("pdfkit"));
exports.getSummary = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await reportsService.getSummary(req.query);
    return (0, response_1.success)(res, data);
});
exports.getByCategory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await reportsService.getByCategory();
    return (0, response_1.success)(res, data);
});
exports.getByOfficer = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await reportsService.getByOfficer();
    return (0, response_1.success)(res, data);
});
exports.getMonthlyTrend = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await reportsService.getMonthlyTrend();
    return (0, response_1.success)(res, data);
});
exports.exportCsv = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { dateFrom, dateTo, status, categoryId } = req.query;
    const where = {};
    if (status)
        where.status = status;
    if (categoryId)
        where.categoryId = categoryId;
    if (dateFrom || dateTo) {
        where.createdAt = {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo) }),
        };
    }
    const requests = await db_1.prisma.serviceRequest.findMany({
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
    });
    const headers = ['Reference', 'Title', 'Category', 'Status', 'Priority', 'Location', 'Requester', 'Officer', 'Created', 'Due', 'Resolved'];
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
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fixit-report.csv');
    return res.send(csv);
});
exports.exportPdf = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const requests = await db_1.prisma.serviceRequest.findMany({
        include: { category: true, requester: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
    });
    const doc = new pdfkit_1.default({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=fixit-report.pdf');
    doc.pipe(res);
    doc.fontSize(20).fillColor('#1e40af').text('MIVA FixIt — Maintenance Report', { align: 'center' });
    doc.fontSize(12).fillColor('#374151').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(14).fillColor('#111827').text('Summary');
    doc.fontSize(11).fillColor('#374151').text(`Total Requests: ${requests.length}`);
    doc.text(`Completed: ${requests.filter((r) => ['COMPLETED', 'CLOSED'].includes(r.status)).length}`);
    doc.text(`Open: ${requests.filter((r) => ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS'].includes(r.status)).length}`);
    doc.moveDown(2);
    doc.fontSize(14).fillColor('#111827').text('Recent Requests');
    doc.moveDown();
    requests.slice(0, 50).forEach((r) => {
        doc.fontSize(10)
            .fillColor('#1e40af').text(r.referenceNo, { continued: true })
            .fillColor('#374151').text(` | ${r.title.substring(0, 50)} | ${r.status} | ${r.category.name}`);
    });
    doc.end();
});
//# sourceMappingURL=reports.controller.js.map