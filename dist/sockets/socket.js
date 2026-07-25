"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToRequest = exports.emitToRole = exports.emitToUser = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true,
            methods: ['GET', 'POST'],
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token)
            return next(new Error('Unauthorized'));
        try {
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.data.userId = payload.sub;
            socket.data.role = payload.role;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const { userId, role } = socket.data;
        socket.join(`user:${userId}`);
        socket.join(`role:${role}`);
        socket.on('join:request', (requestId) => {
            socket.join(`request:${requestId}`);
        });
        socket.on('leave:request', (requestId) => {
            socket.leave(`request:${requestId}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io)
        throw new Error('Socket.IO not initialized');
    return io;
};
exports.getIO = getIO;
const emitToUser = (userId, event, data) => {
    try {
        (0, exports.getIO)().to(`user:${userId}`).emit(event, data);
    }
    catch { }
};
exports.emitToUser = emitToUser;
const emitToRole = (role, event, data) => {
    try {
        (0, exports.getIO)().to(`role:${role}`).emit(event, data);
    }
    catch { }
};
exports.emitToRole = emitToRole;
const emitToRequest = (requestId, event, data) => {
    try {
        (0, exports.getIO)().to(`request:${requestId}`).emit(event, data);
    }
    catch { }
};
exports.emitToRequest = emitToRequest;
//# sourceMappingURL=socket.js.map