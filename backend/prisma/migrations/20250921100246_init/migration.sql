-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('open', 'in_progress', 'closed');

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "requestorName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "vatId" TEXT NOT NULL,
    "commodityGroup" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "totalCost" DECIMAL(18,2) NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "positionDescription" TEXT NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "amount" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "totalPrice" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
