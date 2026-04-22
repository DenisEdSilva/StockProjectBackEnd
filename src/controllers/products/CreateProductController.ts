import { Request, Response, NextFunction } from "express";
import { CreateProductService } from "../../services/products/CreateProductService";
import { Prisma } from "@prisma/client";

class CreateProductController {
    constructor(private createProductService: CreateProductService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { sku, banner, name, price, description, categoryId } = req.body;
            const { storeId } = req.params;

            const product = await this.createProductService.execute({
                sku,
                name,
                description,
                banner,
                price: price,
                categoryId: Number(categoryId),
                storeId: Number(storeId),
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(201).json(product);
        } catch (error) {
            next(error);
        }
    }
}

export { CreateProductController };