import { Request, Response, NextFunction } from "express";
import { CreateProductService } from "../../services/products/CreateProductService";

class CreateProductController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { banner, name, stock, price, description, categoryId } = req.body;
            const performedByUserId = req.user.id;
            const { storeId } = req.params;
    
            const service = new CreateProductService();
            const product = await service.execute({
                banner,
                name,
                stock,
                price,
                description,
                categoryId,
                storeId: parseInt(storeId, 10),
                performedByUserId,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });
    
            return res.status(201).json(product);
        } catch (error) {
            next(error);    
        }
    }
}

export { CreateProductController };