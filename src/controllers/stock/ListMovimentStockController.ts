// ListMovimentStockController.ts
import { Request, Response, NextFunction } from "express";
import { ListMovimentStockService } from "../../services/stock/ListMovimentStockService";
import { parseISO } from 'date-fns';

class ListMovimentStockController {
  async handle(req: Request, res: Response, next: NextFunction) {
    try {
      const { storeId } = req.params;
      const { 
        page = 1, 
        pageSize = 10,
        type,
        productId,
        createdBy,
        destinationStoreId,
        startDate,
        endDate
      } = req.query;

      const service = new ListMovimentStockService();
      const result = await service.execute({ 
        storeId: parseInt(storeId, 10),
        page: Number(page),
        pageSize: Number(pageSize),
        ...(type && { type: type as 'entrada' | 'saida' | 'transferencia' }),
        ...(productId && { productId: Number(productId) }),
        ...(createdBy && { createdBy: Number(createdBy) }),
        ...(destinationStoreId && { destinationStoreId: Number(destinationStoreId) }),
        ...(startDate && { startDate: parseISO(startDate as string) }),
        ...(endDate && { endDate: parseISO(endDate as string) })
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export { ListMovimentStockController };