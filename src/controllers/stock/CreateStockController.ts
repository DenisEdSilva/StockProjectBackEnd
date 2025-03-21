import { Request, Response, NextFunction } from "express";
import { CreateStockService } from "../../services/stock/CreateStockService";

class CreateStockController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { type, stock } = req.body;
            const { storeId, productId } = req.params;
            const performedByUserId = req.user.id;
    
            const service = new CreateStockService();
            const result = await service.execute({
                performedByUserId,
                storeId: parseInt(storeId, 10),
                productId: parseInt(productId, 10),
                type,
                stock,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });
    
            return res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { CreateStockController };