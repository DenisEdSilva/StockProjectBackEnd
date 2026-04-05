/*
  Warnings:

  - The values [CREATE,READ,UPDATE,FETCH] on the enum `PermissionAction` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PermissionAction_new" AS ENUM ('POST', 'GET', 'PUT', 'PATCH', 'DELETE');
ALTER TABLE "Permission" ALTER COLUMN "action" TYPE "PermissionAction_new" USING ("action"::text::"PermissionAction_new");
ALTER TYPE "PermissionAction" RENAME TO "PermissionAction_old";
ALTER TYPE "PermissionAction_new" RENAME TO "PermissionAction";
DROP TYPE "PermissionAction_old";
COMMIT;
