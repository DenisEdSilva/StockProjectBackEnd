import { Request, Response, NextFunction } from "express";
import { GetOwnerByIdService } from "../../services/user/GetOwnerByIdService";

export class GetOwnerByIdController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = parseInt(req.params.ownerId, 10);

            const getOwnerByIdService = new GetOwnerByIdService();
            const owner = await getOwnerByIdService.execute({
                ownerId
            });
            return res.json(owner);
        } catch (error) {
            next(error);
        }
    }
}