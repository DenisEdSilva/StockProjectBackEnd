import prismaClient from "../../prisma";
import { hash } from "bcryptjs";

interface StoreUserRequest {
    userId: number;
    name: string;
    email: string;
    password: string;
    roleId: number;
    storeId: number;
}

class CreateStoreUserService {
    async execute({ userId, name, email, password, roleId, storeId }: StoreUserRequest) {

        const passwordHash = await hash(password, 8)


        const storeUser = await prismaClient.storeUser.create({
            data: {
                createdBy: userId,
                name: name,
                email: email,
                password: passwordHash,
                roleId: roleId,
                storeId: storeId
            },
            select: {
                id: true,
                name: true,
                email: true,
                roleId: true,
                storeId: true
            }
        })

        return storeUser
    }
}

export { CreateStoreUserService };