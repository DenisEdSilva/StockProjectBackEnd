import prismaClient from "../../prisma";
import { ValidationError, ConflictError, NotFoundError, UnauthorizedError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";

interface CategoryRequest {
    performedByUserId: number;
    name: string;
    storeId: number;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class CreateCategoryService {
    async execute({ performedByUserId, name, storeId, userId, ipAddress, userAgent }: CategoryRequest) {
        const auditLogService = new CreateAuditLogService();
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(name, storeId);

            const storeData = await tx.store.findUnique({
                            where: { id: storeId },
                            select: { ownerId: true }
                        });
            
                        const isOwner = storeData.ownerId === performedByUserId;
            
                        if (!isOwner) {
                            const storeUserPerformer = await tx.storeUser.findUnique({
                                where: {
                                    id: performedByUserId,
                                    storeId: storeId,
                                    isDeleted: false
                                }
                            });
                            
                            if (!storeUserPerformer) {
                                throw new UnauthorizedError("Usuário não autorizado");
                            }
                        }

            const [store, existingCategory] = await Promise.all([
                tx.store.findUnique({ where: { id: storeId } }),
                tx.category.findFirst({ where: { name, storeId, isDeleted: false } })
            ]);

            if (!store) throw new NotFoundError("Loja não encontrada");
            if (existingCategory) throw new ConflictError("Categoria já existe");

            const category = await tx.category.create({
                data: { name, storeId },
                select: { id: true, name: true, createdAt: true }
            });

            const isOwnerAction = await tx.user.findUnique({ 
                where: { 
                    id: userId 
                },
                select: {
                    id: true,
                }
            });

            const updates = [];

            updates.push(
                tx.store.update({
                    where: { id: storeId },
                    data: {
                        lastActivityAt: new Date(),
                    }
                })
            );
            
            if (isOwnerAction) {
                updates.push(
                    tx.user.update({
                        where: { id: userId },
                        data: {
                            lastActivityAt: new Date(),
                        }
                    })
                )
            }

            await Promise.all(updates);

            await auditLogService.create({
                    action: "CATEGORY_CREATE",
                    details: {
                        id: category.id,
                        name: category.name
                    },
                    ...(isOwner ? {
                        userId: performedByUserId,
                    } : {
                        storeUserId: performedByUserId
                    }),
                    storeId,
                    ipAddress,
                    userAgent
            });

            return category;
        });
    }

    private validateInput(name: string, storeId: number) {
        if (!name?.trim()) throw new ValidationError("Nome da categoria inválido");
        if (!storeId || isNaN(storeId)) throw new ValidationError("ID da loja inválido");
    }
}

export { CreateCategoryService };