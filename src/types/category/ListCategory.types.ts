export interface ListCategoryRequest {
    storeId: number;
    performedByUserId: number;
    userType: 'OWNER' | 'STORE_USER';
    tokenStoreId?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: 'name' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    minProducts?: number;
    maxProducts?: number;
    page: number;
    pageSize: number;
}

export interface ListCategoryResponse {
    data: {
        id: number;
        name: string;
        storeId: number;
        createdAt: Date;
        productsCount: number;
    }[];

    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}