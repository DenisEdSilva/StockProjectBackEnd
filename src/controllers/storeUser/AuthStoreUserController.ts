import { Request, Response } from "express";
import { AuthStoreUserService } from "../../services/storeUser/AuthStoreUserService";
import { redisClient } from "../../redis.config";

class AuthStoreUserController {
    async handle(req: Request, res: Response) {
        const { storeId, email, password } = req.body;
        
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
            JSON.stringify(authResult)
        );

        return res.status(200).json({
            user: {
                id: authResult.id,
                name: authResult.name,
                email: authResult.email
            },
            permissions: authResult.permissions,
            token: authResult.token
        });
    }
}

export { AuthStoreUserController };