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
const assignmentsController = __importStar(require("./assignments.controller"));
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
/**
 * @swagger
 * /assignments:
 *   post:
 *     summary: Assign a request to an officer (admin only)
 *     tags: [Assignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestId, officerId]
 *             properties:
 *               requestId: { type: string }
 *               officerId: { type: string }
 *               note: { type: string }
 *     responses:
 *       201: { description: Assigned }
 *       400: { description: Invalid officer }
 */
router.post('/', (0, authorize_1.authorize)('ADMIN'), assignmentsController.assignRequest);
/**
 * @swagger
 * /assignments/{id}/reassign:
 *   patch:
 *     summary: Reassign to a different officer (admin only)
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Reassigned }
 */
router.patch('/:id/reassign', (0, authorize_1.authorize)('ADMIN'), assignmentsController.reassignRequest);
/**
 * @swagger
 * /assignments/my:
 *   get:
 *     summary: Get officer's active assignments
 *     tags: [Assignments]
 *     responses:
 *       200: { description: My assignments }
 */
router.get('/my', (0, authorize_1.authorize)('OFFICER'), assignmentsController.getMyAssignments);
/**
 * @swagger
 * /assignments/request/{requestId}:
 *   get:
 *     summary: Get assignment history for a request
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Assignment history }
 */
router.get('/request/:requestId', assignmentsController.getRequestAssignments);
exports.default = router;
//# sourceMappingURL=assignments.routes.js.map