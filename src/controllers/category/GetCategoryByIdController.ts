import { Request, Response, NextFunction } from "express";
import { GetCategoryByIdService } from "../../services/category/GetCategoryByIdService";

class GetCategoryByIdController {
    constructor(private getCategoryByIdService: GetCategoryByIdService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, categoryId } = req.params;

            const category = await this.getCategoryByIdService.execute({ 
                storeId: Number(storeId), 
                id: Number(categoryId),
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId
            });

            return res.status(200).json(category);
        } catch (error) {
            next(error);
        }
    }
}

export { GetCategoryByIdController };