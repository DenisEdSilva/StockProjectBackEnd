import prismaClient from "../../prisma";
import { hash } from "bcryptjs";

interface UserRequest {
    userId: number;
    storeId: number;
    name?: string;
    email?: string;
    password?: string;
    role?: string;
}

class UpdateStoreUserService {
    async execute({ userId, storeId, name, email, password, role }: UserRequest) {

        const passwordHash = await hash(password, 8)

        try {
            const storeUser = await prismaClient.storeUser.update({
                where: {
                    id: userId,
                    storeId: storeId
                    
                },
                data: {
                    name: name,
                    email: email,
                    password: passwordHash,
                    role: role,
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
            return storeUser;
        } catch (err) {
            throw new Error("User cannot be finded");

        }
    }
}

export { UpdateStoreUserService }