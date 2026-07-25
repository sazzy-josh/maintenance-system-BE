import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodString;
    matricOrStaffId: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
    role: z.ZodEnum<["REQUESTER", "OFFICER", "ADMIN"]>;
    specialization: z.ZodOptional<z.ZodEnum<["ELECTRICAL", "PLUMBING", "CARPENTRY", "IT", "GENERAL"]>>;
}, "strip", z.ZodTypeAny, {
    role: "REQUESTER" | "OFFICER" | "ADMIN";
    email: string;
    matricOrStaffId: string;
    fullName: string;
    password: string;
    phone?: string | undefined;
    department?: string | undefined;
    specialization?: "ELECTRICAL" | "PLUMBING" | "CARPENTRY" | "IT" | "GENERAL" | undefined;
}, {
    role: "REQUESTER" | "OFFICER" | "ADMIN";
    email: string;
    matricOrStaffId: string;
    fullName: string;
    password: string;
    phone?: string | undefined;
    department?: string | undefined;
    specialization?: "ELECTRICAL" | "PLUMBING" | "CARPENTRY" | "IT" | "GENERAL" | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    specialization: z.ZodOptional<z.ZodEnum<["ELECTRICAL", "PLUMBING", "CARPENTRY", "IT", "GENERAL"]>>;
}, "strip", z.ZodTypeAny, {
    fullName?: string | undefined;
    phone?: string | undefined;
    department?: string | undefined;
    specialization?: "ELECTRICAL" | "PLUMBING" | "CARPENTRY" | "IT" | "GENERAL" | undefined;
}, {
    fullName?: string | undefined;
    phone?: string | undefined;
    department?: string | undefined;
    specialization?: "ELECTRICAL" | "PLUMBING" | "CARPENTRY" | "IT" | "GENERAL" | undefined;
}>;
export declare const changeRoleSchema: z.ZodObject<{
    role: z.ZodEnum<["REQUESTER", "OFFICER", "ADMIN"]>;
    specialization: z.ZodOptional<z.ZodEnum<["ELECTRICAL", "PLUMBING", "CARPENTRY", "IT", "GENERAL"]>>;
}, "strip", z.ZodTypeAny, {
    role: "REQUESTER" | "OFFICER" | "ADMIN";
    specialization?: "ELECTRICAL" | "PLUMBING" | "CARPENTRY" | "IT" | "GENERAL" | undefined;
}, {
    role: "REQUESTER" | "OFFICER" | "ADMIN";
    specialization?: "ELECTRICAL" | "PLUMBING" | "CARPENTRY" | "IT" | "GENERAL" | undefined;
}>;
export declare const listUsersSchema: z.ZodObject<{
    role: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodString>;
    limit: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: string;
    page: string;
    search?: string | undefined;
    role?: string | undefined;
    isActive?: string | undefined;
}, {
    search?: string | undefined;
    role?: string | undefined;
    isActive?: string | undefined;
    limit?: string | undefined;
    page?: string | undefined;
}>;
