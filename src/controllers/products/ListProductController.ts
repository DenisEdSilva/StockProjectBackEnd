import { Request, Response } from "express";
import { ListProductService } from "../../services/products/ListProductService";

class ListProductController {
    async handle(req: Request, res: Response) {
        try {
            const listProductService = new ListProductService();

            const products = await listProductService.execute(req.body);

            return res.json(products);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { ListProductController };