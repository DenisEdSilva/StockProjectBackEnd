-- DropForeignKey
ALTER TABLE "RolePermissionAssociation" DROP CONSTRAINT "RolePermissionAssociation_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "RolePermissionAssociation" DROP CONSTRAINT "RolePermissionAssociation_roleId_fkey";

-- DropIndex
DROP INDEX "Permission_action_resource_idx";

-- CreateTable
CREATE TABLE "UserPermission" (
    "userId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("userId","permissionId")
);

-- AddForeignKey
ALTER TABLE "RolePermissionAssociation" ADD CONSTRAINT "RolePermissionAssociation_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissionAssociation" ADD CONSTRAINT "RolePermissionAssociation_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StoreUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
