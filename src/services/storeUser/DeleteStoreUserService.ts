import prismaClient from "../../prisma";
import { 
    ValidationError, 
    NotFoundError 
} from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface DeleteRequest {
    performedByUserId: number;
    storeId: number;
    storeUserId: number;
    ipAddress: string;
    userAgent: string;
}

class DeleteStoreUserService {
    async execute(data: DeleteRequest) {
        const auditLogService = new CreateAuditLogService();
        const activityTracker = new ActivityTracker();
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);

            const isOwner = await tx.store.findUnique({
                where: { 
                    id: data.storeId 
                },
                select: { 
                    ownerId: true 
                }
            });

            const user = await tx.storeUser.findUnique({
                where: { id: data.storeUserId, storeId: data.storeId }
            });

            if (!user) throw new NotFoundError("Usuário não encontrado");
            if (user.isDeleted) throw new NotFoundError("Usuário já desativado");

            const deletedUser = await tx.storeUser.update({
                where: { id: data.storeUserId },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedBy: data.performedByUserId
                }
            });

            await activityTracker.track({
                tx,
                storeId: data.storeId,
                performedByUserId: data.performedByUserId
            })

            const deletedData = await tx.storeUser.findUnique({ where: { id: data.storeUserId } });

            await auditLogService.create({
                action: "STORE_USER_DELETE",
                details: {
                    deletedData
                },
                ...(isOwner ? {
                    userId: data.performedByUserId,
                } : {
                    storeUserId: data.performedByUserId
                }),
                storeId: data.storeId,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
            });

            return { 
                message: "Usuário excluído",
                deletedAt: deletedUser.deletedAt
            };
        }, {
            maxWait: 15000,
            timeout: 15000
        });
    }
    
    private validateInput(data: DeleteRequest) {
        if (!data.storeUserId || isNaN(data.storeUserId)) throw new ValidationError("ID inválido");
        if (!data.storeId || isNaN(data.storeId)) throw new ValidationError("ID da loja inválido");
        if (!data.performedByUserId || isNaN(data.performedByUserId)) throw new ValidationError("ID do executor inválido");
    }
}

export { DeleteStoreUserService };