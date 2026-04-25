-- CreateTable
CREATE TABLE "LabOrder" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "toothNumber" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "labName" TEXT NOT NULL,
    "sendDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "receiveDate" TIMESTAMP(3),
    "cost" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
