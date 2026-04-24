import { Request, Response, NextFunction } from "express";
import { ListTransferDestinationsService } from "../../services/store/ListTransferDestinationsService";

interface AuthRequest extends Request {
	user: {
		id: number;
		type: 'OWNER' | 'STORE_USER';
		storeId?: number;
	};
}

class ListTransferDestinationsController {
	constructor(private service: ListTransferDestinationsService) {}

	async handle(req: Request, res: Response, next: NextFunction) {
		try {
			const result = await this.service.execute({
				userId: (req as AuthRequest).user.id,
				userType: (req as AuthRequest).user.type,
				tokenStoreId: (req as AuthRequest).user.storeId,
				storeId: Number(req.params.storeId)
			});

			return res.status(200).json(result);
		} catch (error) {
			next(error);
		}
	}
}

export { ListTransferDestinationsController };