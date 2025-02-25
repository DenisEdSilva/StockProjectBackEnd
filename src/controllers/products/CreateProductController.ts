import { Request, Response } from "express";
import { CreateProductService } from "../../services/products/CreateProductService";

class CreateProductController {
    async handle(req: Request, res: Response) {
        const { banner, name, price, categoryId } = req.body;
        
        const createProductService = new CreateProductService();

        const product = await createProductService.execute({ 
            banner, 
            name, 
            price, 
            categoryId 
        });

        return res.json(product);
    }
}

export { CreateProductController }