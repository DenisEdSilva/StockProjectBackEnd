import { Request, Response, NextFunction } from "express";
import { CreateCategoryService } from "../../services/category/CreateCategoryService";

class CreateCategoryController {
    constructor(private createCategoryService: CreateCategoryService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { name } = req.body;
            const { storeId } = req.params;

            const category = await this.createCategoryService.execute({
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                storeId: Number(storeId),
                name,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(201).json(category);
        } catch (error) {
            next(error);
        }
    }
}

export { CreateCategoryController };