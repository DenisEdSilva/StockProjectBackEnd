import { Request, Response, NextFunction } from "express";
import { ListMovimentStockService } from "../../services/stock/ListMovimentStockService";

class ListMovimentStockController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, productId } = req.params;
    
            const service = new ListMovimentStockService();
            const result = await service.execute({ 
                storeId: parseInt(storeId, 10),
                productId: productId ? parseInt(productId, 10) : undefined});
    
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListMovimentStockController };