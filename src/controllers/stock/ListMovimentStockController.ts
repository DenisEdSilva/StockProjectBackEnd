import { Request, Response, NextFunction } from "express";
import { ListMovimentStockService } from "../../services/stock/ListMovimentStockService";

class ListMovimentStockController {
    constructor(private listMovimentStockService: ListMovimentStockService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const { id: performedByUserId, type: userType, storeId: tokenStoreId } = req.user;

            const result = await this.listMovimentStockService.execute({
                ...req.query,
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

export { ListMovimentStockController };