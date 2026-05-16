-- Amazon marketplace snapshots for admin analytics (?channel=amazon).
-- Populate via Selling Partner API sync (not storefront orders).

CREATE TABLE "amazon_marketplace_orders" (
    "id" TEXT NOT NULL,
    "amazonOrderId" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "orderStatus" TEXT NOT NULL,
    "orderCurrency" TEXT NOT NULL DEFAULT 'INR',
    "orderTotalBuyer" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fulfillmentChannel" TEXT,
    "shipCity" TEXT,
    "shipState" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amazon_marketplace_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "amazon_marketplace_orders_amazonOrderId_key" ON "amazon_marketplace_orders"("amazonOrderId");

CREATE INDEX "amazon_marketplace_orders_purchaseDate_idx" ON "amazon_marketplace_orders"("purchaseDate");

CREATE INDEX "amazon_marketplace_orders_orderStatus_idx" ON "amazon_marketplace_orders"("orderStatus");

CREATE TABLE "amazon_marketplace_order_lines" (
    "id" TEXT NOT NULL,
    "amazonOrderDbId" TEXT NOT NULL,
    "sku" TEXT,
    "title" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "itemSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "amazon_marketplace_order_lines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "amazon_marketplace_order_lines_amazonOrderDbId_idx" ON "amazon_marketplace_order_lines"("amazonOrderDbId");

CREATE INDEX "amazon_marketplace_order_lines_sku_idx" ON "amazon_marketplace_order_lines"("sku");

ALTER TABLE "amazon_marketplace_order_lines" ADD CONSTRAINT "amazon_marketplace_order_lines_amazonOrderDbId_fkey" FOREIGN KEY ("amazonOrderDbId") REFERENCES "amazon_marketplace_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
