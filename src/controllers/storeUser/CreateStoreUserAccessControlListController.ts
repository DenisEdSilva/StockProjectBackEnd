import { Request, Response } from "express";
import { CreateStoreUserAccessControlListService } from "../../services/storeUser/CreateStoreUserAccessControlListService";
import { redisClient } from "../../redis.config";

class CreateStoreUserAccessControlListController {
    async handle(req: Request, res: Response) {
        const storeUserId = parseInt(req.params.storeUserId, 10);
        const token = req.token;

        const service = new CreateStoreUserAccessControlListService();
        const acl = await service.execute({ storeUserId });

        await redisClient.setEx(
            `acl:${storeUserId}`,
            28800,
            JSON.stringify({ ...acl, token })
        );

        return res.status(200).json({
            userId: acl.id,
            permissions: acl.permissions,
            token
        });
    }
}

export { CreateStoreUserAccessControlListController };