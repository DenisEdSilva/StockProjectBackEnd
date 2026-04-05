import { Request, Response, NextFunction } from "express";
import { DeleteCategoryService } from "../../services/category/DeleteCategoryService";

class DeleteCategoryController {
    constructor(private deleteCategoryService: DeleteCategoryService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, categoryId } = req.params;

            const result = await this.deleteCategoryService.execute({
                storeId: Number(storeId),
                categoryId: Number(categoryId),
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { DeleteCategoryController };