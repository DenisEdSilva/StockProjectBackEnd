import { Request, Response, NextFunction } from "express";
import { UpdateCategoryService } from "../../services/category/UpdateCategoryService";

class UpdateCategoryController {
    constructor(private updateCategoryService: UpdateCategoryService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, categoryId } = req.params;
            const { name } = req.body;

            const updatedCategory = await this.updateCategoryService.execute({
                storeId: Number(storeId),
                categoryId: Number(categoryId),
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                name,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(200).json(updatedCategory);
        } catch (error) {
            next(error);
        }
    }
}

export { UpdateCategoryController };