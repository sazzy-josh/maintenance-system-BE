export declare const getSummary: (query: {
    dateFrom?: string;
    dateTo?: string;
}) => Promise<{
    total: number;
    open: number;
    completed: number;
    overdue: number;
    completionRate: number;
    avgResolutionHours: number;
}>;
export declare const getByCategory: () => Promise<{
    category: string;
    total: number;
    avgResolutionHours: number;
}[]>;
export declare const getByOfficer: () => Promise<{
    id: string;
    name: string;
    specialization: string | null;
    totalAssigned: number;
    completed: number;
    active: number;
    completionRate: number;
}[]>;
export declare const getMonthlyTrend: () => Promise<{
    month: string;
    count: number;
}[]>;
