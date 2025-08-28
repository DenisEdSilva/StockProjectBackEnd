import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";

interface DeleteUserRequest {
    id: number;
}

class DeleteUserService {
    async execute({ id }: DeleteUserRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!id || isNaN(id)) {
                throw new ValidationError("ID de usuário inválido");
            }

            const user = await tx.user.findUnique({
                where: { id },
                include: {
                    ownedStores: {
                        include: {
                            categories: true,
                            products: true,
                            stockMovimentsOrigin: true,
                            stockMovimentsDestination: true,
                            StockMovimentStore: true
                        }
                    }
                }
            });

            if (!user) {
                throw new NotFoundError("Usuário não encontrado");
            }

            if (!user.isOwner) {
                throw new ForbiddenError("Usuários proprietários requerem um processo de exclusão especial");
            }

            const gracePeriod = process.env.DELETION_GRACE_PERIOD 
                ? parseInt(process.env.DELETION_GRACE_PERIOD)
                : 30;

            if (isNaN(gracePeriod)) {
                throw new ValidationError("Período de graça para exclusão inválido");
            }

            const deletionDate = new Date();
            deletionDate.setMinutes(deletionDate.getMinutes() + gracePeriod);

            await tx.user.update({
                where: { id },
                data: { markedForDeletionAt: deletionDate }
            });

            await Promise.all([
                prismaClient.user.update({
                    where: { 
                        id: user.id 
                    },
                    data: { 
                        lastActivityAt: new Date() 
                    }
                })
            ])   

            await tx.auditLog.create({
                data: {
                    action: "USER_MARKED_FOR_DELETION",
                    details: JSON.stringify({ userId: id, scheduledDeletion: deletionDate }),
                    userId: id,
                    ipAddress: "system",
                    userAgent: "cron-job",
                    isOwner: true
                }
            });

            return { 
                message: "Usuário marcado para exclusão",
                scheduledDeletion: deletionDate 
            };
        });
    }
}

export { DeleteUserService };