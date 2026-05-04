export interface CreateProductRequest {
  name: string;
  description?: string;
  banner?: string;
  sku?: string;
  price: string;
  categoryId: number;
  storeId: number;
  performedByUserId: number;
  userType: 'OWNER' | 'STORE_USER';
  tokenStoreId?: number;
  userPermissions?: string[];
  ipAddress: string;
  userAgent: string;
}

export interface CreateProductResponse {
  id: number
  name: string
  sku: string
  categoryId: number
  banner?: string | null
  description?: string | null
  price: string
  storeInventoryId: number
  createdAt: Date
  updatedAt: Date
}