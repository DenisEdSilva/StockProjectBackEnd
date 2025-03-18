import { Request, Response, NextFunction } from "express";
import { AuthUserService } from "../../services/user/AuthUserService";
import { redisClient } from "../../redis.config";

class AuthUserController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;

            const authUserService = new AuthUserService();
            const auth = await authUserService.execute({
                email,
                password,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });

            await redisClient.setEx(
                `user:${auth.id}`,
                28800,
                JSON.stringify({
                    ...auth,
                    isOwner: true
                })
            )

            return res.status(200).json(auth);
        } catch (error) {
            next(error);
        }
    }
}

export { AuthUserController };