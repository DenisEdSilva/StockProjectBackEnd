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

      if (!wrongMoviment) {
        throw new Error("Moviment not found");
      }

      const product = await prismaClient.product.findUnique({
        where: {
          id: wrongMoviment.productId
        }
      })

      if (!product) {
        throw new Error("Product not found");
      }

      const store = await prismaClient.store.findUnique({
        where: {
          id: wrongMoviment.storeId
        }
      })

      if (!store) {
        throw new Error("Store not found");
      }

      const result = await prismaClient.$transaction(async (prisma) => {
        const newMoviment = await prisma.stockMoviment.create({
          data: {
            productId: wrongMoviment.productId,
            type: wrongMoviment.type === 'entrada' ? 'saida' : 'entrada',
            stock: wrongMoviment.stock,
            storeId: wrongMoviment.storeId
          }
        })
    
        const updatedProduct = await prisma.product.update({
          where: {
            id: wrongMoviment.productId
          },
          data: {
            stock: {
              increment: newMoviment.type === 'entrada' ? newMoviment.stock : -newMoviment.stock
            }
          }
        })
    
        await prisma.stockMoviment.update({
          where: {
            id: wrongMovimentId
          },
          data: {
            isValid: false
          }
        })

        return { newMoviment, updatedProduct };


      })
      
    } catch (error) {
      console.log(error)
      console.log("Error on revert stock moviment", error)
      throw new Error(`Error on revert stock moviment. Error: ${error.message}`);
    }
  } 
}

export { RevertStockService }