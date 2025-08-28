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

            res.cookie("access_token", auth.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 30 * 24 * 3600 * 1000,
                path: "/",
                // domain: process.env.NODE_ENV === 'development' ? 'localhost' : 'seusite.com',
            });

            await redisClient.setEx(
                `owner:${auth.id}`,
                30 * 24 * 3600,
                JSON.stringify({
                    id: auth.id,
                    name: auth.name,
                    email: auth.email,
                    isOwner: true
                })
            );

            return res.json({
                token: auth.token,
                id: auth.id,
                name: auth.name,
                email: auth.email
            });
        } catch (error) {
            next(error);
        }
    }
}

export { AuthUserController };