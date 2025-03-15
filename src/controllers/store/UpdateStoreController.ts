import { Request, Response, NextFunction } from "express";
import { UpdateStoreService } from "../../services/store/UpdateStoreService";

class UpdateStoreController {
    async handle(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;
        const { name, city, state, zipCode } = req.body;
        const userId = req.userId;

        const updateStoreService = new UpdateStoreService();
        const result = await updateStoreService.execute({
            id: parseInt(id, 10),
            name,
            city,
            state,
            zipCode,
            userId,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] as string
        });

        return res.status(200).json(result);
    }
}

export { UpdateStoreController };