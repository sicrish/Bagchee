-- CreateTable
CREATE TABLE "email_delivery_logs" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_delivery_logs_campaign_id_status_idx" ON "email_delivery_logs"("campaign_id", "status");

-- AddForeignKey
ALTER TABLE "email_delivery_logs" ADD CONSTRAINT "email_delivery_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "scheduled_emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
