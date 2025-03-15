import { Request, Response, NextFunction } from "express";
import { CreateStockService } from "../../services/stock/CreateStockService";

class CreateStockController {
    async handle(req: Request, res: Response, next: NextFunction) {
        const { productId, type, stock } = req.body;
        const storeId = parseInt(req.params.storeId, 10);
        const userId = req.userId;

        const service = new CreateStockService();
        const result = await service.execute({
            productId,
            type,
            stock,
            storeId,
            userId,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] as string
        });

        return res.status(201).json(result);
    }
}

export { CreateStockController };