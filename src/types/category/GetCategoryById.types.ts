export interface GetCategoryByIdRequest {
    id: number;
    storeId: number;
    performedByUserId: number;
    userType: 'OWNER' | 'STORE_USER';
    tokenStoreId?: number;
}

export interface GetCategoryByIdResponse {
    id: number;
    name: string;
    storeId: number;
    createdAt: Date;
    productsCount: number;
}