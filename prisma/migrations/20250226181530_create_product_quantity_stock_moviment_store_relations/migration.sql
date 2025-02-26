/*
  Warnings:

  - Added the required column `storeId` to the `ProductQuantity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `StockMoviment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductQuantity" ADD COLUMN     "storeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StockMoviment" ADD COLUMN     "storeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ProductQuantityStore" (
    "id" TEXT NOT NULL,
    "productQuantityId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "ProductQuantityStore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovimentStore" (
    "id" TEXT NOT NULL,
    "stockMovimentId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "StockMovimentStore_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductQuantity" ADD CONSTRAINT "ProductQuantity_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductQuantityStore" ADD CONSTRAINT "ProductQuantityStore_productQuantityId_fkey" FOREIGN KEY ("productQuantityId") REFERENCES "ProductQuantity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductQuantityStore" ADD CONSTRAINT "ProductQuantityStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMoviment" ADD CONSTRAINT "StockMoviment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovimentStore" ADD CONSTRAINT "StockMovimentStore_stockMovimentId_fkey" FOREIGN KEY ("stockMovimentId") REFERENCES "StockMoviment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovimentStore" ADD CONSTRAINT "StockMovimentStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
