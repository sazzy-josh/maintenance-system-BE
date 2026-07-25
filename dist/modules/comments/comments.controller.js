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
exports.addComment = exports.getComments = void 0;
const commentsService = __importStar(require("./comments.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
const zod_1 = require("zod");
const AppError_1 = require("../../utils/AppError");
const commentSchema = zod_1.z.object({
    body: zod_1.z.string().min(1).max(2000),
    isInternal: zod_1.z.boolean().default(false),
});
exports.getComments = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const comments = await commentsService.getComments(req.params.id, req.user.id, req.user.role);
    return (0, response_1.success)(res, comments);
});
exports.addComment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success)
        throw new AppError_1.AppError(400, 'Validation failed', 'VALIDATION_ERROR');
    const comment = await commentsService.addComment(req.params.id, req.user.id, req.user.role, parsed.data.body, parsed.data.isInternal);
    return (0, response_1.created)(res, comment, 'Comment added');
});
//# sourceMappingURL=comments.controller.js.map