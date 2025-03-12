-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "lastActivityAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletionWarningSentAt" TIMESTAMP(3),
ADD COLUMN     "lastActivityAt" TIMESTAMP(3);
