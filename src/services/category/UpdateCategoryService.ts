import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError } from "../../errors";

interface UpdateCategoryRequest {
    id: number;
    name: string;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class UpdateCategoryService {
    private validateInput(name: string) {
        if (!name?.trim()) throw new ValidationError("Nome inválido");
        if (name.length > 50) throw new ValidationError("Nome muito longo (máx. 50 caracteres)");
    }

    async execute({ id, name, userId, ipAddress, userAgent }: UpdateCategoryRequest) {
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(name);
            if (!id || isNaN(id)) throw new ValidationError("ID da categoria inválido");

            const category = await tx.category.findUnique({ where: { id } });
            if (!category) throw new NotFoundError("Categoria não encontrada");
            if (category.isDeleted) throw new ConflictError("Categoria excluída");

            const updatedCategory = await tx.category.update({
                where: { id },
                data: { name },
                select: { id: true, name: true, updatedAt: true }
            });

            await tx.auditLog.create({
                data: {
                    action: "CATEGORY_UPDATED",
                    details: JSON.stringify({
                        oldName: category.name,
                        newName: updatedCategory.name
                    }),
                    userId,
                    storeId: category.storeId,
                    ipAddress,
                    userAgent
                }
            });

            return updatedCategory;
        });
    }
}

export { UpdateCategoryService };