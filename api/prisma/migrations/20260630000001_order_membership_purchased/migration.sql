-- Explicit "this order purchased a membership" flag.
--
-- Drives membership activation off the PURCHASE (M1: a non-member who buys a membership now
-- gets activated + charged the fee) instead of off the overloaded `membership` ("got the
-- member discount") field — which also stops existing members from being silently
-- re-subscribed (membershipEnd reset + a duplicate "Welcome" email) on every order (M2).
ALTER TABLE "orders" ADD COLUMN "membership_purchased" BOOLEAN NOT NULL DEFAULT false;

-- Store the membership purchase fee (in the order currency) so the receipt/invoice can show it
-- as its own line and the totals reconcile.
ALTER TABLE "orders" ADD COLUMN "membership_fee" DOUBLE PRECISION NOT NULL DEFAULT 0;
