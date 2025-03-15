/*
  Warnings:

  - Added the required column `deletedBy` to the `StoreUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StoreUser" ADD COLUMN     "deletedBy" INTEGER NOT NULL;
