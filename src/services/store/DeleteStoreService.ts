import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";

interface DeleteStoreRequest {
    storeId: number;
    ownerId: number;
    ipAddress: string;
    userAgent: string;
}

class DeleteStoreService {
    async execute(data: DeleteStoreRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!data.storeId || isNaN(data.storeId)) {
                throw new ValidationError("ID da loja inválido");
            }
            
            if (!data.ownerId || isNaN(data.ownerId)) {
                throw new ValidationError("ID do proprietário inválido");
            }

            const store = await tx.store.findUnique({
                where: { id: data.storeId },
                select: { ownerId: true }
            });

            if (!store) throw new NotFoundError("Loja não encontrada");
            if (store.ownerId !== data.ownerId) throw new ForbiddenError("Acesso não autorizado");

            await this.softDeleteRelatedRecords(data.storeId, tx);

            const deletedStore = await tx.store.update({
                where: { id: data.storeId },
                data: { isDeleted: true, deletedAt: new Date() }
            });

            await tx.auditLog.create({
                data: {
                    action: "STORE_DELETED",
                    details: JSON.stringify({ storeId: data.storeId, deletionType: "SOFT_DELETE" }),
                    userId: data.ownerId,
                    storeId: data.storeId,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
                }
            });

            return { 
                message: "Loja marcada para exclusão",
                deletionDate: deletedStore.deletedAt 
            };
        });
    }

    private async softDeleteRelatedRecords(storeId: number, tx: any) {
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
                data: { isDeleted: true, deletedAt: new Date() }
            })
        ));
    }
}

export { DeleteStoreService };