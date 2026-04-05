import { Request, Response, NextFunction } from "express";
import { SignInService } from "../../services/auth/SignInService";
import { setAuthCookie } from "../../helpers/cookieHelper";

class SignInController {
    constructor(private signInService: SignInService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const authResult = await this.signInService.execute({
                email: req.body.email,
                password: req.body.password,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            setAuthCookie(res, authResult.token);
            
            return res.status(200).json(authResult);    
        } catch (error) {    
            next(error);            
        }
    }
}

export { SignInController };