import { Request, Response, NextFunction } from "express";
import { UpdateProductService } from "../../services/products/UpdateProductService";

class UpdateProductController {
    constructor(private updateProductService: UpdateProductService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, productId } = req.params;
            const { sku, name, price, description, banner, categoryId } = req.body;

            const userPermissions = req.user.permissions.map(p => 
                `${p.action.toUpperCase()}_${p.resource.toUpperCase()}`
            );

            const product = await this.updateProductService.execute({
                productId: Number(productId),
                storeId: Number(storeId),
                sku,
                name,
                banner,
                price: price ? String(price) : undefined,
                description,
                categoryId: categoryId ? Number(categoryId) : undefined,
                performedByUserId: req.user.id,
                userType: req.user.type,
                userPermissions: userPermissions,
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