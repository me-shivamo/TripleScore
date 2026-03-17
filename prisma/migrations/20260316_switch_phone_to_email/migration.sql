-- DropIndex
DROP INDEX "User_phoneNumber_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phoneNumber",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "email" TEXT NOT NULL DEFAULT '';

-- Backfill: remove default after column is created
ALTER TABLE "User" ALTER COLUMN "email" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
