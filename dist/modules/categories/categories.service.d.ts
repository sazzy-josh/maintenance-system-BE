export declare const listCategories: (includeInactive?: boolean) => Promise<{
    name: string;
    id: string;
    isActive: boolean;
    description: string;
    slaHours: number;
}[]>;
export declare const createCategory: (data: {
    name: string;
    description: string;
    slaHours?: number;
}) => Promise<{
    name: string;
    id: string;
    isActive: boolean;
    description: string;
    slaHours: number;
}>;
export declare const updateCategory: (id: string, data: {
    name?: string;
    description?: string;
    slaHours?: number;
    isActive?: boolean;
}) => Promise<{
    name: string;
    id: string;
    isActive: boolean;
    description: string;
    slaHours: number;
}>;
export declare const deleteCategory: (id: string) => Promise<{
    deactivated: boolean;
    deleted?: undefined;
} | {
    deleted: boolean;
    deactivated?: undefined;
}>;
