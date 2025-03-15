import { Request, Response, NextFunction } from "express";
import { RevertStockService } from "../../services/stock/RevertStockService";

class RevertStockController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const wrongMovimentId = parseInt(req.params.movimentId, 10);
            const userId = req.userId;
    
            const service = new RevertStockService();
            const result = await service.execute({
                wrongMovimentId,
                userId,
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