import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ConflictError, ValidationError, UnauthorizedError } from "../errors";

export const errorHandler: ErrorRequestHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
        return;
    }

    if (error instanceof ConflictError) {
        res.status(409).json({ error: error.message });
        return;
    }

    if (error instanceof UnauthorizedError) {
        res.status(401).json({ error: error.message });
        return;
    }

    res.status(500).json({ error: "Erro interno do servidor" });
};