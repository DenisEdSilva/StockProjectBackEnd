import { Request, Response, NextFunction } from "express";
import { RevertStockService } from "../../services/stock/RevertStockService";

class RevertStockController {
    constructor(private revertStockService: RevertStockService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { movementId, storeId } = req.params;
            const { id: performedByUserId, type: userType, storeId: tokenStoreId } = req.user;

            const result = await this.revertStockService.execute({
                movementId,
                storeId,
                performedByUserId,
                userType,
                tokenStoreId,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"]
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { RevertStockController };