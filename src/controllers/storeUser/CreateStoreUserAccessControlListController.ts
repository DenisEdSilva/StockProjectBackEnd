import { Request, Response } from "express"
import { CreateStoreUserAccessControlListService } from "../../services/storeUser/CreateStoreUserAccessControlListService"
import { redisClient } from "../../redis.config";

class CreateStoreUserAccessControlListController {
    async handle(req: Request, res: Response,) {
        const userId = req.userId;
        const token = req.token;

        const createUserAccessControlListService = new CreateStoreUserAccessControlListService();

        const user = await createUserAccessControlListService.execute({ storeUserId: userId });

        if (user instanceof Error) {
            return res.status(400).json({ error: user.message });
        }

        await redisClient.set(`user:${userId}`, JSON.stringify({...user, token }));

        const userWithToken = { ...user, token };
        console.log(userWithToken)

        return res.json(userWithToken);
    }
}

export { CreateStoreUserAccessControlListController }