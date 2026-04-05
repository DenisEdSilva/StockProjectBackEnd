import { ValidationError, NotFoundError } from "../errors";

export interface ACLResponse {
    id: number;
    name: string;
    email: string;
    roleId: number;
    storeId: number;
    permissions: Array<{ action: string; resource: string }>;
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
                                        action: true, 
                                        resource: true 
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });

        if (!user) throw new NotFoundError("StoreUserNotFound");

        const permissions = user.role.permissions.map((rp: any) => ({
            action: rp.permission.action,
            resource: rp.permission.resource
        }));

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