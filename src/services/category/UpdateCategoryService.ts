import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";

interface UpdateCategoryRequest {
    storeId: number;
    categoryId: number;
    performedByUserId: number;
    name: string;
    ipAddress: string;
    userAgent: string;
}

class UpdateCategoryService {
    async execute({ storeId, categoryId, performedByUserId, name, ipAddress, userAgent }: UpdateCategoryRequest) {
        const auditLogService = new CreateAuditLogService();
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(name);
            if (!storeId || isNaN(storeId)) throw new ValidationError("storeId da categoria inválido");

            const isOwner = await tx.store.findUnique({
                where: { 
                    id: storeId 
                },
                select: {
                    ownerId: true
                }
            });

            const category = await tx.category.findUnique({ where: { id: categoryId } });
            if (!category) throw new NotFoundError("Categoria não encontrada");
            if (category.isDeleted) throw new ConflictError("Categoria excluída");

            const updatedCategory = await tx.category.update({
                where: { id: categoryId },
                data: { name },
                select: { storeId: true, name: true, updatedAt: true }
            });

            await auditLogService.create({
                action: "CATEGORY_UPDATE",
                details: {
                    oldName: category.name,
                    newName: updatedCategory.name
                },
                ...(isOwner ? {
                    userId: performedByUserId
                } : {
                    storeUserId: performedByUserId
                }),
                storeId: category.storeId,
                ipAddress,
                userAgent
            });

            return updatedCategory;
        });
    }

    private validateInput(name: string) {
        if (!name?.trim()) throw new ValidationError("Nome inválido");
        if (name.length > 50) throw new ValidationError("Nome muito longo (máx. 50 caracteres)");
    }
}

export { UpdateCategoryService };