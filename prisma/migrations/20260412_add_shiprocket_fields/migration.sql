-- AlterTable
ALTER TABLE "order_shipping" ADD COLUMN "shiprocketOrderId" INTEGER;
ALTER TABLE "order_shipping" ADD COLUMN "shiprocketShipmentId" INTEGER;
ALTER TABLE "order_shipping" ADD COLUMN "awbCode" TEXT;
