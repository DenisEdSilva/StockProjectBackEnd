import { Request, Response, NextFunction } from "express";
import { DeleteCategoryService } from "../../services/category/DeleteCategoryService";
import { ValidationError } from "../../errors";

class DeleteCategoryController {
    constructor(private deleteCategoryService: DeleteCategoryService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const storeId = Number(req.params.storeId);
            const categoryId = Number(req.params.categoryId);

            const result = await this.deleteCategoryService.execute({
                storeId,
                categoryId,
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