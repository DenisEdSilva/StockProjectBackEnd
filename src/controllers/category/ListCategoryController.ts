import { Request, Response, NextFunction } from "express";
import { ListCategoryService } from "../../services/category/ListCategoryService";

class ListCategoryController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const { 
                page = 1, 
                pageSize = 10,
                search
            } = req.query;

            const service = new ListCategoryService();
            const result = await service.execute({ 
                storeId: parseInt(storeId, 10),
                page: Number(page),
                pageSize: Number(pageSize),
                search: search as string
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListCategoryController };