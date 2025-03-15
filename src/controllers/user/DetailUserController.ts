import { Request, Response, NextFunction } from "express";
import { DetailUserService } from "../../services/user/DetailUserService";

class DetailUserController {
    async handle(req: Request, res: Response, next: NextFunction) {
        const userId = req.userId;

        const detailUserService = new DetailUserService();
        const user = await detailUserService.execute({
            userId,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] as string
        });

        return res.status(200).json(user);
    }
}

export { DetailUserController };