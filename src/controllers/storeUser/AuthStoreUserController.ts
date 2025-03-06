import { Request, Response } from "express";
import { AuthStoreUserService } from "../../services/storeUser/AuthStoreUserService";
import { CreateStoreUserAccessControlListController } from "./CreateStoreUserAccessControlListController";
import { create } from "domain";

class AuthStoreUserController {
    async handle(req: Request, res: Response) {
        const authStoreUserService = new AuthStoreUserService();

        const auth = await authStoreUserService.execute({
            storeId: req.body.storeId, 
            email: req.body.email, 
            password: req.body.password 
        });

        if (auth instanceof Error) {
            return res.status(400).json({ error: auth.message });
        }

        req.userId = auth.storeUserId;
        req.token = auth.token;

        const createUserACLCache = new CreateStoreUserAccessControlListController();
        const user = await createUserACLCache.handle(req, res);
    }
}

export { AuthStoreUserController };