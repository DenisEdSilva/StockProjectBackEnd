import { Request, Response, NextFunction } from "express";
import { CreateUserService } from "../../services/user/CreateUserService";

class CreateUserController {
    constructor(private createUserService: CreateUserService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password } = req.body;
            
            const result = await this.createUserService.execute({ 
                name, 
                email, 
                password, 
                ipAddress: req.ip, 
                userAgent: req.headers["user-agent"] || "" 
            });

            return res.status(201).json(result);
        } catch (error) { 
            next(error); 
        }
    }
}

export { CreateUserController };