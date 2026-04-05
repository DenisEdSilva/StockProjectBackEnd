import { Request, Response, NextFunction } from "express";
import { ListCategoryService } from "../../services/category/ListCategoryService";

class ListCategoryController {
    constructor(private listCategoryService: ListCategoryService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const { page, pageSize, search } = req.query;

            const result = await this.listCategoryService.execute({ 
                storeId: Number(storeId),
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                page: page ? Number(page) : 1,
                pageSize: pageSize ? Number(pageSize) : 10,
                search: search as string
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListCategoryController };