import { Request as ExpressRequest } from 'express';
export declare const assignRequest: (adminId: string, data: {
    requestId: string;
    officerId: string;
    note?: string;
}, req: ExpressRequest) => Promise<{
    id: string;
    status: import(".prisma/client").$Enums.AssignmentStatus;
    requestId: string;
    officerId: string;
    assignedById: string;
    note: string | null;
    assignedAt: Date;
    completedAt: Date | null;
}>;
export declare const reassignRequest: (assignmentId: string, adminId: string, data: {
    officerId: string;
    note?: string;
}, req: ExpressRequest) => Promise<{
    id: string;
    status: import(".prisma/client").$Enums.AssignmentStatus;
    requestId: string;
    officerId: string;
    assignedById: string;
    note: string | null;
    assignedAt: Date;
    completedAt: Date | null;
}>;
export declare const getMyAssignments: (officerId: string) => Promise<({
    request: {
        category: {
            name: string;
            id: string;
            isActive: boolean;
            description: string;
            slaHours: number;
        };
        requester: {
            id: string;
            fullName: string;
        };
    } & {
        priority: import(".prisma/client").$Enums.Priority;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        status: import(".prisma/client").$Enums.RequestStatus;
        referenceNo: string;
        title: string;
        location: string;
        roomNumber: string | null;
        dueAt: Date | null;
        resolvedAt: Date | null;
        closedAt: Date | null;
        rating: number | null;
        feedback: string | null;
        categoryId: string;
        requesterId: string;
    };
} & {
    id: string;
    status: import(".prisma/client").$Enums.AssignmentStatus;
    requestId: string;
    officerId: string;
    assignedById: string;
    note: string | null;
    assignedAt: Date;
    completedAt: Date | null;
})[]>;
export declare const getRequestAssignments: (requestId: string, userId: string, role: string) => Promise<({
    officer: {
        id: string;
        fullName: string;
        specialization: string | null;
    };
    assignedBy: {
        id: string;
        fullName: string;
    };
} & {
    id: string;
    status: import(".prisma/client").$Enums.AssignmentStatus;
    requestId: string;
    officerId: string;
    assignedById: string;
    note: string | null;
    assignedAt: Date;
    completedAt: Date | null;
})[]>;
