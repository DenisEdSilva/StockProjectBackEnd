export interface CreateCategoryRequest {
    storeId: number;
    name: string;
    performedByUserId: number;
    userType: 'OWNER' | 'STORE_USER';
    tokenStoreId?: number;
    ipAddress?: string;
    userAgent?: string;
}

export interface CreateCategoryResponse {
    id: number;
    name: string;
    storeId: number;
    createdAt: Date;
}