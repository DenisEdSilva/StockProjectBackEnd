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

            res.cookie("access_token", authResult.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 8 * 3600 * 1000,
                path: "/",
            });

            return res.json({
                user: {
                    token: authResult.token,
                    id: authResult.id,
                    name: authResult.name,
                    email: authResult.email,
                    storeId: authResult.storeId,
                    roleId: authResult.roleId,
                    createdBy: authResult.createdBy,
                    createdAt: authResult.createdAt,
                    updatedAt: authResult.updatedAt,
                    deletedAt: authResult.deletedAt,
                    isDeleted: authResult.isDeleted,
                },
                permissions: authResult.permissions
            });
        } catch (error) {
            next(error);
        }
    }
}

export { AuthStoreUserController };