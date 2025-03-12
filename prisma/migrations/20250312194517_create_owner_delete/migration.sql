/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "deletedAt",
DROP COLUMN "isDeleted",
ADD COLUMN     "markedForDeletionAt" TIMESTAMP(3);
