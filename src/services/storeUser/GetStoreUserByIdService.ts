import prismaClient from "../../prisma";
import { NotFoundError, ValidationError } from "../../errors";

interface GetStoreUserRequest {
    storeId: number;
    storeUserId: number;
}

class GetStoreUserByIdService {
    async execute(data: GetStoreUserRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!data.storeId || isNaN(data.storeId)) {
                throw new ValidationError("ID da loja inválido");
            }

            if (!data.storeUserId || isNaN(data.storeUserId)) {
                throw new ValidationError("ID do usuário da loja inválido");
            }

            const storeUser = await tx.storeUser.findUnique({
                where: {
                    id: data.storeUserId,
                    storeId: data.storeId
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    roleId: true,
                    storeId: true,
                    createdAt: true,
                    updatedAt: true,
                    deletedAt: true,
                    isDeleted: true,
                }
            });

            if (!storeUser) {
                throw new NotFoundError("Usuário da loja nao encontrado");
            }

            return storeUser;
        });
    }
}

export { GetStoreUserByIdService };