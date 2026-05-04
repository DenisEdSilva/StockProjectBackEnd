export interface UpdateProductRequest {
    productId: number;
    storeId: number;
    name?: string;
    price?: string | number;
    description?: string;
    categoryId?: number;
    sku?: string;
    banner?: string;
    performedByUserId: number;
    userType: 'OWNER' | 'STORE_USER';
    userPermissions?: string[];
    tokenStoreId?: number;

    ipAddress: string;
    userAgent: string;
}

export interface UpdateProductResponse {
    id: number;
    name: string;
    description: string | null;
    banner: string | null;
    sku: string;
    categoryId: number;
    price: number;
    stock: number;
    storeInventoryId: number;
    updatedAt: Date;
}