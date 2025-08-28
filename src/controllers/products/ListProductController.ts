import { Request, Response, NextFunction } from "express";
import { ListProductService } from "../../services/products/ListProductService";

class ListProductController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const { 
                page = 1, 
                pageSize = 10,
                search,
                sku,
                categoryId
            } = req.query;

            const service = new ListProductService();
            const result = await service.execute({ 
                storeId: parseInt(storeId, 10),
                page: Number(page),
                pageSize: Number(pageSize),
                search: search as string,
                sku: sku as string,
                categoryId: categoryId ? Number(categoryId) : undefined
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListProductController };