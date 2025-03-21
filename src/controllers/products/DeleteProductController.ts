import { Request, Response, NextFunction } from "express";
import { DeleteProductService } from "../../services/products/DeleteProductService";

class DeleteProductController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, categoryId, productId, } = req.params;
            const performedByUserId = req.user.id;
    
            const service = new DeleteProductService();
            const result = await service.execute({
                performedByUserId,
                storeId: parseInt(storeId, 10),
                categoryId: parseInt(categoryId, 10),
                productId: parseInt(productId, 10),
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });
    
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { DeleteProductController };