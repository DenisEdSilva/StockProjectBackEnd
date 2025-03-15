import { Request, Response, NextFunction } from "express";
import { UpdateUserService } from "../../services/user/UpdateUserService";

class UpdateUserController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req;
            const { name, email, password } = req.body;
    
            const updateUserService = new UpdateUserService();
            const user = await updateUserService.execute({
                userId,
                name,
                email,
                password,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });
    
            return res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }
}

export { UpdateUserController };