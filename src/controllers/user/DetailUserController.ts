import { Request, Response, NextFunction } from "express";
import { DetailUserService } from "../../services/user/DetailUserService";

class DetailUserController {
    constructor(private detailUserService: DetailUserService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.detailUserService.execute({
                userId: req.user.id,
                userType: req.user.type,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(200).json(result);
        } catch (error) { 
            next(error); 
        }
    }
}

export { DetailUserController };