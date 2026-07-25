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
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const requestId_1 = require("./middleware/requestId");
const errorHandler_1 = require("./middleware/errorHandler");
const swagger_1 = require("./config/swagger");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const requests_routes_1 = __importDefault(require("./modules/requests/requests.routes"));
const comments_routes_1 = __importDefault(require("./modules/comments/comments.routes"));
const categories_routes_1 = __importDefault(require("./modules/categories/categories.routes"));
const assignments_routes_1 = __importDefault(require("./modules/assignments/assignments.routes"));
const notifications_routes_1 = __importDefault(require("./modules/notifications/notifications.routes"));
const reports_routes_1 = __importDefault(require("./modules/reports/reports.routes"));
const audit_routes_1 = __importDefault(require("./modules/audit/audit.routes"));
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow server-to-server / curl (no Origin header)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin.replace(/\/$/, '')))
            return callback(null, true);
        callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));
app.use(requestId_1.requestId);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    message: { success: false, message: 'Too many requests', code: 'RATE_LIMITED' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'development',
});
app.use('/api', globalLimiter);
// Health check
app.get('/api/v1/health', async (_req, res) => {
    let dbConnected = false;
    try {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('./config/db')));
        await prisma.$queryRaw `SELECT 1`;
        dbConnected = true;
    }
    catch { }
    res.json({ status: 'ok', uptime: process.uptime(), dbConnected, timestamp: new Date().toISOString() });
});
// Swagger docs
app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    customSiteTitle: 'MIVA FixIt API Docs',
    swaggerOptions: { persistAuthorization: true },
}));
// Routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/users', users_routes_1.default);
app.use('/api/v1/requests/:id/comments', comments_routes_1.default);
app.use('/api/v1/requests', requests_routes_1.default);
app.use('/api/v1/categories', categories_routes_1.default);
app.use('/api/v1/assignments', assignments_routes_1.default);
app.use('/api/v1/notifications', notifications_routes_1.default);
app.use('/api/v1/reports', reports_routes_1.default);
app.use('/api/v1/audit', audit_routes_1.default);
// 404
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found', code: 'NOT_FOUND' });
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map