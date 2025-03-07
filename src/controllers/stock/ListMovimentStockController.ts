import { Request, Response } from "express";
import { ListMovimentStockService } from "../../services/stock/ListMovimentStockService";

class ListMovimentStockController {
    async handle(req: Request, res: Response) {
        try {
            const movimentStockService = new ListMovimentStockService();

            const moviment = await movimentStockService.execute(req.body);

            return res.json(moviment);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { ListMovimentStockController };