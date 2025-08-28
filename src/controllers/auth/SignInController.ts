import { Request, Response, NextFunction } from "express";
import { SignInService } from "../../services/auth/SignInService";

class SignInController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const signInService = new SignInService();
            const authResult = await signInService.execute({
                email: req.body.email,
                password: req.body.password,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });

            res.cookie("access_token", authResult.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 8 * 3600 * 1000,
                path: "/",
            });

            return res.status(200).json(authResult);    
        } catch (error) {    
            next(error);            
        }

    }
}
 
export { SignInController };