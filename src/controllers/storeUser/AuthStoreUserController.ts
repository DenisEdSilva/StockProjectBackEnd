import { Request, Response } from "express";
import { AuthStoreUserService } from "../../services/storeUser/AuthStoreUserService";
import { CreateStoreUserAccessControlListController } from "./CreateStoreUserAccessControlListController";

class AuthStoreUserController {
    async handle(req: Request, res: Response) {
        try {
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

            return res.status(200).json(user); // 200 para sucesso
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { AuthStoreUserController };