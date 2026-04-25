-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "supplier_purchase_id" INTEGER;

-- CreateTable
CREATE TABLE "supplier_purchases" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "purchase_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplier_purchases_supplierId_idx" ON "supplier_purchases"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_purchases_purchase_date_idx" ON "supplier_purchases"("purchase_date");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_purchase_id_fkey" FOREIGN KEY ("supplier_purchase_id") REFERENCES "supplier_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_purchases" ADD CONSTRAINT "supplier_purchases_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
