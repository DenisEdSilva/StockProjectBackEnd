import { Request, Response } from "express";
import { ListProductService } from "../../services/products/ListProductService";

class ListProductController {
    async handle(req: Request, res: Response) {
        const listProductService = new ListProductService();

        const products = await listProductService.execute(req.body);

        return res.json(products);
    }
}

export { ListProductController };