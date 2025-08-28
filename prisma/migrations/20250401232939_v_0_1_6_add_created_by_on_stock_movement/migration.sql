/*
  Warnings:

  - Added the required column `createdBy` to the `StockMoviment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StockMoviment" ADD COLUMN     "createdBy" INTEGER NOT NULL;
