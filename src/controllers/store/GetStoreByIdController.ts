import { Request, Response, NextFunction } from "express";
import { GetStoreByIdService } from "../../services/store/GetStoreByIdService";

class GetStoreByIdController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = req.userId;
            const storeId = Number(req.params.storeId);

            const service = new GetStoreByIdService();
            const store = await service.execute({ ownerId, storeId });

            return res.status(200).json(store);
        } catch (error) {
            next(error);
        }
    }
}

export { GetStoreByIdController };