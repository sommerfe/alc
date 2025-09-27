-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('percent', 'absolute');

-- AlterTable
ALTER TABLE "OrderLine" ADD COLUMN     "discountType" "DiscountType",
ADD COLUMN     "discountValue" DECIMAL(18,2);
