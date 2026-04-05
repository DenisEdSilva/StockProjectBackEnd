import { Request, Response, NextFunction } from "express";
import { GetProductByIdService } from "../../services/products/GetProductByIdService";

class GetProductByIdController {
    constructor(private getProductByIdService: GetProductByIdService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, productId } = req.params;

            const product = await this.getProductByIdService.execute({
                storeId: Number(storeId),
                id: Number(productId),
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId
            });

            return res.status(200).json(product);
        } catch (error) {
            next(error);
        }
    }
}

export { GetProductByIdController };