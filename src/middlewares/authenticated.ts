import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { redisClient } from "../redis.config";
import { UnauthorizedError, ValidationError, ForbiddenError } from "../errors";
import prismaClient from "../prisma";
import { AccessControlProvider } from "../shared/AccessControlProvider";

declare module "express" {
    interface Request {
        user: {
            id: number;
            type: 'OWNER' | 'STORE_USER';
            permissions?: {
                action: string;
                resource: string;
            }[];
            storeId?: number;
        };
    }
}

export async function authenticated(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;
        const cookieToken = req.cookies?.['stockproject.token'] || req.cookies?.access_token;
        
        const token = authHeader ? authHeader.split(' ')[1] : cookieToken;
        
        if (!token) {
            throw new ValidationError("TokenNotFound");
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("ServerConfigurationError");
        }

        const decoded = verify(token, jwtSecret) as {
            id: number;
            type: 'OWNER' | 'STORE_USER';
            storeId?: number;
        };

        if (!['OWNER', 'STORE_USER'].includes(decoded.type)) {
            throw new UnauthorizedError("InvalidUserType");
        }

        const redisKey = decoded.type === 'OWNER'
            ? `owner:${decoded.id}`
            : `store:${decoded.storeId}:user:${decoded.id}`;

        let userDataStr: string | null = null;
        
        try {
            if (redisClient.isOpen) {
                userDataStr = await redisClient.get(redisKey);
            }
        } catch (error) {}

        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            req.user = {
                id: decoded.id,
                type: decoded.type,
                permissions: userData.permissions || [], 
                ...(decoded.type === 'STORE_USER' && {
                    storeId: decoded.storeId,
                }),
            };
            return next();
        }

        if (decoded.type === 'OWNER') {
            const owner = await prismaClient.user.findUnique({
                where: { id: decoded.id, isDeleted: false },
                select: { id: true, isOwner: true }
            });

            if (!owner || !owner.isOwner) {
                throw new UnauthorizedError("SessionInvalid");
            }

            req.user = { 
                id: decoded.id, 
                type: 'OWNER',
                permissions: []
            };
        } else {
            const accessControl = new AccessControlProvider();
            const userData = await accessControl.uintToACL(decoded.id, prismaClient);

            req.user = {
                id: decoded.id,
                type: 'STORE_USER',
                storeId: decoded.storeId,
                permissions: userData.permissions,
            };

            try {
                if (redisClient.isOpen) {
                    await redisClient.setEx(
                        redisKey,
                        30 * 24 * 3600,
                        JSON.stringify({
                            id: userData.id,
                            name: userData.name,
                            email: userData.email,
                            storeId: decoded.storeId,
                            permissions: userData.permissions || []
                        })
                    );
                }
            } catch (error) {}
        }

        next();
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return next(new UnauthorizedError("SessionExpired"));
        }
        if (error.name === "JsonWebTokenError") {
            return next(new UnauthorizedError("InvalidToken"));
        }
        next(error);
    }
}