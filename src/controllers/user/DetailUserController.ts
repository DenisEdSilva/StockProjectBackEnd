import { Request, Response } from "express";
import  { DetailUserService }  from "../../services/user/DetailUserService";

interface UserRequest {
    userId: number
}

class DetailUserController {
    async handle(req: Request, res: Response) {

        const userId = req.userId;
        const userRequest: UserRequest = { userId };

        const detailUserService = new DetailUserService();
    
        const user = await detailUserService.execute(userRequest);
    
        return res.json(user);
    }
}

export { DetailUserController }