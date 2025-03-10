import { Request, Response } from "express";
import { DetailUserService } from "../../services/user/DetailUserService";

interface UserRequest {
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class DetailUserController {
    async handle(req: Request, res: Response) {
        try {
            const userId = req.userId;
            const userRequest: UserRequest = { 
                userId, 
                ipAddress: req.ip, 
                userAgent: req.headers["user-agent"] 
            };

            const detailUserService = new DetailUserService();
            const user = await detailUserService.execute(userRequest);

            return res.status(200).json(user);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { DetailUserController };