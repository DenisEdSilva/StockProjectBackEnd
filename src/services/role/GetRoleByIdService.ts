import prismaClient from "../../prisma";
import { ValidationError } from "../../errors";

interface GetRoleRequest {
    id: number
    storeId: number
}

class GetRoleByIdService {
    async execute(data: GetRoleRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!data.id || isNaN(data.id)) {
                throw new ValidationError("ID do papel inválido")
            }
            
            if (!data.storeId || isNaN(data.storeId)) {
                throw new ValidationError("ID da loja inválido")
            }

            const store = await tx.store.findUnique({ 
                where: { 
                    id: data.storeId,
                } 
            });

            if (!store) {
                throw new ValidationError("Loja nao encontrada");
            }

            const role = await tx.role.findUnique({
                where: { 
                    id: data.id,
                    storeId: data.storeId
                },
                include: {
                    permissions: {
                        include: {
                            permission: {
                                select: {
                                    id: true
                                }
                            }
                        }
                    }
                }
            });

            if (!role) {
                throw new ValidationError("Papel nao encontrado");
            }

            return role
        })
    }
}

export { GetRoleByIdService };