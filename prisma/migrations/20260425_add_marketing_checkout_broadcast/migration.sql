-- ==================== USER: marketing + phone prompt fields ====================

ALTER TABLE "users"
  ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "marketingOptInAt" TIMESTAMP(3),
  ADD COLUMN "phonePromptDismissedAt" TIMESTAMP(3);

CREATE INDEX "users_marketingOptIn_idx" ON "users"("marketingOptIn");

-- ==================== ENUMS ====================

CREATE TYPE "CheckoutStatus" AS ENUM ('STARTED', 'ABANDONED', 'RECOVERED', 'EXPIRED');

CREATE TYPE "BroadcastStatus" AS ENUM ('PENDING', 'SENDING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED');

-- ==================== CHECKOUT SESSIONS ====================

CREATE TABLE "checkout_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "name" TEXT,
    "cartSnapshot" JSONB NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "CheckoutStatus" NOT NULL DEFAULT 'STARTED',
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "couponSentAt" TIMESTAMP(3),
    "couponId" TEXT,
    "orderId" TEXT,
    "recoveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "checkout_sessions_status_lastActivityAt_idx" ON "checkout_sessions"("status", "lastActivityAt");
CREATE INDEX "checkout_sessions_phone_idx" ON "checkout_sessions"("phone");
CREATE INDEX "checkout_sessions_userId_idx" ON "checkout_sessions"("userId");

ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_couponId_fkey"
  FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ==================== BROADCASTS ====================

CREATE TABLE "broadcasts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "templateLanguage" TEXT NOT NULL DEFAULT 'en',
    "templateParams" JSONB NOT NULL,
    "audienceFilter" JSONB NOT NULL,
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "BroadcastStatus" NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broadcasts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "broadcasts_status_idx" ON "broadcasts"("status");
CREATE INDEX "broadcasts_createdAt_idx" ON "broadcasts"("createdAt");

CREATE TABLE "broadcast_recipients" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "messageId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcast_recipients_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "broadcast_recipients_broadcastId_status_idx" ON "broadcast_recipients"("broadcastId", "status");
CREATE INDEX "broadcast_recipients_phone_idx" ON "broadcast_recipients"("phone");

ALTER TABLE "broadcast_recipients" ADD CONSTRAINT "broadcast_recipients_broadcastId_fkey"
  FOREIGN KEY ("broadcastId") REFERENCES "broadcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
