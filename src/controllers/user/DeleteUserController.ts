import { Request, Response, NextFunction } from "express";
import { DeleteUserService } from "../../services/user/DeleteUserService";

class DeleteUserController {
    constructor(private deleteUserService: DeleteUserService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.deleteUserService.execute({ 
                id: Number(req.params.id),
                performedByUserId: req.user.id,
                userType: req.user.type,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'] || ""
            });

            return res.status(200).json(result);
        } catch (error) { 
            next(error); 
        }
    }
}

export { DeleteUserController };