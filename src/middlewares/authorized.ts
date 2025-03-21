import { Request, Response, NextFunction } from "express";
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
            if (req.user.type === "owner") {
                return next();
            }

            if (!req.user.id || isNaN(req.user.id)) {
                throw new UnauthorizedError("Identificação de usuário inválida");
            }

            const requiredPermission = `${action.toUpperCase()}_${resource.toUpperCase()}`;
            const hasPermission = (req.user.permissions?.some(p => 
                `${p.toUpperCase()}_${p.toUpperCase()}` === requiredPermission
            ) || []);

            if (!hasPermission) {
                throw new ForbiddenError("Acesso não autorizado para este recurso");
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}