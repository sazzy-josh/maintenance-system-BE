export declare const getComments: (requestId: string, userId: string, role: string) => Promise<({
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
})[]>;
export declare const addComment: (requestId: string, authorId: string, role: string, body: string, isInternal: boolean) => Promise<{
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
}>;
