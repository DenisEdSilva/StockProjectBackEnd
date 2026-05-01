import { Request, Response, NextFunction } from "express";
import { UpdateCategoryService } from "../../services/category/UpdateCategoryService";
import { ValidationError } from "../../errors";

class UpdateCategoryController {
    constructor(private updateCategoryService: UpdateCategoryService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const storeId = Number(req.params.storeId);
            const categoryId = Number(req.params.categoryId);
            const { name } = req.body;

            const updatedCategory = await this.updateCategoryService.execute({
                storeId,
                categoryId,
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