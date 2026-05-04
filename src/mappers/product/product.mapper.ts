import { ProductCatalog, StoreInventory } from "@prisma/client";

import { CreateProductResponse } from "@/types/product/CreateProduct.types";

export function mapProductToResponse(
  product: ProductCatalog,
  inventory: StoreInventory
): CreateProductResponse {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    banner: product.banner,
    description: product.description,
    categoryId: product.categoryId,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    price: inventory.price.toString(),
    storeInventoryId: inventory.id
  };
}