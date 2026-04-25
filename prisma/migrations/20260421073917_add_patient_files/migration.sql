-- CreateTable
CREATE TABLE "patient_files" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" VARCHAR(100),
    "category" VARCHAR(30) NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_files_patient_id_idx" ON "patient_files"("patient_id");

-- AddForeignKey
ALTER TABLE "patient_files" ADD CONSTRAINT "patient_files_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
