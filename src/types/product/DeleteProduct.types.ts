export interface DeleteProductRequest {
    performedByUserId: number;
    userType: "OWNER" | "STORE_USER";
    userPermissions: string[];
    tokenStoreId?: number;
    storeId: number;
    productId: number;
    isGlobal: boolean;
    ipAddress: string;
    userAgent: string;
}

export interface DeleteProductResponse {
    message: string;
    deletedAt: Date;
}