import { ValidationError, NotFoundError } from "../errors";

export interface ACLResponse {
    id: number;
    name: string;
    email: string;
    roleId: number;
    storeId: number;
    permissions: Array<{ action: string; resource: string }>;
}

interface PermissionSelect {
    permission: {
        id: number;
        action: string;
        resource: string;
    }
}

class AccessControlProvider {
    async uintToACL(storeUserId: number, tx: any): Promise<ACLResponse> {
        if (!Number.isInteger(storeUserId)) {
            throw new ValidationError("InvalidStoreUserId");
        }

        const user = await tx.storeUser.findUnique({
            where: { 
                id: storeUserId, 
                isDeleted: false 
            },
            select: { 
                id: true,
                name: true,
                email: true,
                roleId: true,
                storeId: true,
                role: {
                    select: {
                        permissions: {
                            select: {
                                permission: {
                                    select: { 
                                        id: true,
                                        action: true, 
                                        resource: true 
                                    }
                                }
                            }
                        }
                    }
                },
                userPermissions: {
                    select: {
                        permission: {
                            select: { 
                                id: true, 
                                action: true, 
                                resource: true
                            }
                        }
                    }
                }
            },
        });

        if (!user) throw new NotFoundError("StoreUserNotFound");

        const allPermissionsMap = new Map<number, { action: string; resource: string }>();

        user.role.permissions.forEach((rp: PermissionSelect) => {
            allPermissionsMap.set(rp.permission.id, {
                action: rp.permission.action,
                resource: rp.permission.resource
            });
        });

        user.userPermissions.forEach((up: PermissionSelect) => {
            allPermissionsMap.set(up.permission.id, {
                action: up.permission.action,
                resource: up.permission.resource
            });
        });

        const permissions = Array.from(allPermissionsMap.values());

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            roleId: user.roleId,
            storeId: user.storeId,
            permissions
        };
    }
}

export { AccessControlProvider };