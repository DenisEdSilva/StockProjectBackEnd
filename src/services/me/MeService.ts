import prismaClient from "../../prisma";
import { NotFoundError } from "../../errors";
import { AccessControlProvider } from "../../shared/AccessControlProvider";

interface MeResponse {
  type: 'OWNER' | 'STORE_USER';
  id: number;
  name: string;
  email: string;
  storeId?: number;
  permissions?: Array<{ action: string; resource: string }>;
}

class MeService {
  constructor(private accessControlProvider: AccessControlProvider) {}

  async execute(user: { id: number; type: 'OWNER' | 'STORE_USER'; storeId?: number }): Promise<MeResponse> {
    if (user.type === 'OWNER') {
      return await this.getOwnerData(user.id);
    }

    const acl = await this.accessControlProvider.uintToACL(user.id, prismaClient);

    console.log("Usuario encontrado: ", acl, "ID do usuário:", user.id);

    return {
      type: 'STORE_USER',
      id: acl.id,
      name: acl.name,
      email: acl.email,
      storeId: acl.storeId,
      permissions: acl.permissions
    };
  }

  private async getOwnerData(userId: number): Promise<MeResponse> {
    const owner = await prismaClient.user.findUnique({
      where: { 
        id: userId, 
        isDeleted: false 
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!owner) throw new NotFoundError("OwnerNotFound");

    return {
      type: 'OWNER',
      id: owner.id,
      name: owner.name,
      email: owner.email
    };
  }
}

export { MeService };