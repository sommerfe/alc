/*
  Warnings:

  - You are about to drop the column `commodityGroup` on the `Request` table. All the data in the column will be lost.
  - Added the required column `commodityGroupId` to the `Request` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Request" DROP COLUMN "commodityGroup",
ADD COLUMN     "commodityGroupId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "CommodityGroup" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "group" TEXT NOT NULL,

    CONSTRAINT "CommodityGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_commodityGroupId_fkey" FOREIGN KEY ("commodityGroupId") REFERENCES "CommodityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
