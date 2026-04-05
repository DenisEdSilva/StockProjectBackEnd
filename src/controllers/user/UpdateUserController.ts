import { Request, Response, NextFunction } from "express";
import { UpdateUserService } from "../../services/user/UpdateUserService";

class UpdateUserController {
    constructor(private updateUserService: UpdateUserService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password } = req.body;
            
            const result = await this.updateUserService.execute({
                userId: Number(req.params.userId),
                performedByUserId: req.user.id,
                userType: req.user.type,
                name, 
                email, 
                password,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(200).json(result);
        } catch (error) { 
            next(error); 
        }
    }
}

export { UpdateUserController };