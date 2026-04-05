import { Request, Response, NextFunction } from "express";
import { GetStoreByIdService } from "../../services/store/GetStoreByIdService";

class GetStoreByIdController {
    constructor(private getStoreByIdService: GetStoreByIdService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.getStoreByIdService.execute({
                userId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                storeId: Number(req.params.storeId)
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { GetStoreByIdController };