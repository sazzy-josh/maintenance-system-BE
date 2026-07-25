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
const express_1 = require("express");
const requestsController = __importStar(require("./requests.controller"));
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const validate_1 = require("../../middleware/validate");
const upload_1 = require("../../middleware/upload");
const requests_schema_1 = require("./requests.schema");
const comments_routes_1 = __importDefault(require("../comments/comments.routes"));
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
// Mount comments sub-router
router.use('/:id/comments', comments_routes_1.default);
/**
 * @swagger
 * /requests:
 *   post:
 *     summary: Submit a new service request
 *     tags: [Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, categoryId, location, description]
 *             properties:
 *               title: { type: string }
 *               categoryId: { type: string }
 *               location: { type: string }
 *               roomNumber: { type: string }
 *               description: { type: string }
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201: { description: Request created }
 */
router.post('/', (0, authorize_1.authorize)('REQUESTER', 'ADMIN'), upload_1.upload.array('images', 3), (0, validate_1.validate)(requests_schema_1.createRequestSchema), requestsController.createRequest);
/**
 * @swagger
 * /requests:
 *   get:
 *     summary: List service requests (scoped by role)
 *     tags: [Requests]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: priority
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: string }
 *     responses:
 *       200: { description: Paginated request list }
 */
router.get('/', (0, validate_1.validate)(requests_schema_1.listRequestsSchema, 'query'), requestsController.listRequests);
/**
 * @swagger
 * /requests/stats:
 *   get:
 *     summary: Get role-scoped dashboard stats
 *     tags: [Requests]
 *     responses:
 *       200: { description: Stats object }
 */
router.get('/stats', requestsController.getStats);
/**
 * @swagger
 * /requests/{id}:
 *   get:
 *     summary: Get full request detail
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Request detail with timeline }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */
router.get('/:id', requestsController.getRequest);
/**
 * @swagger
 * /requests/{id}:
 *   patch:
 *     summary: Edit a request (owner while SUBMITTED, or admin)
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Request updated }
 */
router.patch('/:id', (0, validate_1.validate)(requests_schema_1.updateRequestSchema), requestsController.updateRequest);
/**
 * @swagger
 * /requests/{id}/status:
 *   patch:
 *     summary: Transition request status
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Status transitioned }
 *       409: { description: Invalid transition }
 */
router.patch('/:id/status', upload_1.upload.array('images', 3), (0, validate_1.validate)(requests_schema_1.statusUpdateSchema), requestsController.transitionStatus);
/**
 * @swagger
 * /requests/{id}/priority:
 *   patch:
 *     summary: Set priority (admin only)
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Priority updated }
 */
router.patch('/:id/priority', (0, authorize_1.authorize)('ADMIN'), (0, validate_1.validate)(requests_schema_1.setPrioritySchema), requestsController.setPriority);
/**
 * @swagger
 * /requests/{id}/attachments:
 *   post:
 *     summary: Upload additional images to a request
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Attachments uploaded }
 */
router.post('/:id/attachments', upload_1.upload.array('images', 3), requestsController.addAttachments);
/**
 * @swagger
 * /requests/{id}/attachments/{attId}:
 *   delete:
 *     summary: Delete an attachment
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: attId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Attachment deleted }
 */
router.delete('/:id/attachments/:attId', requestsController.deleteAttachment);
/**
 * @swagger
 * /requests/{id}/rating:
 *   post:
 *     summary: Rate a completed request
 *     tags: [Requests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               feedback: { type: string }
 *     responses:
 *       200: { description: Rating submitted }
 */
router.post('/:id/rating', (0, validate_1.validate)(requests_schema_1.ratingSchema), requestsController.rateRequest);
exports.default = router;
//# sourceMappingURL=requests.routes.js.map