// ListMovimentStockService.ts
import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface MovimentRequest {
  storeId: number;
  type?: 'entrada' | 'saida' | 'transferencia';
  productId?: number;
  createdBy?: number;
  destinationStoreId?: number;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

class ListMovimentStockService {
  async execute(params: MovimentRequest) {
    return await prismaClient.$transaction(async (tx) => {
      const { storeId, page = 1, pageSize = 10, ...filters } = params;
      
      if (!storeId || isNaN(storeId)) throw new ValidationError("ID da loja inválido");

      const store = await tx.store.findUnique({ where: { id: storeId } });
      if (!store) throw new NotFoundError("Loja não encontrada");

      const whereClause = {
        storeId,
        isValid: true,
        ...(filters.type && { type: filters.type }),
        ...(filters.productId && { productId: filters.productId }),
        ...(filters.createdBy && { createdBy: filters.createdBy }),
        ...(filters.destinationStoreId && filters.destinationStoreId.toString() !== "all" && {
          destinationStoreId: Number(filters.destinationStoreId),
        }),
        createdAt: {
          ...(filters.startDate && { gte: new Date(filters.startDate) }),
          ...(filters.endDate && { lte: new Date(filters.endDate) })
        }
      };

      const [movements, total] = await Promise.all([
        tx.stockMoviment.findMany({
          where: whereClause,
          select: {
            id: true,
            type: true,
            stock: true,
            destinationStoreId: true,
            createdBy: true,
            createdAt: true,
            product: { select: { name: true, banner: true } },
            destinationStore: { select: { id: true, name: true } }
          },
          orderBy: { id: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize
        }),
        tx.stockMoviment.count({ where: whereClause })
      ]);

      return {
        data: movements,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    });
  }
}

export { ListMovimentStockService };