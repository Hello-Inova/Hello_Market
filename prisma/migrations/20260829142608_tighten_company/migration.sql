-- Step C (Fase 1): tighten multi-tenant constraints.
-- Safe to run now because the Step B backfill (scripts/backfill-company.ts)
-- has already given every existing row a companyId — verified via the
-- backfill script's own null-count report before this migration shipped.

-- AlterTable: companyId becomes required
ALTER TABLE "AdminUser" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Brand" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "ProductVariant" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Coupon" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Page" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Setting" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Banner" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Review" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "InventoryMovement" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Notification" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "companyId" SET NOT NULL;

-- AddForeignKey: companyId now points at Company
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id");
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id");
ALTER TABLE "Category" ADD CONSTRAINT "Category_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id");
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id");
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id");
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id");
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id");
ALTER TABLE "Order" ADD CONSTRAINT "Order_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id");
ALTER TABLE "Page" ADD CONSTRAINT "Page_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id");
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id");
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id");
ALTER TABLE "Review" ADD CONSTRAINT "Review_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id");
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id");
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id");

-- DropIndex: retire the old globally-unique indexes
DROP INDEX "AdminUser_email_key";
DROP INDEX "User_email_key";
DROP INDEX "Category_slug_key";
DROP INDEX "Brand_slug_key";
DROP INDEX "Product_slug_key";
DROP INDEX "Product_sku_key";
DROP INDEX "ProductVariant_sku_key";
DROP INDEX "Coupon_code_key";
DROP INDEX "Order_orderNumber_key";
DROP INDEX "Page_slug_key";
DROP INDEX "Setting_key_key";

-- CreateIndex: composite unique indexes scoped per company
CREATE UNIQUE INDEX "AdminUser_companyId_email_key" ON "AdminUser"("companyId", "email");
CREATE UNIQUE INDEX "User_companyId_email_key" ON "User"("companyId", "email");
CREATE UNIQUE INDEX "Category_companyId_slug_key" ON "Category"("companyId", "slug");
CREATE UNIQUE INDEX "Brand_companyId_slug_key" ON "Brand"("companyId", "slug");
CREATE UNIQUE INDEX "Product_companyId_slug_key" ON "Product"("companyId", "slug");
CREATE UNIQUE INDEX "Product_companyId_sku_key" ON "Product"("companyId", "sku");
CREATE UNIQUE INDEX "ProductVariant_companyId_sku_key" ON "ProductVariant"("companyId", "sku");
CREATE UNIQUE INDEX "Coupon_companyId_code_key" ON "Coupon"("companyId", "code");
CREATE UNIQUE INDEX "Order_companyId_orderNumber_key" ON "Order"("companyId", "orderNumber");
CREATE UNIQUE INDEX "Page_companyId_slug_key" ON "Page"("companyId", "slug");
CREATE UNIQUE INDEX "Setting_companyId_key_key" ON "Setting"("companyId", "key");
