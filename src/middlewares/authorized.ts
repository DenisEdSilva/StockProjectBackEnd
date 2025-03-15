import { Request, Response, NextFunction } from "express";
import { redisClient } from "../redis.config";
import { UnauthorizedError, ForbiddenError } from "../errors";

interface UserCache {
    id: number;
    isOwner: boolean;
    permissions: Array<{
        action: string;
        resource: string;
    }>;
}

export function authorized(action: string, resource: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.userId;
            
            if (!userId || isNaN(userId)) {
                throw new UnauthorizedError("Identificação de usuário inválida");
            }

            const userCache = await redisClient.get(`user:${userId}`);
            if (!userCache) {
                throw new UnauthorizedError("Sessão expirada ou inválida");
            }

            const user: UserCache = JSON.parse(userCache);

            if (user.isOwner) {
                return next();
            }

            const requiredPermission = `${action.toUpperCase()}_${resource.toUpperCase()}`;
            const hasPermission = user.permissions?.some(p => 
                `${p.action.toUpperCase()}_${p.resource.toUpperCase()}` === requiredPermission
            );

            if (!hasPermission) {
                throw new ForbiddenError("Acesso não autorizado para este recurso");
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}