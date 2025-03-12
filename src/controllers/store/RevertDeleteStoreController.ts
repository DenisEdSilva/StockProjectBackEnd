import { Request, Response } from "express";
import { RevertDeleteStoreService } from "../../services/store/RevertDeleteStoreService";

class RevertDeleteStoreController {
    async handle(req: Request, res: Response) {
        try {
            const { storeId } = req.params;
            const { userId, ipAddress, userAgent } = req.body;

            const revertDeleteStoreService = new RevertDeleteStoreService();
            const result = await revertDeleteStoreService.execute({
                storeId: parseInt(storeId, 10),
                userId,
                ipAddress,
                userAgent,
            });

            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { RevertDeleteStoreController };