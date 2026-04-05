import { Request, Response, NextFunction } from "express";
import { CreateStoreService } from "../../services/store/CreateStoreService";

class CreateStoreController {
    constructor(private createStoreService: CreateStoreService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, city, state, zipCode } = req.body;

            const result = await this.createStoreService.execute({
                performedByUserId: req.user.id,
                userType: req.user.type,
                name,
                city,
                state,
                zipCode,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { CreateStoreController };