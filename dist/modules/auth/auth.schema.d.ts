import { z } from 'zod';
export declare const registerSchema: z.ZodEffects<z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodString;
    matricOrStaffId: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    matricOrStaffId: string;
    fullName: string;
    password: string;
    confirmPassword: string;
    phone?: string | undefined;
    department?: string | undefined;
}, {
    email: string;
    matricOrStaffId: string;
    fullName: string;
    password: string;
    confirmPassword: string;
    phone?: string | undefined;
    department?: string | undefined;
}>, {
    email: string;
    matricOrStaffId: string;
    fullName: string;
    password: string;
    confirmPassword: string;
    phone?: string | undefined;
    department?: string | undefined;
}, {
    email: string;
    matricOrStaffId: string;
    fullName: string;
    password: string;
    confirmPassword: string;
    phone?: string | undefined;
    department?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodEffects<z.ZodObject<{
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    confirmPassword: string;
}, {
    password: string;
    confirmPassword: string;
}>, {
    password: string;
    confirmPassword: string;
}, {
    password: string;
    confirmPassword: string;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
