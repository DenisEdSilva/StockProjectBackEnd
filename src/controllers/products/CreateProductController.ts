import { Request, Response, NextFunction } from "express";
import { CreateProductService } from "../../services/products/CreateProductService";

class CreateProductController {
    async handle(req: Request, res: Response, next: NextFunction) {
        const { banner, name, stock, price, description, categoryId, storeId } = req.body;
        const userId = req.userId;

        const service = new CreateProductService();
        const product = await service.execute({
            banner,
            name,
            stock,
            price,
            description,
            categoryId,
            storeId,
            userId,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] as string
        });

        return res.status(201).json(product);
    }
}

export { CreateProductController };