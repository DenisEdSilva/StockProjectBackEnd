import prismaClient from "../../prisma";
import { hash } from "bcryptjs";
import { 
    ValidationError, 
    ConflictError, 
    NotFoundError 
} from "../../errors";

interface StoreUserRequest {
    name: string;
    email: string;
    password: string;
    roleId: number;
    storeId: number;
    createdBy: number;
}

class CreateStoreUserService {
    async execute(data: StoreUserRequest) {
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);

            const [emailExists, roleExists] = await Promise.all([
                tx.storeUser.findUnique({ where: { email: data.email }}),
                tx.role.findUnique({ where: { id: data.roleId }})
            ]);

            if (emailExists) throw new ConflictError("Email already registered");
            if (!roleExists) throw new NotFoundError("Role not found");

            const passwordHash = await hash(data.password, 12);

            return await tx.storeUser.create({
                data: {
                    ...data,
                    password: passwordHash
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    roleId: true
                }
            });
        });
    }

    private isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    private validateInput(data: StoreUserRequest) {
        if (!data.name?.trim()) throw new ValidationError("Invalid name");
        if (!this.isValidEmail(data.email)) throw new ValidationError("Invalid email");
        if (data.password.length < 8) throw new ValidationError("Password must be at least 8 characters");
        if (!data.roleId || isNaN(data.roleId)) throw new ValidationError("Invalid role ID");
        if (!data.storeId || isNaN(data.storeId)) throw new ValidationError("Invalid store ID");
    }
}

export { CreateStoreUserService };