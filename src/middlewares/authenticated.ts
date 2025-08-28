import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { redisClient } from "../redis.config";
import { UnauthorizedError, ValidationError } from "../errors";
import cookie from "cookie-parser";

declare module "express" {
    interface Request {
        user: {
            id: number;
            type: 'owner' | 'store';
            permissions?: string[];
            storeId?: number;
        };
    }
}

export async function authenticated(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const token = req.cookies.access_token;

        if (!token) {
            throw new ValidationError("Token não encontrado nos cookies");
        }

        const decoded = verify(token, process.env.JWT_SECRET!) as {
            id: number;
            type: 'owner' | 'store';
            storeId?: number;
        };

        if (!['owner', 'store'].includes(decoded.type)) {
            throw new UnauthorizedError("Tipo de usuário inválido");
        }

        const redisKey = decoded.type === 'owner' 
            ? `owner:${decoded.id}`
            : `store:${decoded.storeId}:user:${decoded.id}`;

        const userData = await redisClient.get(redisKey);
        
        if (!userData) {
            throw new UnauthorizedError("Sessão expirada ou inválida");
        }

        const user = JSON.parse(userData);
        req.user = {
            id: decoded.id,
            type: decoded.type,
            ...(decoded.type === 'store' && {
                storeId: decoded.storeId,
                permissions: user.permissions || []
            })
        };

        next();
    } catch (error) {
        if (error instanceof Error) {
            switch (error.name) {
                case 'TokenExpiredError':
                    return next(new UnauthorizedError("Sessão expirada"));
                case 'JsonWebTokenError':
                    return next(new UnauthorizedError("Token inválido"));
                default:
                    return next(error);
            }
        }
        next(error);
    }
}