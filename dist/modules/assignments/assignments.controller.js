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
exports.getRequestAssignments = exports.getMyAssignments = exports.reassignRequest = exports.assignRequest = void 0;
const assignmentsService = __importStar(require("./assignments.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
const zod_1 = require("zod");
const assignSchema = zod_1.z.object({
    requestId: zod_1.z.string().uuid(),
    officerId: zod_1.z.string().uuid(),
    note: zod_1.z.string().optional(),
});
const reassignSchema = zod_1.z.object({
    officerId: zod_1.z.string().uuid(),
    note: zod_1.z.string().optional(),
});
exports.assignRequest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = assignSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ success: false, message: 'Validation failed' });
    const assignment = await assignmentsService.assignRequest(req.user.id, parsed.data, req);
    return (0, response_1.created)(res, assignment, 'Request assigned successfully');
});
exports.reassignRequest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = reassignSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ success: false, message: 'Validation failed' });
    const assignment = await assignmentsService.reassignRequest(req.params.id, req.user.id, parsed.data, req);
    return (0, response_1.success)(res, assignment, 'Request reassigned successfully');
});
exports.getMyAssignments = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const assignments = await assignmentsService.getMyAssignments(req.user.id);
    return (0, response_1.success)(res, assignments);
});
exports.getRequestAssignments = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const assignments = await assignmentsService.getRequestAssignments(req.params.requestId, req.user.id, req.user.role);
    return (0, response_1.success)(res, assignments);
});
//# sourceMappingURL=assignments.controller.js.map