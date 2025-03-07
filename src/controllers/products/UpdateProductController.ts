import { Request, Response } from "express";
import { UpdateProductService } from "../../services/products/UpdateProductService";

class UpdateProductController {
    async handle(req: Request, res: Response) {
        try {
            const { id, name, stock, price, description } = req.body;

            const updateProductService = new UpdateProductService();
            const product = await updateProductService.execute({ id, name, stock, price, description });

            return res.status(200).json(product);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { UpdateProductController };