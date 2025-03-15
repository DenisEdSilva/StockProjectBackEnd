import { Request, Response, NextFunction } from "express";
import { UpdateProductService } from "../../services/products/UpdateProductService";

class UpdateProductController {
    async handle(req: Request, res: Response, next: NextFunction) {
        const id = parseInt(req.params.id, 10);
        const { name, price, description, categoryId } = req.body;
        const userId = req.userId;

        const service = new UpdateProductService();
        const product = await service.execute({
            id,
            name,
            price,
            description,
            categoryId,
            userId,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] as string
        });

        return res.status(200).json(product);
    }
}

export { UpdateProductController };