import { Request, Response, NextFunction } from "express";
import { CreateUserService } from "../../services/user/CreateUserService";

class CreateUserController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password } = req.body;

            const createUserService = new CreateUserService();
            const user = await createUserService.execute({ 
                name, 
                email, 
                password, 
                ipAddress: req.ip, 
                userAgent: req.headers["user-agent"] 
            });

            return res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    }
}

export { CreateUserController };