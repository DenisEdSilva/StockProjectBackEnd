import prismaClient from "../../prisma";
import { ValidationError, ConflictError, NotFoundError } from "../../errors";

interface CategoryRequest {
    name: string;
    storeId: number;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class CreateCategoryService {
    private validateInput(name: string, storeId: number) {
        if (!name?.trim()) throw new ValidationError("Nome da categoria inválido");
        if (!storeId || isNaN(storeId)) throw new ValidationError("ID da loja inválido");
    }

    async execute({ name, storeId, userId, ipAddress, userAgent }: CategoryRequest) {
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(name, storeId);

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

            await tx.auditLog.create({
                data: {
                    action: "CATEGORY_CREATED",
                    details: JSON.stringify(category),
                    userId,
                    storeId,
                    ipAddress,
                    userAgent
                }
            });

            return category;
        });
    }
}

export { CreateCategoryService };