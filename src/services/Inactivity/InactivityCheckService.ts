import prismaClient from "../../prisma";

class InactivityCheckService {
	static async execute() {
		try {
			const INACTIVITY_MINUTES = process.env.INACTIVITY_THRESHOLD ? parseInt(process.env.INACTIVITY_THRESHOLD) : 15;
			const GRACE_PERIOD_MINUTES = process.env.INACTIVITY_GRACE ? parseInt(process.env.INACTIVITY_GRACE) : 5;

			const activityCutoff = new Date();
			activityCutoff.setMinutes(activityCutoff.getMinutes() - INACTIVITY_MINUTES);

			const deletionDate = new Date();
			deletionDate.setMinutes(deletionDate.getMinutes() + GRACE_PERIOD_MINUTES);

			const result = await prismaClient.user.updateMany({
				where: {
					lastActivityAt: { lt: activityCutoff },
					markedForDeletionAt: null,
					isOwner: true
				},
				data: { 
					markedForDeletionAt: deletionDate,
					deletionWarningSentAt: new Date()
				}
			});

			if (result.count > 0) {
				console.log(`[Inactivity] ${result.count} usuários marcados para exclusão em ${GRACE_PERIOD_MINUTES} minutos.`);
			}

		} catch (error) {
			console.error("Falha na verificação de inatividade:", error);
		}
	}
}

export default InactivityCheckService;