import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";

interface ListTransferDestinationsRequest {
	storeId: number;
	userId: number;
	userType: 'OWNER' | 'STORE_USER';
	tokenStoreId?: number;
}

class ListTransferDestinationsService {
	async execute(data: ListTransferDestinationsRequest) {
		return await prismaClient.$transaction(async (tx) => {
			this.validateInput(data);

			const originStore = await tx.store.findUnique({
				where: {
					id: data.storeId,
					isDeleted: false
				},
				select: {
					id: true,
					ownerId: true
				}
			});

			if (!originStore) {
				throw new NotFoundError("StoreNotFound");
			}

			if (data.userType === 'OWNER') {
				if (originStore.ownerId !== data.userId) {
					throw new ForbiddenError("UnauthorizedAccess");
				}
			}

			if (data.userType === 'STORE_USER') {
				if (!Number.isInteger(data.tokenStoreId)) {
					throw new ValidationError("InvalidTokenStoreId");
				}

				if (data.tokenStoreId !== data.storeId) {
					throw new ForbiddenError("UnauthorizedAccess");
				}
			}

			const stores = await tx.store.findMany({
				where: {
					ownerId: originStore.ownerId,
					id: { not: data.storeId },
					isDeleted: false
				},
				select: {
					id: true,
					name: true,
					city: true,
					state: true
				},
				orderBy: {
					name: 'asc'
				}
			});

			return {
				stores
			};
		});
	}

	private validateInput(data: ListTransferDestinationsRequest) {
		if (!Number.isInteger(data.storeId)) {
			throw new ValidationError("InvalidStoreId");
		}

		if (!Number.isInteger(data.userId)) {
			throw new ValidationError("InvalidUserId");
		}

		if (!['OWNER', 'STORE_USER'].includes(data.userType)) {
			throw new ValidationError("InvalidUserType");
		}

		if (data.userType === 'STORE_USER') {
			if (!Number.isInteger(data.tokenStoreId)) {
				throw new ValidationError("InvalidTokenStoreId");
			}
		}
	}
}

export { ListTransferDestinationsService };