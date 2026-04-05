import prismaClient from "../../prisma";
import { Prisma } from "@prisma/client";

interface TrackActivityParams {
  tx?: Prisma.TransactionClient;
  storeId?: number;
  userId?: number;
  userType?: "OWNER" | "STORE_USER"; 
}

class ActivityTracker {
  async track({ tx, storeId, userId, userType }: TrackActivityParams) {
    const client = tx || prismaClient;
    const updates = [];

    if (storeId) {
      updates.push(
        client.store.update({
          where: { 
            id: storeId 
          },
          data: { 
            lastActivityAt: new Date() 
          }
        }).catch(() => {})
      );
    }

    if (userId) {
      if (userType === "STORE_USER") {
        updates.push(client.storeUser.update({
          where: { 
            id: userId 
          },
          data: { 
            lastActivityAt: new Date() 
          }
        }).catch(() => {}));
      } else {
        updates.push(
          client.user.update({
            where: { 
              id: userId 
            },
            data: { 
              lastActivityAt: new Date() 
            }
          }).catch((error) => {
            console.error(`Failed to update lastActivityAt for userId ${userId}:`, error);
          }
        ));
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }
  }
}

export { ActivityTracker };