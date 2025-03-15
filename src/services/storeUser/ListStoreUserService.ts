import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface StoreUserACLResponse {
    id: number;
    name: string;
    email: string;
    permissions: Array<{ action: string; resource: string }>;
}

class ListStoreUserService {
    async execute(storeUserId: number): Promise<StoreUserACLResponse> {
        return await prismaClient.$transaction(async (tx) => {
            if (!storeUserId || isNaN(storeUserId)) {
                throw new ValidationError("ID de usuário inválido");
            }

            const storeUser = await tx.storeUser.findUnique({
                where: { id: storeUserId },
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                include: { permission: true }
                            }
                        }
                    }
                }
            });

            if (!storeUser) throw new NotFoundError("Usuário não encontrado");
            if (storeUser.isDeleted) throw new NotFoundError("Usuário desativado");
            if (!storeUser.role) throw new ValidationError("Perfil não atribuído");

            return {
                id: storeUser.id,
                name: storeUser.name,
                email: storeUser.email,
                permissions: storeUser.role.rolePermissions.map(rp => ({
                    action: rp.permission.action,
                    resource: rp.permission.resource
                }))
            };
        });
    }
}

export { ListStoreUserService };