import { Request, Response, NextFunction } from "express";
import { UpdateProductService } from "../../services/products/UpdateProductService";

class UpdateProductController {
    constructor(private updateProductService: UpdateProductService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, productId } = req.params;
            const { name, price, description, categoryId, sku } = req.body;

            const product = await this.updateProductService.execute({
                productId: Number(productId),
                storeId: Number(storeId),
                name,
                price: price ? String(price) : undefined,
                description,
                categoryId: categoryId ? Number(categoryId) : undefined,
                sku,
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(200).json(product);
        } catch (error) {
            next(error);
        }
    }
}

export { UpdateProductController };