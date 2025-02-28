import prismaClient from "../../prisma";

interface StockRequest {
  wrongMovimentId: number
}

class RevertStockService {
  async execute({ wrongMovimentId }: StockRequest) {
    try {
      const wrongMoviment = await prismaClient.stockMoviment.findUnique({
        where: {
          id: wrongMovimentId
        }
      })
  
      const newMoviment = await prismaClient.stockMoviment.create({
        data: {
          productId: wrongMoviment.productId,
          type: wrongMoviment.type === 'entrada' ? 'saida' : 'entrada',
          stock: wrongMoviment.stock,
          storeId: wrongMoviment.storeId
        }
      })
  
      await prismaClient.product.update({
        where: {
          id: wrongMoviment.productId
        },
        data: {
          stock: {
            increment: newMoviment.type === 'entrada' ? newMoviment.stock : -newMoviment.stock
          }
        }
      })
  
      await prismaClient.stockMoviment.update({
        where: {
          id: wrongMovimentId
        },
        data: {
          isValid: false
        }
      })
    } catch (err) {
      console.log(err)
      throw new Error("Error on revert stock moviment");
    }
  } 
}

export { RevertStockService }