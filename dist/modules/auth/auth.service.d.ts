export declare const generateTokens: (userId: string, email: string, role: string) => Promise<{
    accessToken: string;
    refreshToken: string;
}>;
export declare const registerUser: (data: {
    fullName: string;
    email: string;
    matricOrStaffId: string;
    phone?: string;
    department?: string;
    password: string;
}) => Promise<{
    id: string;
    email: string;
    fullName: string;
    role: import(".prisma/client").$Enums.RoleName;
}>;
export declare const loginUser: (email: string, password: string) => Promise<{
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
    user: {
        id: string;
        email: string;
        fullName: string;
        role: import(".prisma/client").$Enums.RoleName;
        department: string | null;
        phone: string | null;
        specialization: string | null;
    };
}>;
export declare const refreshAccessToken: (refreshToken: string) => Promise<{
    accessToken: string;
    refreshToken: string;
}>;
export declare const logoutUser: (userId: string) => Promise<void>;
export declare const getMe: (userId: string) => Promise<{
    id: string;
    email: string;
    fullName: string;
    matricOrStaffId: string;
    phone: string | null;
    department: string | null;
    role: import(".prisma/client").$Enums.RoleName;
    specialization: string | null;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
}>;
export declare const forgotPassword: (email: string) => Promise<void>;
export declare const resetPassword: (token: string, newPassword: string) => Promise<void>;
export declare const changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<void>;
