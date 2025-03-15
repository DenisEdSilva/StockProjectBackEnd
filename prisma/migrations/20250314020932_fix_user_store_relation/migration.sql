/*
  Warnings:

  - You are about to drop the `UserStore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_UserStore` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserStore" DROP CONSTRAINT "UserStore_storeId_fkey";

-- DropForeignKey
ALTER TABLE "UserStore" DROP CONSTRAINT "UserStore_userId_fkey";

-- DropForeignKey
ALTER TABLE "_UserStore" DROP CONSTRAINT "_UserStore_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserStore" DROP CONSTRAINT "_UserStore_B_fkey";

-- DropTable
DROP TABLE "UserStore";

-- DropTable
DROP TABLE "_UserStore";
