export interface UpdateCategoryRequest {
    categoryId: number;
    storeId: number;
    name?: string;
    performedByUserId: number;
    userType: 'OWNER' | 'STORE_USER';
    tokenStoreId?: number;
    ipAddress?: string;
    userAgent?: string;
}

export interface UpdateCategoryResponse {
  id: number;
  name: string;
  updatedAt: Date;
}