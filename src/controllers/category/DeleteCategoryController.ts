import { Request, Response, NextFunction } from "express";
import { DeleteCategoryService } from "../../services/category/DeleteCategoryService";

class DeleteCategoryController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, categoryId } = req.params;
            const performedByUserId = req.userId;
    
            const service = new DeleteCategoryService();
            const result = await service.execute({
                performedByUserId,
                storeId: parseInt(storeId, 10),
                categoryId: parseInt(categoryId, 10),
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });
    
            return res.status(200).json(result);
        } catch (error) {
            next(error);    
        }
    }
}

export { DeleteCategoryController };