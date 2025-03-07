import { Request, Response } from "express";
import { RevertStockService } from "../../services/stock/RevertStockService";

class RevertStockController {
    async handle(req: Request, res: Response) {
        try {
            const revertStockService = new RevertStockService();

            const moviment = await revertStockService.execute(req.body);

            return res.json(moviment);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { RevertStockController };