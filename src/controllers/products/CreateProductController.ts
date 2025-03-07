import { Request, Response } from "express";
import { CreateProductService } from "../../services/products/CreateProductService";

class CreateProductController {
    async handle(req: Request, res: Response) {
        try {
            const { banner, name, stock, price, description, categoryId, storeId } = req.body;

            const createProductService = new CreateProductService();

            const product = await createProductService.execute({
                banner,
                name,
                stock,
                price,
                description,
                categoryId,
                storeId,
            });

            return res.json(product);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { CreateProductController };