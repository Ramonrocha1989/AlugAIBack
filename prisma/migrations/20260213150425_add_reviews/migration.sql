-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewedUserId" TEXT NOT NULL,
    "machineId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_reviewedUserId_idx" ON "reviews"("reviewedUserId");

-- CreateIndex
CREATE INDEX "reviews_reviewerId_idx" ON "reviews"("reviewerId");

-- CreateIndex
CREATE INDEX "reviews_machineId_idx" ON "reviews"("machineId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_reviewerId_reviewedUserId_machineId_key" ON "reviews"("reviewerId", "reviewedUserId", "machineId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewedUserId_fkey" FOREIGN KEY ("reviewedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
