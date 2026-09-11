-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('DELIVERY', 'DINE_IN');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'MOBILE_WALLET');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "DiscountScope" AS ENUM ('GLOBAL', 'CATEGORY', 'SELECTIVE_ITEMS');

-- AlterTable: dish detail enhancements
ALTER TABLE "MenuItem"
  ADD COLUMN "calories" INTEGER,
  ADD COLUMN "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: dual fulfillment + payment verification
ALTER TABLE "Order"
  ADD COLUMN "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'DELIVERY',
  ADD COLUMN "deliveryAddress" TEXT,
  ADD COLUMN "contactPhone" TEXT,
  ADD COLUMN "tableNumber" INTEGER,
  ADD COLUMN "paymentMethod" "PaymentMethod",
  ADD COLUMN "paymentVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: promotional discount rules
CREATE TABLE "DiscountRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "scope" "DiscountScope" NOT NULL,
    "category" TEXT,
    "targetItemIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscountRule_code_key" ON "DiscountRule"("code");

-- CreateIndex
CREATE INDEX "DiscountRule_isActive_idx" ON "DiscountRule"("isActive");

-- CreateIndex
CREATE INDEX "DiscountRule_scope_idx" ON "DiscountRule"("scope");
