import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";

interface Payload {
    sub: string;
}

export function authenticated(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ message: "Token missing" });
        return;
    }

    const [, token] = authHeader.split(" ");

    try {
        const { sub } = verify(token, process.env.JWT_SECRET) as Payload;
        req.userId = parseInt(sub);
        req.token = token;

        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
}