import { Request, Response } from "express";
import { CreateStoreUserService } from "../../services/storeUser/CreateStoreUserService";

class CreateStoreUserController {
    async handle(req: Request, res: Response) {
        const { userId, name, email, password, role, storeId } = req.body

        const createStoreUserService = new CreateStoreUserService()

        const storeUser = await createStoreUserService.execute({ 
            userId, 
            name, 
            email, 
            password, 
            role, 
            storeId 
        });

        return res.json(storeUser)
    }
}

export { CreateStoreUserController };