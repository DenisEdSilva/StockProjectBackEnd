import { Request, Response } from "express";
import { DeleteStoreService } from "../../services/store/DeleteStoreService";

class DeleteStoreController {
    async handle(req: Request, res: Response) {
        try {
            const { storeId } = req.body;
            const ownerId = req.userId;

            const softDeleteStoreService = new DeleteStoreService();
            const deletedStore = await softDeleteStoreService.execute({
                storeId,
                ownerId,
                ipAddress: req.ip, // Passa o endereço IP
                userAgent: req.headers["user-agent"],
            });

            return res.status(200).json(deletedStore);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { DeleteStoreController };