import prismaClient from "../../prisma";

interface StockRequest {
  id: number;
  stock: number;
  type: string;
}

class UpdateStockService {
  async execute({ id, stock, type }: StockRequest) {
    if (type !== 'entrada' && type !== 'saida') {
      throw new Error('Tipo de movimentação inválido');
    }

    const stockMoviment = await prismaClient.stockMoviment.update({
      where: {
        id: id
      },
      data: {
        stock: stock,
        type: type,
      }
    })

    return stockMoviment
  }
}

export { UpdateStockService }