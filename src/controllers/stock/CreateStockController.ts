import { Request, Response } from "express";
import { CreateStockService } from "../../services/stock/CreateStockService";

class CreateStockController {
    async handle(req: Request, res: Response) {
        const createStockService = new CreateStockService();

        const stock = await createStockService.execute(req.body);

        return res.json(stock);
    }
}

export { CreateStockController }