import { Request, Response, NextFunction } from "express";
import { UpdateCategoryService } from "../../services/category/UpdateCategoryService";

class UpdateCategoryController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const {storeId, categoryId } = req.params;
            const performedByUserId = req.user.id;
            const { name } = req.body;
    
            const service = new UpdateCategoryService();
            const updatedCategory = await service.execute({
                storeId: parseInt(storeId, 10),
                categoryId: parseInt(categoryId, 10),
                performedByUserId,
                name,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });
    
            return res.status(200).json(updatedCategory);
        } catch (error) {
            next(error);
        }
    }
}

export { UpdateCategoryController };