import { Request, Response, NextFunction } from "express";
import { ListCategoryService } from "../../services/category/ListCategoryService";
import { ValidationError } from "../../errors";

interface AuthRequest extends Request {
    user: {
        id: number;
        type: "OWNER" | "STORE_USER";
        storeId?: number;
    };
}

class ListCategoryController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;

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

            const parsedStoreId = Number(storeId);
            const parsedPage = page ? Number(page) : 1;
            const parsedPageSize = pageSize ? Number(pageSize) : 10;
            const parsedMinProducts = minProducts ? Number(minProducts) : undefined;
            const parsedMaxProducts = maxProducts ? Number(maxProducts) : undefined;

            if (
                !Number.isInteger(parsedStoreId) ||
                !Number.isInteger(parsedPage) ||
                !Number.isInteger(parsedPageSize) ||
                (minProducts && !Number.isInteger(parsedMinProducts)) ||
                (maxProducts && !Number.isInteger(parsedMaxProducts))
            ) {
                throw new ValidationError("InvalidParams");
            }

            const service = new ListCategoryService();

            const result = await service.execute({
                storeId: parsedStoreId,
                performedByUserId: (req as AuthRequest).user.id,
                userType: (req as AuthRequest).user.type,
                tokenStoreId: (req as AuthRequest).user.storeId,
                page: parsedPage,
                pageSize: parsedPageSize,
                search: search as string,
                startDate: startDate as string,
                endDate: endDate as string,
                sortBy: sortBy as 'name' | 'createdAt',
                sortOrder: sortOrder as 'asc' | 'desc',
                minProducts: parsedMinProducts,
                maxProducts: parsedMaxProducts
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListCategoryController };