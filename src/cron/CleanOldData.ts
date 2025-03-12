import prismaClient from "../prisma";
import cron from "node-cron";

const RETENTION_MINUTES = process.env.SOFT_DELETE_RETENTION_MINUTES 
  ? parseInt(process.env.SOFT_DELETE_RETENTION_MINUTES)
  : 30;

async function cleanDeletedData() {
  const retentionDate = new Date();
  retentionDate.setMinutes(retentionDate.getMinutes() - RETENTION_MINUTES);

  try {
    await prismaClient.$transaction([
      prismaClient.stockMovimentStore.deleteMany({
        where: {
          isDeleted: true,
          deletedAt: { lt: retentionDate }
        }
      }),
      prismaClient.stockMoviment.deleteMany({
        where: {
          isDeleted: true,
          deletedAt: { lt: retentionDate }
        }
      }),
      prismaClient.product.deleteMany({
        where: {
          isDeleted: true,
          deletedAt: { lt: retentionDate }
        }
      }),
      prismaClient.category.deleteMany({
        where: {
          isDeleted: true,
          deletedAt: { lt: retentionDate }
        }
      })
    ]);

    const deletedStores = await prismaClient.store.findMany({
      where: {
        isDeleted: true,
        deletedAt: { lt: retentionDate }
      }
    });

    for (const store of deletedStores) {
      await prismaClient.$transaction(async (tx) => {
        await Promise.all([
          tx.stockMovimentStore.deleteMany({ where: { storeId: store.id } }),
          tx.stockMoviment.deleteMany({ where: { storeId: store.id } }),
          tx.product.deleteMany({ where: { storeId: store.id } }),
          tx.category.deleteMany({ where: { storeId: store.id } }),
          tx.storeUser.deleteMany({ where: { storeId: store.id } }),
          tx.role.deleteMany({ where: { storeId: store.id } })
        ]);

        // Deletar loja
        await tx.store.delete({ where: { id: store.id } });
      });

      console.log(`Store ${store.name} and related data permanently deleted`);
    }

    const logRetentionDate = new Date();
    logRetentionDate.setDate(logRetentionDate.getDate() - 7);
    
    await prismaClient.auditLog.deleteMany({
      where: {
        createdAt: { lt: logRetentionDate }
      }
    });

    console.log("Cleanup completed successfully");
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
}

cron.schedule("*/15 * * * *", () => {
  cleanDeletedData().catch(console.error);
});