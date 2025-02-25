import { Request, Response } from "express";
import { ListMovimentStockService } from "../../services/stock/ListMovimentStockService";

class ListMovimentStockController {
    async handle(req: Request, res: Response) {
        const movimentStockService = new ListMovimentStockService()

        const moviment = await movimentStockService.execute();

        return res.json(moviment);
    }
}

export { ListMovimentStockController }