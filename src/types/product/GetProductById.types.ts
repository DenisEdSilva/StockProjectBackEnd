export interface GetProductByIdRequest {
    id: number;
    storeId: number;
    performedByUserId: number;
    userType: 'OWNER' | 'STORE_USER';
    tokenStoreId?: number;
}

export interface GetProductByIdResponse {
    id: number;
    storeInventoryId: number;
    name: string;
    price: string;
    stock: number;
    banner?: string | null;
    sku: string;
    description?: string | null;
    categoryId: number;
    category: {
        id: number;
        name: string;
    };
}