import { Request, Response, NextFunction } from "express";
import { AuthStoreUserService } from "../../services/storeUser/AuthStoreUserService";
import { redisClient } from "../../redis.config";

class AuthStoreUserController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const { email, password } = req.body;
        
            const service = new AuthStoreUserService();
            const authResult = await service.execute({
                storeId: Number(storeId),
                email,
                password,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || ''
            });

            await redisClient.setEx(
                `storeUser:${authResult.id}`,
                28800,
                JSON.stringify({
                    ...authResult,
                    isOwner: false
                })
            );

            return res.status(200).json({
                token: authResult.token,
                user: {
                    id: authResult.id,
                    name: authResult.name,
                    email: authResult.email
                },
                permissions: authResult.permissions
            });
        } catch (error) {
            next(error);
        }
    }
}

export { AuthStoreUserController };