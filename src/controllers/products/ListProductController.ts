import { Request, Response, NextFunction } from "express";
import { ListProductService } from "../../services/products/ListProductService";

interface AuthRequest extends Request {
    user: {
        id: number;
        type: 'OWNER' | 'STORE_USER';
        storeId?: number;
    }
}

class ListProductController {
    constructor(private listProductService: ListProductService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;

            const {
                page,
                pageSize,
                search,
                sku,
                categoryId,
                productId,
                minStock,
                maxStock,
                inStock,
                minPrice,
                maxPrice,
                startDate,
                endDate,
                sortBy,
                sortOrder
            } = req.query;

            const parsedInStock =
                inStock === 'true'
                    ? true
                    : inStock === 'false'
                    ? false
                    : undefined;

            const result = await this.listProductService.execute({
                storeId: Number(storeId),
                performedByUserId: (req as AuthRequest).user.id,
                userType: (req as AuthRequest).user.type,
                tokenStoreId: (req as AuthRequest).user.storeId,

                page: page ? Number(page) : 1,
                pageSize: pageSize ? Number(pageSize) : 10,

                search: typeof search === 'string' ? search : undefined,
                sku: typeof sku === 'string' ? sku : undefined,

                categoryId: categoryId ? Number(categoryId) : undefined,
                productId: productId ? Number(productId) : undefined,

                minStock: minStock ? Number(minStock) : undefined,
                maxStock: maxStock ? Number(maxStock) : undefined,

                inStock: parsedInStock,

                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,

                startDate: typeof startDate === 'string' ? startDate : undefined,
                endDate: typeof endDate === 'string' ? endDate : undefined,

                sortBy: typeof sortBy === 'string' ? sortBy as any : undefined,
                sortOrder: typeof sortOrder === 'string' ? sortOrder as any : undefined
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListProductController };