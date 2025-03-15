import { Request, Response, NextFunction } from "express";
import { ListCategoryService } from "../../services/category/ListCategoryService";

class ListCategoryController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const storeId = parseInt(req.params.storeId, 10);

            const service = new ListCategoryService();
            const categories = await service.execute(storeId);
    
            return res.status(200).json(categories);
        } catch (error) {
            next(error);
        }
    }
}

export { ListCategoryController };