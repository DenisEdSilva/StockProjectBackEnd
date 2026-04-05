import { Request, Response, NextFunction } from "express";
import { MeService } from "../../services/me/MeService";

class MeController {
  constructor(private meService: MeService) {}

  async handle(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await this.meService.execute({
        id: req.user.id,
        type: req.user.type,
        storeId: req.user.storeId
      });

      return res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export { MeController };