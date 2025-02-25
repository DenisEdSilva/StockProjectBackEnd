import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";

interface Payload{
    sub: string;
}

export function authenticated(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Token missing"
        });
    }

    const [, token] = authHeader.split(" ");

    try {
        const { sub } = verify(token, process.env.JWT_SECRET) as Payload;

        req.user_id = sub;

        return next();
    } catch (err) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }
}