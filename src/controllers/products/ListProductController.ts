import { Request, Response, NextFunction } from "express";
import { ListProductService } from "../../services/products/ListProductService";

class ListProductController {
    constructor(private listProductService: ListProductService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const { page, pageSize, search, sku, categoryId } = req.query;

            const result = await this.listProductService.execute({ 
                storeId: Number(storeId),
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                page: page ? Number(page) : 1,
                pageSize: pageSize ? Number(pageSize) : 10,
                search: search as string,
                sku: sku as string,
                categoryId: categoryId ? Number(categoryId) : undefined
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListProductController };