import { Request, Response, NextFunction } from "express";
import { DeleteProductService } from "../../services/products/DeleteProductService";

class DeleteProductController {
    constructor(private deleteProductService: DeleteProductService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, productId } = req.params;

            const result = await this.deleteProductService.execute({
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                storeId: Number(storeId),
                productId: Number(productId),
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { DeleteProductController };