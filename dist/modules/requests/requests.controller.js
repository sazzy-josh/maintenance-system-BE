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
exports.rateRequest = exports.deleteAttachment = exports.addAttachments = exports.setPriority = exports.transitionStatus = exports.updateRequest = exports.getRequest = exports.getStats = exports.listRequests = exports.createRequest = void 0;
const requestsService = __importStar(require("./requests.service"));
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_1 = require("../../utils/response");
exports.createRequest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const files = req.files || [];
    const request = await requestsService.createRequest(req.user.id, req.body, files, req);
    return (0, response_1.created)(res, request, 'Request submitted successfully');
});
exports.listRequests = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { data, meta } = await requestsService.listRequests(req.user.id, req.user.role, req.query);
    return (0, response_1.success)(res, data, 'Requests retrieved', 200, meta);
});
exports.getStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const stats = await requestsService.getRequestStats(req.user.id, req.user.role);
    return (0, response_1.success)(res, stats);
});
exports.getRequest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const request = await requestsService.getRequest(req.params.id, req.user.id, req.user.role);
    return (0, response_1.success)(res, request);
});
exports.updateRequest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const request = await requestsService.updateRequest(req.params.id, req.user.id, req.user.role, req.body);
    return (0, response_1.success)(res, request, 'Request updated');
});
exports.transitionStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const files = req.files || [];
    const request = await requestsService.transitionStatus(req.params.id, req.user.id, req.user.role, req.body.status, req.body.note, files, req);
    return (0, response_1.success)(res, request, 'Status updated');
});
exports.setPriority = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const request = await requestsService.setPriority(req.params.id, req.body.priority);
    return (0, response_1.success)(res, request, 'Priority updated');
});
exports.addAttachments = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const files = req.files || [];
    const attachments = await requestsService.addAttachments(req.params.id, req.user.id, req.user.role, files);
    return (0, response_1.created)(res, attachments, 'Attachments uploaded');
});
exports.deleteAttachment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await requestsService.deleteAttachment(req.params.id, req.params.attId, req.user.id, req.user.role);
    return (0, response_1.success)(res, null, 'Attachment deleted');
});
exports.rateRequest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const request = await requestsService.rateRequest(req.params.id, req.user.id, req.body.rating, req.body.feedback);
    return (0, response_1.success)(res, request, 'Rating submitted');
});
//# sourceMappingURL=requests.controller.js.map