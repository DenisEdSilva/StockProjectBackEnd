import { Request, Response, NextFunction } from "express";
import { RevertStockService } from "../../services/stock/RevertStockService";

class RevertStockController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { movementId, storeId } = req.params;
            const performedByUserId = req.user.id;
    
            const service = new RevertStockService();
            const result = await service.execute({
                performedByUserId,
                movementId: parseInt(movementId, 10),
                storeId: parseInt(storeId, 10),
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });
    
            return res.status(200).json(result);
        } catch (error) {
            next(error);    
        }
    }
}

export { RevertStockController };