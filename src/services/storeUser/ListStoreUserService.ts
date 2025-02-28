import prismaClient from "../../prisma";

interface UserRequest {
    storeId: number
}

class ListStoreUserService {
    async execute({ storeId }: UserRequest) {
        const storeUserList = await prismaClient.storeUser.findMany({
            where: {
                storeId: storeId
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                storeId: true
            }
        })

        return storeUserList
    }
}

export { ListStoreUserService }