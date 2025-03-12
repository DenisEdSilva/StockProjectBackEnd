import { Request, Response } from "express";
import { UpdateStoreService } from "../../services/store/UpdateStoreService";

class UpdateStoreController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, address, userId, ipAddress, userAgent } = req.body;

            const updateStoreService = new UpdateStoreService();
            const result = await updateStoreService.execute({
                id: parseInt(id, 10),
                name,
                address,
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

export { UpdateStoreController };