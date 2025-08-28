import { Request, Response, NextFunction } from "express";
import { GetCategoryByIdService } from "../../services/category/GetCategoryByIdService";

class GetCategoryByIdController {
    async handle(req: Request, res: Response, next: NextFunction) {
        const storeId = parseInt(req.params.storeId, 10);
        const categoryId = parseInt(req.params.categoryId, 10);

        const service = new GetCategoryByIdService();
        try {
            const category = await service.execute({ 
                storeId, 
                id: categoryId 
            });
            return res.status(200).json(category);
        } catch (error) {
            next(error);
        }
    }
}

export { GetCategoryByIdController };