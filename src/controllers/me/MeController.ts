// src/controllers/core/MeController.ts
import { Request, Response, NextFunction } from "express";
import { MeService } from "../../services/me/MeService";

class MeController {
  async handle(req: Request, res: Response, next: NextFunction) {
    try {
      const meService = new MeService();
      
      const response = await meService.execute({
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