import { Request, Response } from "express";
import { UpdateStoreService } from "../../services/store/UpdateStoreService";

class UpdateStoreController {
    async handle(req: Request, res: Response) {
        try {
            const { storeId, name, adress } = req.body;
            const ownerId = req.userId;

            const updateStoreService = new UpdateStoreService();
            const updatedStore = await updateStoreService.execute({
                storeId,
                name,
                adress,
                ownerId,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
            });

            return res.status(200).json(updatedStore);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { UpdateStoreController };