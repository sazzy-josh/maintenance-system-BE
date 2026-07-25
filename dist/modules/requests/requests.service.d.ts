import { Request as ExpressRequest } from 'express';
type RequestStatus = 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CLOSED' | 'REJECTED' | 'CANCELLED';
export declare const canTransition: (from: RequestStatus, to: RequestStatus, role: string, isOwner: boolean) => boolean;
export declare const createRequest: (requesterId: string, data: {
    title: string;
    categoryId: string;
    location: string;
    roomNumber?: string;
    description: string;
}, files: Express.Multer.File[], req: ExpressRequest) => Promise<{
    category: {
        name: string;
        id: string;
        isActive: boolean;
        description: string;
        slaHours: number;
    };
    requester: {
        id: string;
        email: string;
        matricOrStaffId: string;
        fullName: string;
        phone: string | null;
        department: string | null;
        passwordHash: string;
        roleId: string;
        specialization: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        refreshTokenHash: string | null;
        createdAt: Date;
        updatedAt: Date;
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
}>;
export declare const listRequests: (userId: string, role: string, query: {
    status?: string;
    category?: string;
    priority?: string;
    officerId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    order?: string;
    page?: string;
    limit?: string;
}) => Promise<{
    data: ({
        _count: {
            attachments: number;
            comments: number;
        };
        category: {
            name: string;
            id: string;
            isActive: boolean;
            description: string;
            slaHours: number;
        };
        requester: {
            id: string;
            email: string;
            fullName: string;
        };
        assignments: ({
            officer: {
                id: string;
                fullName: string;
                specialization: string | null;
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
        })[];
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
    })[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const getRequestStats: (userId: string, role: string) => Promise<{
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    assigned?: undefined;
    completedToday?: undefined;
    overdue?: undefined;
    totalRequests?: undefined;
    openRequests?: undefined;
    avgResolutionHours?: undefined;
    slaBreaches?: undefined;
    totalUsers?: undefined;
    requestsByStatus?: undefined;
    requestsByCategory?: undefined;
    weeklyTrend?: undefined;
} | {
    assigned: number;
    inProgress: number;
    completedToday: number;
    overdue: number;
    total?: undefined;
    open?: undefined;
    completed?: undefined;
    totalRequests?: undefined;
    openRequests?: undefined;
    avgResolutionHours?: undefined;
    slaBreaches?: undefined;
    totalUsers?: undefined;
    requestsByStatus?: undefined;
    requestsByCategory?: undefined;
    weeklyTrend?: undefined;
} | {
    totalRequests: number;
    openRequests: number;
    completedToday: number;
    avgResolutionHours: number;
    slaBreaches: number;
    totalUsers: number;
    requestsByStatus: {
        status: import(".prisma/client").$Enums.RequestStatus;
        count: number;
    }[];
    requestsByCategory: {
        category: string;
        count: number;
    }[];
    weeklyTrend: {
        date: string;
        count: number;
    }[];
    total?: undefined;
    open?: undefined;
    inProgress?: undefined;
    completed?: undefined;
    assigned?: undefined;
    overdue?: undefined;
}>;
export declare const getRequest: (requestId: string, userId: string, role: string) => Promise<{
    attachments: {
        url: string;
        id: string;
        createdAt: Date;
        requestId: string;
        publicId: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        kind: string;
        uploadedById: string;
    }[];
    statusUpdates: ({
        actor: {
            role: {
                name: import(".prisma/client").$Enums.RoleName;
                id: string;
                createdAt: Date;
                description: string;
            };
            id: string;
            fullName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        actorId: string;
        requestId: string;
        note: string | null;
        fromStatus: import(".prisma/client").$Enums.RequestStatus | null;
        toStatus: import(".prisma/client").$Enums.RequestStatus;
    })[];
    comments: ({
        author: {
            role: {
                name: import(".prisma/client").$Enums.RoleName;
                id: string;
                createdAt: Date;
                description: string;
            };
            id: string;
            fullName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        body: string;
        requestId: string;
        authorId: string;
        isInternal: boolean;
    })[];
    category: {
        name: string;
        id: string;
        isActive: boolean;
        description: string;
        slaHours: number;
    };
    requester: {
        id: string;
        email: string;
        fullName: string;
        department: string | null;
    };
    assignments: ({
        officer: {
            id: string;
            email: string;
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
    })[];
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
}>;
export declare const updateRequest: (requestId: string, userId: string, role: string, data: Record<string, unknown>) => Promise<{
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
}>;
export declare const transitionStatus: (requestId: string, userId: string, role: string, toStatus: RequestStatus, note: string | undefined, files: Express.Multer.File[], req: ExpressRequest) => Promise<{
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
}>;
export declare const setPriority: (requestId: string, priority: string) => Promise<{
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
}>;
export declare const addAttachments: (requestId: string, userId: string, role: string, files: Express.Multer.File[]) => Promise<{
    url: string;
    id: string;
    createdAt: Date;
    requestId: string;
    publicId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    kind: string;
    uploadedById: string;
}[]>;
export declare const deleteAttachment: (requestId: string, attId: string, userId: string, role: string) => Promise<void>;
export declare const rateRequest: (requestId: string, userId: string, rating: number, feedback?: string) => Promise<{
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
}>;
export {};
