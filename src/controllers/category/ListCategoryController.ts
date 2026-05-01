import { Request, Response, NextFunction } from "express";
import { ListCategoryService } from "../../services/category/ListCategoryService";
import { ValidationError } from "../../errors";

class ListCategoryController {
    constructor(private listCategoryService: ListCategoryService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const storeId = Number(req.params.storeId);

            const {
                page,
                pageSize,
                search,
                startDate,
                endDate,
                sortBy,
                sortOrder,
                minProducts,
                maxProducts
            } = req.query;

            const parsedPage = page ? Number(page) : 1;
            const parsedPageSize = pageSize ? Number(pageSize) : 10;
            const parsedMin = minProducts ? Number(minProducts) : undefined;
            const parsedMax = maxProducts ? Number(maxProducts) : undefined;

            const result = await this.listCategoryService.execute({
                storeId,
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                page: parsedPage,
                pageSize: parsedPageSize,
                search: search as string,
                startDate: startDate as string,
                endDate: endDate as string,
                sortBy: sortBy as 'name' | 'createdAt',
                sortOrder: sortOrder as 'asc' | 'desc',
                minProducts: parsedMin,
                maxProducts: parsedMax
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListCategoryController };