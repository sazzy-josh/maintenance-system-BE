export declare const listUsers: (query: {
    role?: string;
    search?: string;
    isActive?: string;
    page?: string;
    limit?: string;
}) => Promise<{
    data: {
        id: string;
        fullName: string;
        email: string;
        matricOrStaffId: string;
        phone: string | null;
        department: string | null;
        role: import(".prisma/client").$Enums.RoleName;
        specialization: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const getOfficers: () => Promise<{
    id: string;
    fullName: string;
    email: string;
    specialization: string | null;
    activeJobCount: number;
}[]>;
export declare const getUser: (id: string) => Promise<{
    id: string;
    fullName: string;
    email: string;
    matricOrStaffId: string;
    phone: string | null;
    department: string | null;
    role: import(".prisma/client").$Enums.RoleName;
    specialization: string | null;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
}>;
export declare const createUser: (data: {
    fullName: string;
    email: string;
    matricOrStaffId: string;
    phone?: string;
    department?: string;
    password: string;
    role: string;
    specialization?: string;
}) => Promise<{
    id: string;
    fullName: string;
    email: string;
    role: import(".prisma/client").$Enums.RoleName;
    specialization: string | null;
}>;
export declare const updateUser: (id: string, data: {
    fullName?: string;
    phone?: string;
    department?: string;
    specialization?: string;
}) => Promise<{
    id: string;
    fullName: string;
    role: import(".prisma/client").$Enums.RoleName;
}>;
export declare const changeRole: (id: string, roleName: string, specialization?: string) => Promise<void>;
export declare const changeStatus: (id: string, requestingUserId: string, isActive: boolean) => Promise<void>;
