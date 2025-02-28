import { Request, Response } from "express";
import { AuthStoreUserService } from "../../services/storeUser/AuthStoreUserService";

class AuthStoreUserController {
    async handle(req: Request, res: Response) {
        const authStoreUserService = new AuthStoreUserService();

        const auth = await authStoreUserService.execute({
            storeId: req.body.storeId, 
            email: req.body.email, 
            password: req.body.password 
        });

        return res.json(auth);
    }
}

export { AuthStoreUserController };