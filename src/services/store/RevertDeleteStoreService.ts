import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface RevertDeleteStoreRequest {
    storeId: number;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class RevertDeleteStoreService {
    async execute(data: RevertDeleteStoreRequest) {
        const auditLogService = new CreateAuditLogService();
        const activityTracker = new ActivityTracker();
        return await prismaClient.$transaction(async (tx) => {
            if (!data.storeId || isNaN(data.storeId)) {
                throw new ValidationError("ID da loja inválido");
            }
            
            if (!data.userId || isNaN(data.userId)) {
                throw new ValidationError("ID do usuário inválido");
            }

            const isOwner = await tx.store.findUnique({
                where: { id: data.storeId },
                select: { ownerId: true }
            })

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

            await activityTracker.track({
                tx,
                storeId: data.storeId,
                performedByUserId: data.userId
            })

            await auditLogService.create({
                    action: "STORE_RESTORE",
                    details: {
                        storeId: restoredStore
                    },
                    ...(isOwner ? {
                        userId: data.userId
                    } : {
                        storeUserId: data.userId
                    }),
                    storeId: data.storeId,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
            });

            return restoredStore;
        });
    }

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
}

export { RevertDeleteStoreService };