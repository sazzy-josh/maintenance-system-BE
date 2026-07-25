import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
export declare const initSocket: (server: HttpServer) => SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const getIO: () => SocketServer;
export declare const emitToUser: (userId: string, event: string, data: unknown) => void;
export declare const emitToRole: (role: string, event: string, data: unknown) => void;
export declare const emitToRequest: (requestId: string, event: string, data: unknown) => void;
