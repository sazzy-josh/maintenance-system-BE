export declare const getNotifications: (userId: string, page?: number, limit?: number) => Promise<{
    data: {
        link: string | null;
        id: string;
        createdAt: Date;
        body: string;
        userId: string;
        title: string;
        isRead: boolean;
    }[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const getUnreadCount: (userId: string) => Promise<number>;
export declare const markRead: (notificationId: string, userId: string) => Promise<import(".prisma/client").Prisma.BatchPayload>;
export declare const markAllRead: (userId: string) => Promise<import(".prisma/client").Prisma.BatchPayload>;
