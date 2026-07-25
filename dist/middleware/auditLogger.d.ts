import { Request } from 'express';
export declare const auditLog: (actorId: string | undefined | null, action: string, entityType: string, entityId: string, metadata?: Record<string, unknown>, req?: Request) => Promise<void>;
