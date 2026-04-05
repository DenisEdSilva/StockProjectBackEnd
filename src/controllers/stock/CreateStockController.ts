import { Request, Response, NextFunction } from "express";
import { CreateStockService } from "../../services/stock/CreateStockService";

interface AuthRequest extends Request {
    user: {
        id: number;
        type: 'OWNER' | 'STORE_USER';
    }
}

class CreateStockController {
    constructor(private createStockService: CreateStockService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { type, stock, productId, destinationStoreId } = req.body;
            const { storeId } = req.params;
            const { id: performedByUserId, type: userType } = (req as AuthRequest).user;

            const result = await this.createStockService.execute({
                performedByUserId,
                userType,
                storeId: Number(storeId),
                productId: Number(productId),
                type,
                destinationStoreId: destinationStoreId ? Number(destinationStoreId) : undefined,
                stock: Number(stock),
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"]
            });

            return res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { CreateStockController };