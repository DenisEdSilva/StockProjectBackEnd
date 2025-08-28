import prismaClient from "../../prisma";

interface GetOwnerByIdRequest {
    ownerId: number;
}

class GetOwnerByIdService {
    async execute(data: GetOwnerByIdRequest) {
        return await prismaClient.$transaction(async (tx) => {
            return await tx.user.findUnique({ 
                where: { 
                    id: data.ownerId 
                },
                select: {
                    id: true,
                    name: true,
                    ownedStores: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });
        })
    }
}

export { GetOwnerByIdService };