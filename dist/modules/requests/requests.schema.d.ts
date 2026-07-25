import { z } from 'zod';
export declare const createRequestSchema: z.ZodObject<{
    title: z.ZodString;
    categoryId: z.ZodString;
    location: z.ZodString;
    roomNumber: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    description: string;
    title: string;
    location: string;
    categoryId: string;
    roomNumber?: string | undefined;
}, {
    description: string;
    title: string;
    location: string;
    categoryId: string;
    roomNumber?: string | undefined;
}>;
export declare const updateRequestSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    roomNumber: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    title?: string | undefined;
    location?: string | undefined;
    roomNumber?: string | undefined;
    categoryId?: string | undefined;
}, {
    description?: string | undefined;
    title?: string | undefined;
    location?: string | undefined;
    roomNumber?: string | undefined;
    categoryId?: string | undefined;
}>;
export declare const statusUpdateSchema: z.ZodObject<{
    status: z.ZodEnum<["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CLOSED", "REJECTED", "CANCELLED"]>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "COMPLETED" | "SUBMITTED" | "ASSIGNED" | "IN_PROGRESS" | "ON_HOLD" | "CLOSED" | "REJECTED" | "CANCELLED";
    note?: string | undefined;
}, {
    status: "COMPLETED" | "SUBMITTED" | "ASSIGNED" | "IN_PROGRESS" | "ON_HOLD" | "CLOSED" | "REJECTED" | "CANCELLED";
    note?: string | undefined;
}>;
export declare const setPrioritySchema: z.ZodObject<{
    priority: z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>;
}, "strip", z.ZodTypeAny, {
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}, {
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}>;
export declare const ratingSchema: z.ZodObject<{
    rating: z.ZodNumber;
    feedback: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    rating: number;
    feedback?: string | undefined;
}, {
    rating: number;
    feedback?: string | undefined;
}>;
export declare const listRequestsSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodString>;
    officerId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodString>;
    order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    page: z.ZodDefault<z.ZodString>;
    limit: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: string;
    page: string;
    sortBy: string;
    order: "asc" | "desc";
    search?: string | undefined;
    priority?: string | undefined;
    status?: string | undefined;
    officerId?: string | undefined;
    category?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
}, {
    search?: string | undefined;
    priority?: string | undefined;
    status?: string | undefined;
    limit?: string | undefined;
    officerId?: string | undefined;
    page?: string | undefined;
    category?: string | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    sortBy?: string | undefined;
    order?: "asc" | "desc" | undefined;
}>;
