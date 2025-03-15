import { Request, Response, NextFunction } from "express";
import { ListMovimentStockService } from "../../services/stock/ListMovimentStockService";

class ListMovimentStockController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const storeId = parseInt(req.params.storeId, 10);
            const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
    
            const service = new ListMovimentStockService();
            const result = await service.execute({ storeId, productId });
    
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListMovimentStockController };