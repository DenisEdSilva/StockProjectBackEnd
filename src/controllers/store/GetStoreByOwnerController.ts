import { Request, Response, NextFunction } from "express";
import { GetStoreByOwnerService } from "../../services/store/GetStoreByOwnerService";

class GetStoreByOwnerController { 
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = req.query.ownerId as string;

            if (!ownerId || isNaN(parseInt(ownerId, 10))) {
                throw new Error("ID do proprietário inválido");
            }

            const service = new GetStoreByOwnerService();
            const store = await service.execute(
                parseInt(ownerId, 10)
            );

            return res.status(200).json(store);
        } catch (error) {
            next(error);
        }
    }
}

export { GetStoreByOwnerController };