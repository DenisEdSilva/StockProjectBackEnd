import { Request, Response } from "express";
import { ListStoreUserService } from "../../services/storeUser/ListStoreUserService";

class ListStoreUserController {
    async handle(req: Request, res: Response) {
        const listStoreUserService = new ListStoreUserService()

        const storeUserList = await listStoreUserService.execute({ 
            storeId: req.body.storeId
       })

        return res.json(storeUserList)
    }
}

export { ListStoreUserController }