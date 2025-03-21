import { Request, Response, NextFunction } from "express";
import { DetailUserService } from "../../services/user/DetailUserService";

class DetailUserController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user.id;

            const detailUserService = new DetailUserService();
            const user = await detailUserService.execute({
                userId,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });
    
            return res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }
}

export { DetailUserController };