import { Request, Response, NextFunction } from "express";
import { UpdateProductService } from "../../services/products/UpdateProductService";

class UpdateProductController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const performedByUserId = req.user.id;
            const { storeId, productId, categoryId } = req.params;
            const { name, price, description } = req.body;
    
            const service = new UpdateProductService();
            const product = await service.execute({
                categoryId: parseInt(categoryId, 10),
                productId: parseInt(productId, 10),
                storeId: parseInt(storeId, 10),
                name,
                price,
                description,
                performedByUserId,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });
    
            return res.status(200).json(product);
        } catch (error) {
            next(error);
        }
    }
}

export { UpdateProductController };