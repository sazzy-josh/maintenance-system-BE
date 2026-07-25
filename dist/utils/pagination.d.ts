export declare const getPagination: (page?: number, limit?: number) => {
    skip: number;
    take: number;
};
export declare const getMeta: (total: number, page: number, limit: number) => {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};
