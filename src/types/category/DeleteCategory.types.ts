export interface DeleteCategoryRequest {
    categoryId: number;
    storeId: number;
    performedByUserId: number;
    userType: 'OWNER' | 'STORE_USER';
    tokenStoreId?: number;
    ipAddress?: string;
    userAgent?: string;
}

export interface DeleteCategoryResponse {
    success: boolean;
}