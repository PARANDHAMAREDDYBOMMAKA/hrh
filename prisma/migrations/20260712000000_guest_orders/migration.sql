-- Allow guest (unauthenticated) orders: customer becomes optional, add guest fields + tracking token

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "customerId" DROP NOT NULL,
ADD COLUMN     "customerName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "customerPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "trackingToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_trackingToken_key" ON "Order"("trackingToken");
