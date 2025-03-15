import cron from "node-cron";
import prismaClient from "../prisma";

const DELETION_PERIOD_MINUTES = process.env.USER_DELETION_PERIOD 
  ? parseInt(process.env.USER_DELETION_PERIOD)
  : 30;

async function deleteMarkedUsers() {
  const cutoffDate = new Date();
  cutoffDate.setMinutes(cutoffDate.getMinutes() - DELETION_PERIOD_MINUTES);

  try {
    const usersToDelete = await prismaClient.user.findMany({
      where: {
        markedForDeletionAt: { lt: cutoffDate },
      },
      include: {
        ownedStores: {
          include: {
            products: true,
            categories: true
          }
        }
      }
    });

    for (const user of usersToDelete) {
      await prismaClient.$transaction(async (tx) => {
        await Promise.all([
          tx.store.deleteMany({ where: { ownerId: user.id } }),
        ]);
        
        await tx.user.delete({ where: { id: user.id } });
      });
      console.log(`Usuário ${user.email} excluído após ${DELETION_PERIOD_MINUTES} minutos`);
    }
  } catch (error) {
    console.error("Falha na exclusão de usuários:", error);
  }
}

cron.schedule("*/5 * * * *", () => {
  console.log("Iniciando rotina de exclusão de usuários...");
  deleteMarkedUsers().catch(console.error);
});