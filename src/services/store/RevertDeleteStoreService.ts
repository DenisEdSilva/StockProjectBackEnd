import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from "../../errors";

interface RevertDeleteStoreRequest {
    storeId: number;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class RevertDeleteStoreService {
    private async restoreRelatedRecords(storeId: number, tx: any) {
        const models = [
            'stockMovimentStore',
            'stockMoviment',
            'product',
            'category',
            'storeUser',
            'role'
        ];

        await Promise.all(models.map(model => 
            tx[model].updateMany({
                where: { storeId },
                data: { isDeleted: false, deletedAt: null }
            })
        ));
    }

    async execute(data: RevertDeleteStoreRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!data.storeId || isNaN(data.storeId)) {
                throw new ValidationError("ID da loja inválido");
            }
            
            if (!data.userId || isNaN(data.userId)) {
                throw new ValidationError("ID do usuário inválido");
            }

            const store = await tx.store.findUnique({
                where: { id: data.storeId },
                select: { ownerId: true, isDeleted: true }
            });

            if (!store) throw new NotFoundError("Loja não encontrada");
            if (!store.isDeleted) throw new ConflictError("Loja não está marcada para exclusão");
            if (store.ownerId !== data.userId) throw new ForbiddenError("Acesso não autorizado");

            await this.restoreRelatedRecords(data.storeId, tx);

            const restoredStore = await tx.store.update({
                where: { id: data.storeId },
                data: { isDeleted: false, deletedAt: null }
            });

            await tx.auditLog.create({
                data: {
                    action: "STORE_RESTORED",
                    details: JSON.stringify({ storeId: data.storeId }),
                    userId: data.userId,
                    storeId: data.storeId,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
                }
            });

            return restoredStore;
        });
    }
}

export { RevertDeleteStoreService };