import prismaClient from "../../prisma";

const INACTIVITY_MINUTES = process.env.INACTIVITY_THRESHOLD 
  ? parseInt(process.env.INACTIVITY_THRESHOLD)
  : 15;

const GRACE_PERIOD_MINUTES = process.env.INACTIVITY_GRACE 
  ? parseInt(process.env.INACTIVITY_GRACE)
  : 5;

class InactivityCheckService {
  static async execute() {
    try {
      const activityCutoff = new Date();
      activityCutoff.setMinutes(activityCutoff.getMinutes() - INACTIVITY_MINUTES);

      const inactiveUsers = await prismaClient.user.findMany({
        where: {
          lastActivityAt: { lt: activityCutoff },
          markedForDeletionAt: null
        }
      });

      const deletionDate = new Date();
      deletionDate.setMinutes(deletionDate.getMinutes() + GRACE_PERIOD_MINUTES);

      await prismaClient.$transaction(
        inactiveUsers.map(user =>
          prismaClient.user.update({
            where: { id: user.id },
            data: { 
              markedForDeletionAt: deletionDate,
              deletionWarningSentAt: new Date()
            }
          })
        )
      );

      console.log(`${inactiveUsers.length} usuários marcados para exclusão em ${GRACE_PERIOD_MINUTES} minutos`);

    } catch (error) {
      console.error("Falha na verificação de inatividade:", error);
    }
  }
}

export default InactivityCheckService;