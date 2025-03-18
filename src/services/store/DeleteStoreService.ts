import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";

interface DeleteStoreRequest {
    performedByUserId: number;
    storeId: number;
    ipAddress: string;
    userAgent: string;
}

class DeleteStoreService {
    async execute(data: DeleteStoreRequest) {
        const auditLogService = new CreateAuditLogService();
        return await prismaClient.$transaction(async (tx) => {

            const isOwner = await tx.store.findUnique({
                where: { id: data.storeId },
                select: { ownerId: true }
            })

            if (!data.storeId || isNaN(data.storeId)) {
                throw new ValidationError("ID da loja inválido");
            }
            
            if (!data.performedByUserId || isNaN(data.performedByUserId)) {
                throw new ValidationError("ID do proprietário inválido");
            }

            const store = await tx.store.findUnique({
                where: { id: data.storeId },
                select: { ownerId: true }
            });

            if (!store) throw new NotFoundError("Loja não encontrada");
            if (store.ownerId !== data.performedByUserId) throw new ForbiddenError("Acesso não autorizado");

            await this.softDeleteRelatedRecords(data.storeId, tx);

            const deletedStore = await tx.store.update({
                where: { id: data.storeId },
                data: { isDeleted: true, deletedAt: new Date() }
            });

            const deletedData = await tx.store.findUnique({ where: { id: data.storeId } });

            await auditLogService.create({
                action: "STORE_DELETE",
                details: {
                    deletedData
                },
                ...(isOwner ? {
                    userId: data.performedByUserId
                } : {
                    storeUserId: data.performedByUserId
                }),
                storeId: data.storeId,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
            });

            return { 
                message: "Loja marcada para exclusão",
                deletionDate: deletedStore.deletedAt 
            };
        }, {
            maxWait: 15000,
            timeout: 15000
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