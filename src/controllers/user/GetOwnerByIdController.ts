import { Request, Response, NextFunction } from "express";
import { GetOwnerByIdService } from "../../services/user/GetOwnerByIdService";

class GetOwnerByIdController {
    constructor(private getOwnerByIdService: GetOwnerByIdService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.getOwnerByIdService.execute({
                ownerId: Number(req.params.ownerId),
                performedByUserId: req.user.id,
                userType: req.user.type
            });

            return res.status(200).json(result);
        } catch (error) { 
            next(error); 
        }
    }
}

export { GetOwnerByIdController };