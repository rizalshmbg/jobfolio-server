-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CREATED', 'STATUS_CHANGED');

-- CreateTable
CREATE TABLE "application_activity" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "application_activity_applicationId_createdAt_idx" ON "application_activity"("applicationId", "createdAt");

-- AddForeignKey
ALTER TABLE "application_activity" ADD CONSTRAINT "application_activity_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
