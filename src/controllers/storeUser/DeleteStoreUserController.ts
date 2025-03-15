import { Request, Response } from "express";
import { DeleteStoreUserService } from "../../services/storeUser/DeleteStoreUserService";

class DeleteStoreUserController {
    async handle(req: Request, res: Response) {
        const id = parseInt(req.params.id, 10);
        const storeId = parseInt(req.params.storeId, 10);
        const deletedBy = req.userId;
        const ipAddress = req.ip;
        const userAgent = req.headers['user-agent'] || '';

        const service = new DeleteStoreUserService();
        const result = await service.execute({
            id,
            storeId,
            deletedBy: Number(deletedBy),
            ipAddress,
            userAgent
        });

        return res.status(200).json(result);
    }
}

export { DeleteStoreUserController };