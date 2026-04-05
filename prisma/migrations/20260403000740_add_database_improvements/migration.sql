/*
  Warnings:

  - The `details` column on the `AuditLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `price` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `stores` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[action,resource]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,storeId]` on the table `StoreUser` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `action` on the `Permission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `createdAt` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `previousStock` to the `StockMoviment` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `StockMoviment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `createdAt` on table `StockMoviment` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'FETCH', 'DELETE');

-- CreateEnum
CREATE TYPE "StockMovimentType" AS ENUM ('IN', 'OUT', 'TRANSFER', 'REVERSAL');

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_storeId_fkey";

-- DropForeignKey
ALTER TABLE "StockMoviment" DROP CONSTRAINT "StockMoviment_destinationStoreId_fkey";

-- DropForeignKey
ALTER TABLE "StockMoviment" DROP CONSTRAINT "StockMoviment_storeId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovimentStore" DROP CONSTRAINT "StockMovimentStore_storeId_fkey";

-- DropForeignKey
ALTER TABLE "StoreUser" DROP CONSTRAINT "StoreUser_storeId_fkey";

-- DropForeignKey
ALTER TABLE "stores" DROP CONSTRAINT "stores_ownerId_fkey";

-- DropIndex
DROP INDEX "Product_sku_storeId_idx";

-- DropIndex
DROP INDEX "StoreUser_email_key";

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "details",
ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "action",
ADD COLUMN     "action" "PermissionAction" NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "price",
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ALTER COLUMN "createdAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "StockMoviment" ADD COLUMN     "previousStock" INTEGER NOT NULL,
ALTER COLUMN "stock" DROP DEFAULT,
DROP COLUMN "type",
ADD COLUMN     "type" "StockMovimentType" NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "stores";

-- CreateTable
CREATE TABLE "Store" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "zipCode" CHAR(9) NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastActivityAt" TIMESTAMPTZ,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Store_ownerId_idx" ON "Store"("ownerId");

-- CreateIndex
CREATE INDEX "Store_isDeleted_idx" ON "Store"("isDeleted");

-- CreateIndex
CREATE INDEX "Store_lastActivityAt_idx" ON "Store"("lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "Store_name_ownerId_key" ON "Store"("name", "ownerId");

-- CreateIndex
CREATE INDEX "AuditLog_storeId_idx" ON "AuditLog"("storeId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_storeUserId_idx" ON "AuditLog"("storeUserId");

-- CreateIndex
CREATE INDEX "AuditLog_isOwner_idx" ON "AuditLog"("isOwner");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Category_storeId_idx" ON "Category"("storeId");

-- CreateIndex
CREATE INDEX "Category_isDeleted_idx" ON "Category"("isDeleted");

-- CreateIndex
CREATE INDEX "Permission_action_resource_idx" ON "Permission"("action", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_resource_key" ON "Permission"("action", "resource");

-- CreateIndex
CREATE INDEX "Product_storeId_idx" ON "Product"("storeId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_stock_idx" ON "Product"("stock");

-- CreateIndex
CREATE INDEX "Product_isDeleted_idx" ON "Product"("isDeleted");

-- CreateIndex
CREATE INDEX "Role_storeId_idx" ON "Role"("storeId");

-- CreateIndex
CREATE INDEX "Role_isDeleted_idx" ON "Role"("isDeleted");

-- CreateIndex
CREATE INDEX "Role_name_idx" ON "Role"("name");

-- CreateIndex
CREATE INDEX "StockMoviment_storeId_idx" ON "StockMoviment"("storeId");

-- CreateIndex
CREATE INDEX "StockMoviment_productId_idx" ON "StockMoviment"("productId");

-- CreateIndex
CREATE INDEX "StockMoviment_isValid_idx" ON "StockMoviment"("isValid");

-- CreateIndex
CREATE INDEX "StockMoviment_isDeleted_idx" ON "StockMoviment"("isDeleted");

-- CreateIndex
CREATE INDEX "StockMovimentStore_storeId_idx" ON "StockMovimentStore"("storeId");

-- CreateIndex
CREATE INDEX "StockMovimentStore_stockMovimentId_idx" ON "StockMovimentStore"("stockMovimentId");

-- CreateIndex
CREATE INDEX "StockMovimentStore_isDeleted_idx" ON "StockMovimentStore"("isDeleted");

-- CreateIndex
CREATE INDEX "StoreUser_roleId_idx" ON "StoreUser"("roleId");

-- CreateIndex
CREATE INDEX "StoreUser_isDeleted_idx" ON "StoreUser"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "StoreUser_email_storeId_key" ON "StoreUser"("email", "storeId");

-- CreateIndex
CREATE INDEX "users_lastActivityAt_idx" ON "users"("lastActivityAt");

-- CreateIndex
CREATE INDEX "users_isDeleted_idx" ON "users"("isDeleted");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreUser" ADD CONSTRAINT "StoreUser_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMoviment" ADD CONSTRAINT "StockMoviment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMoviment" ADD CONSTRAINT "StockMoviment_destinationStoreId_fkey" FOREIGN KEY ("destinationStoreId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovimentStore" ADD CONSTRAINT "StockMovimentStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
