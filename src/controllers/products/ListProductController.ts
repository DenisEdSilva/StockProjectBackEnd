import { Request, Response, NextFunction } from "express";
import { ListProductService } from "../../services/products/ListProductService";

class ListProductController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const storeId = parseInt(req.params.storeId, 10);
            const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    
            const service = new ListProductService();
            const products = await service.execute({ storeId, categoryId });
    
            return res.status(200).json(products);
        } catch (error) {
            next(error);    
        }
    }
}

export { ListProductController };