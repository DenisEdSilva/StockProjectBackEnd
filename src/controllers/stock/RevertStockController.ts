import { Request, Response } from "express";
import { RevertStockService } from "../../services/stock/RevertStockService";

class RevertStockController {
    async handle(req: Request, res: Response) {
        const revertStockService = new RevertStockService();

        const moviment = await revertStockService.execute(req.body);

        return res.json(moviment);
    }
}

export { RevertStockController }