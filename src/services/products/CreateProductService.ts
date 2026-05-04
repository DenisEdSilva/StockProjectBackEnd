import prismaClient from "../../prisma";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError
} from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";
import { Prisma } from "@prisma/client";

import { mapProductToResponse } from "@/mappers/product/product.mapper";
import {
  CreateProductRequest,
  CreateProductResponse
} from "@/types/product/CreateProduct.types";

class CreateProductService {
  constructor(
    private auditLogService: CreateAuditLogService,
    private activityTracker: ActivityTracker
  ) {}

  async execute(data: CreateProductRequest): Promise<CreateProductResponse> {
    this.validateInput(data);

    return prismaClient.$transaction(async (tx) => {
      const store = await this.getStoreOrFail(tx, data.storeId);

      this.validateAuthorization(data, store.ownerId);

      const category = await this.getCategoryOrFail(tx, data);

      const finalSku = await this.resolveSku(data, category.name);


      let catalogProduct = await tx.productCatalog.findUnique({
        where: {
          ownerId_sku: {
            sku: finalSku,
            ownerId: store.ownerId
          }
        }
      });

      const isCreatingCatalog = !catalogProduct;

      if (isCreatingCatalog) {
        this.validateCatalogPermission(data);

        catalogProduct = await tx.productCatalog.create({
          data: {
            sku: finalSku,
            name: data.name,
            description: data.description,
            banner: data.banner,
            ownerId: store.ownerId,
            categoryId: data.categoryId
          }
        });
      } else if (catalogProduct.isDeleted) {
        this.validateCatalogPermission(data);

        catalogProduct = await tx.productCatalog.update({
          where: { id: catalogProduct.id },
          data: {
            isDeleted: false,
            name: data.name,
            categoryId: data.categoryId
          }
        });
      }

      const existingInventory = await tx.storeInventory.findUnique({
        where: {
          storeId_productId: {
            storeId: data.storeId,
            productId: catalogProduct.id
          }
        }
      });

      if (existingInventory && !existingInventory.isDeleted) {
        throw new ConflictError("ProductAlreadyInStoreInventory");
      }

      const priceValue = new Prisma.Decimal(data.price);

      const inventoryItem = await tx.storeInventory.upsert({
        where: {
          storeId_productId: {
            storeId: data.storeId,
            productId: catalogProduct.id
          }
        },
        update: {
          price: priceValue,
          isDeleted: false
        },
        create: {
          productId: catalogProduct.id,
          storeId: data.storeId,
          price: priceValue,
          stock: 0
        }
      });

      await this.activityTracker.track({
        tx,
        storeId: data.storeId,
        ownerId:
          data.userType === "OWNER"
            ? data.performedByUserId
            : undefined,
        storeUserId:
          data.userType === "STORE_USER"
            ? data.performedByUserId
            : undefined
      });

      await this.auditLogService.create(
        {
          action: existingInventory
            ? "PRODUCT_CATALOG_LINK"
            : "PRODUCT_CREATE",
          details: {
            productId: catalogProduct.id,
            sku: finalSku,
            name: catalogProduct.name,
            price: data.price
          },
          storeId: data.storeId,
          ownerId: store.ownerId,
          userId:
            data.userType === "OWNER"
              ? data.performedByUserId
              : undefined,
          storeUserId:
            data.userType === "STORE_USER"
              ? data.performedByUserId
              : undefined,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          isOwner: data.userType === "OWNER"
        },
        tx
      );

      return mapProductToResponse(catalogProduct, inventoryItem);
    });
  }

  private async getStoreOrFail(tx: any, storeId: number) {
    const store = await tx.store.findUnique({
      where: { id: storeId, isDeleted: false },
      select: { id: true, ownerId: true }
    });

    if (!store) throw new NotFoundError("StoreNotFound");

    return store;
  }

  private async getCategoryOrFail(tx: any, data: CreateProductRequest) {
    const category = await tx.category.findFirst({
      where: {
        id: data.categoryId,
        storeId: data.storeId,
        isDeleted: false
      },
      select: { id: true, name: true }
    });

    if (!category) {
      throw new NotFoundError("CategoryNotFoundInThisStore");
    }

    return category;
  }

  private validateAuthorization(
    data: CreateProductRequest,
    ownerId: number
  ) {
    if (
      data.userType === "OWNER" &&
      ownerId !== data.performedByUserId
    ) {
      throw new ForbiddenError("UnauthorizedAccess");
    }

    if (
      data.userType === "STORE_USER" &&
      data.tokenStoreId !== data.storeId
    ) {
      throw new ForbiddenError("UnauthorizedAccess");
    }
  }

  private validateCatalogPermission(data: CreateProductRequest) {
    const isOwner = data.userType === "OWNER";

    const hasPermission =
      data.userPermissions?.includes("POST_CATALOG");

    if (!isOwner && !hasPermission) {
      throw new ForbiddenError(
        "No permission to create catalog product"
      );
    }
  }

  private async resolveSku(
    data: CreateProductRequest,
    categoryName: string
  ) {
    if (data.sku) return this.normalizeSku(data.sku);

    return this.generateGenericSmartSku(categoryName, data.name);
  }

  private normalizeSku(sku: string): string {
    return sku.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  }

  private async generateGenericSmartSku(
    categoryName: string,
    productName: string
  ): Promise<string> {
    const catPart = categoryName
      .replace(/[^a-zA-Z]/g, "")
      .substring(0, 3)
      .toUpperCase()
      .padEnd(3, "X");

    const namePart = productName
      .replace(/[^a-zA-Z]/g, "")
      .substring(0, 4)
      .toUpperCase()
      .padEnd(4, "X");

    const hashPart = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();

    return `${catPart}-${namePart}-${hashPart}`;
  }

  private validateInput(data: CreateProductRequest) {
    if (!data.name?.trim() || data.name.length < 3) {
      throw new ValidationError("InvalidProductName");
    }

    const priceValue = Number(data.price);

    if (isNaN(priceValue) || priceValue <= 0) {
      throw new ValidationError("InvalidPrice");
    }

    if (!data.categoryId) {
      throw new ValidationError("CategoryRequired");
    }

    if (!data.storeId) {
      throw new ValidationError("StoreRequired");
    }
  }
}

export { CreateProductService };