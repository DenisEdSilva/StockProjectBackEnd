import { Request, Response, NextFunction } from "express";
import { redisClient } from "../redis.config";

export function authorized(method: string, resource: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ message: "User not authenticated" });
            return;
        }

        const userCache = await redisClient.get(`user:${userId}`);

        if (!userCache) {
            res.status(401).json({ message: "User data not found in cache" });
            return;
        }

        const user = JSON.parse(userCache);

        const { isOwner, permissions } = user;

        if (isOwner) {
            return next();
        }

        const requiredPermission = `${method.toUpperCase()}_${resource.toUpperCase()}`;

        const hasPermission = permissions.some(
            (p) => `${p.action.toUpperCase()}_${p.resource.toUpperCase()}` === requiredPermission
        );

        if (!hasPermission) {
            res.status(403).json({ message: "Permission denied" });
            return;
        }

        return next();
    };
}