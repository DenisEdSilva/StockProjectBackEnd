import { Request, Response, NextFunction } from "express";
import { GetProductByIdService } from "../../services/products/GetProductByIdService";

class GetProductByIdController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, productId } = req.params;

            const service = new GetProductByIdService();
            const result = await service.execute({
                storeId: parseInt(storeId, 10),
                id: parseInt(productId, 10)
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { GetProductByIdController }