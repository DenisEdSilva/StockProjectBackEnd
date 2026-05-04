export interface ListProductFilters {
    search?: string;
    sku?: string;
    productId?: number;
    categoryId?: number;
    minStock?: number;
    maxStock?: number;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    startDate?: string;
    endDate?: string;
    sortBy?: 'name' | 'stock' | 'price' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

export interface ListProductRequest extends ListProductFilters {
    storeId: number;
    performedByUserId: number;
    userType: 'OWNER' | 'STORE_USER';
    tokenStoreId?: number;
    page: number;
    pageSize: number;
}

export interface ProductDTO {
    id: number;
    storeInventoryId: number;
    name: string;
    price: number;
    stock: number;
    banner?: string | null;
    sku: string;
    description?: string | null;
    category: {
        id: number;
        name: string;
    };
    createdAt: Date;
}

export interface ListProductResponse {
    data: ProductDTO[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}