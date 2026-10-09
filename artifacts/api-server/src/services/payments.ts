import Stripe from "stripe";
import { and, eq, sql } from "drizzle-orm";
import { db, paymentsTable, usersTable } from "@workspace/db";

export const COIN_BUNDLES = [
  { id: "starter", coins: 500,   label: "Starter Pack", amountCents: 99,   bonus: null },
  { id: "value",   coins: 2000,  label: "Value Pack",   amountCents: 299,  bonus: "+200 bonus" },
  { id: "mega",    coins: 5500,  label: "Mega Pack",    amountCents: 699,  bonus: "+500 bonus" },
  { id: "ultra",   coins: 15000, label: "Ultra Pack",   amountCents: 1499, bonus: "+2000 bonus" },
];

export const PLANS = [
  { id: "pro",   label: "Spike Pro",   amountCents: 499 },
  { id: "elite", label: "Spike Elite", amountCents: 999 },
];

export type PaymentKind = "coins" | "plan";

export function findItem(kind: string, itemId: string) {
  if (kind === "coins") {
    const b = COIN_BUNDLES.find(x => x.id === itemId);
    return b && { kind: "coins" as const, id: b.id, label: b.label, amountCents: b.amountCents, coins: b.coins };
  }
  if (kind === "plan") {
    const p = PLANS.find(x => x.id === itemId);
    return p && { kind: "plan" as const, id: p.id, label: p.label, amountCents: p.amountCents, coins: 0 };
  }
  return undefined;
}

/**
 * "stripe" once STRIPE_SECRET_KEY is set, otherwise "mock" (purchases succeed
 * after a test-mode confirmation, no money moves). PAYMENTS_MODE=disabled
 * turns purchases off entirely.
 */
export function paymentsMode(): "stripe" | "mock" | "disabled" {
  if (process.env.PAYMENTS_MODE === "disabled") return "disabled";
  return process.env.STRIPE_SECRET_KEY ? "stripe" : "mock";
}

let stripeClient: Stripe | null = null;
export function getStripe(): Stripe {
  if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  return stripeClient;
}

/**
 * Marks a pending payment paid and applies the purchase. Idempotent: only the
 * call that flips pending -> paid applies the grant, so webhook retries and
 * double-clicks can't double-credit. Returns false if already fulfilled.
 */
export async function fulfillPayment(
  paymentId: number,
  stripeIds?: { customerId?: string | null; subscriptionId?: string | null },
): Promise<boolean> {
  return db.transaction(async tx => {
    const [payment] = await tx
      .update(paymentsTable)
      .set({ status: "paid", paidAt: new Date() })
      .where(and(eq(paymentsTable.id, paymentId), eq(paymentsTable.status, "pending")))
      .returning();
    if (!payment) return false;

    if (payment.kind === "coins") {
      const bundle = COIN_BUNDLES.find(b => b.id === payment.itemId);
      if (!bundle) throw new Error(`Unknown coin bundle ${payment.itemId}`);
      await tx
        .update(usersTable)
        .set({ coins: sql`${usersTable.coins} + ${bundle.coins}` })
        .where(eq(usersTable.id, payment.userId));
    } else {
      await tx
        .update(usersTable)
        .set({
          tier: payment.itemId,
          ...(stripeIds?.customerId ? { stripeCustomerId: stripeIds.customerId } : {}),
          ...(stripeIds?.subscriptionId ? { stripeSubscriptionId: stripeIds.subscriptionId } : {}),
        })
        .where(eq(usersTable.id, payment.userId));
    }
    return true;
  });
}
