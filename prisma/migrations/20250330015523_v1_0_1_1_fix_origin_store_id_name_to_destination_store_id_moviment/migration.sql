/*
  Warnings:

  - You are about to drop the column `originStoreId` on the `StockMoviment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StockMoviment" DROP COLUMN "originStoreId",
ADD COLUMN     "destinationStoreId" INTEGER;
