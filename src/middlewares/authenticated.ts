import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { UnauthorizedError, ValidationError } from "../errors";

declare module "express" {
    interface Request {
        userId: number;
        token: string;
    }
}

interface JwtPayload {
    sub: string;
    [key: string]: any;
}

export function authenticated(req: Request, res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            throw new ValidationError("Formato de autorização inválido. Use: Bearer <token>");
        }

        const token = authHeader.split(" ")[1];

        const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;

        const userId = parseInt(decoded.sub, 10);
        if (isNaN(userId)) {
            throw new ValidationError("ID de usuário inválido no token");
        }

        req.userId = userId;
        req.token = token;

        next();
    } catch (error) {
        if (error instanceof Error) {
            if (["TokenExpiredError", "JsonWebTokenError", "NotBeforeError"].includes(error.name)) {
                throw new UnauthorizedError(`Token inválido: ${error.message}`);
            }
        }
        next(error);
    }
}