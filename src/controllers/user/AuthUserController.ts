import { Request, Response } from "express";
import { AuthUserService } from "../../services/user/AuthUserService";

class AuthUserController {
    async handle(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            const authUserService = new AuthUserService();
            const auth = await authUserService.execute({ email, password });

            return res.status(200).json(auth);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { AuthUserController };