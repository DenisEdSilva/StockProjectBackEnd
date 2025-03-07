import { Request, Response } from "express";
import { CreateStockService } from "../../services/stock/CreateStockService";

class CreateStockController {
    async handle(req: Request, res: Response) {
        try {
            const createStockService = new CreateStockService();

            const stock = await createStockService.execute(req.body);

            return res.json(stock);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { CreateStockController };