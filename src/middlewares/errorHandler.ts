import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { AppError } from "../errors";

export const errorHandler: ErrorRequestHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({ 
            status: "error",
            name: error.name,
            message: error.message 
        });
        return;
    }

    console.error(`[Internal Error]: ${error.stack}`);
    
    res.status(500).json({ 
        status: "error",
        message: "Erro interno do servidor" 
    });
};