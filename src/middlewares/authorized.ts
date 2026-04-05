import { Request, Response, NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../errors";

export function authorized(action: string, resource: string) {
    const requiredPermission = `${action.toUpperCase()}_${resource.toUpperCase()}`;

    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const user = req.user;

            if (user.type === 'OWNER') {
                return next();
            }

            if (!user.id || !user.permissions || !Array.isArray(user.permissions)) {
                throw new UnauthorizedError("InvalidOrMissingPermissions");
            }

            const hasPermission = user.permissions.some(
                p => `${p.action.toUpperCase()}_${p.resource.toUpperCase()}` === requiredPermission
            );

            if (!hasPermission) {
                throw new ForbiddenError("ForbiddenAccess");
            }

            console.log('--- CHECK PERMISSION ---');
            console.log('Metodo Requisitado:', req.method);
            console.log('Recurso Requisitado:', resource);
            console.log('Permissões do Usuário:', JSON.stringify(user.permissions));

            next();
        } catch (err) {
            next(err);
        }
    };
}