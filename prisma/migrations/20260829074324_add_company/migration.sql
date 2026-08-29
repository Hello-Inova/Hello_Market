-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('SEMIANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('OWNER', 'STAFF');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "document" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'TRIAL',
    "email" TEXT,
    "phone" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#16a34a',
    "secondaryColor" TEXT NOT NULL DEFAULT '#f4f4f5',
    "fontColor" TEXT NOT NULL DEFAULT '#18181b',
    "fontFamily" TEXT NOT NULL DEFAULT 'geist',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cycle" "BillingCycle" NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "asaasCustomerId" TEXT,
    "asaasSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionInvoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "asaasPaymentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAdmin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "PlatformRole" NOT NULL DEFAULT 'STAFF',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_status_idx" ON "Company"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_companyId_key" ON "Subscription"("companyId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionInvoice_asaasPaymentId_key" ON "SubscriptionInvoice"("asaasPaymentId");

-- CreateIndex
CREATE INDEX "SubscriptionInvoice_subscriptionId_idx" ON "SubscriptionInvoice"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdmin_email_key" ON "PlatformAdmin"("email");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: add nullable companyId (no FK yet) to existing tenant-scoped models
ALTER TABLE "AdminUser" ADD COLUMN "companyId" TEXT;
CREATE INDEX "AdminUser_companyId_idx" ON "AdminUser"("companyId");

ALTER TABLE "User" ADD COLUMN "companyId" TEXT;
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

ALTER TABLE "Category" ADD COLUMN "companyId" TEXT;
CREATE INDEX "Category_companyId_idx" ON "Category"("companyId");

ALTER TABLE "Brand" ADD COLUMN "companyId" TEXT;
CREATE INDEX "Brand_companyId_idx" ON "Brand"("companyId");

ALTER TABLE "Product" ADD COLUMN "companyId" TEXT;
CREATE INDEX "Product_companyId_idx" ON "Product"("companyId");

ALTER TABLE "ProductVariant" ADD COLUMN "companyId" TEXT;
CREATE INDEX "ProductVariant_companyId_idx" ON "ProductVariant"("companyId");

ALTER TABLE "Coupon" ADD COLUMN "companyId" TEXT;
CREATE INDEX "Coupon_companyId_idx" ON "Coupon"("companyId");

ALTER TABLE "Order" ADD COLUMN "companyId" TEXT;
CREATE INDEX "Order_companyId_idx" ON "Order"("companyId");

ALTER TABLE "Page" ADD COLUMN "companyId" TEXT;
CREATE INDEX "Page_companyId_idx" ON "Page"("companyId");

ALTER TABLE "Setting" ADD COLUMN "companyId" TEXT;
CREATE INDEX "Setting_companyId_idx" ON "Setting"("companyId");

ALTER TABLE "Banner" ADD COLUMN "companyId" TEXT;
CREATE INDEX "Banner_companyId_idx" ON "Banner"("companyId");

ALTER TABLE "Review" ADD COLUMN "companyId" TEXT;
CREATE INDEX "Review_companyId_idx" ON "Review"("companyId");

ALTER TABLE "InventoryMovement" ADD COLUMN "companyId" TEXT;
CREATE INDEX "InventoryMovement_companyId_idx" ON "InventoryMovement"("companyId");

ALTER TABLE "Notification" ADD COLUMN "companyId" TEXT;
CREATE INDEX "Notification_companyId_idx" ON "Notification"("companyId");

ALTER TABLE "AuditLog" ADD COLUMN "companyId" TEXT;
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");
