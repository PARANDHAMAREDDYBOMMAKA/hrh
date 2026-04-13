/*
  Warnings:

  - You are about to drop the column `categoryId` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Menu` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `slotType` to the `MenuItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_menuId_fkey";

-- DropForeignKey
ALTER TABLE "MenuItem" DROP CONSTRAINT "MenuItem_categoryId_fkey";

-- DropIndex
DROP INDEX "MenuItem_categoryId_isAvailable_idx";

-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN "categoryId",
ADD COLUMN     "slotType" "SlotType" NOT NULL;

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Menu";

-- CreateIndex
CREATE INDEX "MenuItem_slotType_isAvailable_idx" ON "MenuItem"("slotType", "isAvailable");
