import { Request, Response, NextFunction } from "express";
import { ListCategoryService } from "../../services/category/ListCategoryService";

class ListCategoryController {
    async handle(req: Request, res: Response, next: NextFunction) {
        const storeId = parseInt(req.params.storeId, 10);

        const service = new ListCategoryService();
        const categories = await service.execute(storeId);

        return res.status(200).json(categories);
    }
}

export { ListCategoryController };