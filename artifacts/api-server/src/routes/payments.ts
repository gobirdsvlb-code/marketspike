import { Router, type Request, type Response } from "express";
import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db, paymentsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";
import {
  COIN_BUNDLES,
  PLANS,
  findItem,
  fulfillPayment,
  getStripe,
  paymentsMode,
} from "../services/payments";

const router = Router();

// GET /payments/config — lets the UI show a "test mode" notice
router.get("/payments/config", (_req, res) => {
  res.json({ mode: paymentsMode(), plans: PLANS, coinBundles: COIN_BUNDLES });
});

// POST /payments/checkout — start a purchase. Prices always come from the server catalog.
router.post("/payments/checkout", requireAuth, async (req, res): Promise<void> => {
  const mode = paymentsMode();
  if (mode === "disabled") { res.status(503).json({ error: "Purchases are currently unavailable" }); return; }

  const userId = (req as any).userId as number;
  const { kind, itemId, returnPath } = (req.body ?? {}) as { kind?: string; itemId?: string; returnPath?: string };
  const item = findItem(String(kind), String(itemId));
  if (!item) { res.status(400).json({ error: "Unknown item" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  if (item.kind === "plan" && user.tier === item.id) {
    res.status(409).json({ error: `You're already on ${item.label}` });
    return;
  }

  const [payment] = await db
    .insert(paymentsTable)
    .values({ userId, kind: item.kind, itemId: item.id, amountCents: item.amountCents, provider: mode })
    .returning();

  if (mode === "mock") {
    res.status(201).json({
      mode: "mock",
      paymentId: payment.id,
      label: item.label,
      amountCents: item.amountCents,
    });
    return;
  }

  if (item.kind === "plan" && user.stripeSubscriptionId) {
    res.status(409).json({ error: "You already have a subscription. Use Manage subscription to change plans." });
    return;
  }

  try {
    const origin = process.env.APP_URL ?? req.get("origin");
    if (!origin) { res.status(400).json({ error: "Cannot determine return URL" }); return; }
    const path = typeof returnPath === "string" && /^\/[A-Za-z0-9/_-]*$/.test(returnPath) ? returnPath : "/upgrade";
    const base = `${origin.replace(/\/$/, "")}${path}`;

    const session = await getStripe().checkout.sessions.create({
      mode: item.kind === "plan" ? "subscription" : "payment",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: item.amountCents,
          product_data: { name: item.label },
          ...(item.kind === "plan" ? { recurring: { interval: "month" as const } } : {}),
        },
      }],
      ...(user.stripeCustomerId
        ? { customer: user.stripeCustomerId }
        : user.email ? { customer_email: user.email } : {}),
      client_reference_id: String(payment.id),
      metadata: { paymentId: String(payment.id), userId: String(userId) },
      success_url: `${base}?payment=success`,
      cancel_url: `${base}?payment=cancelled`,
    });

    await db.update(paymentsTable).set({ providerRef: session.id }).where(eq(paymentsTable.id, payment.id));
    res.status(201).json({ mode: "stripe", url: session.url });
  } catch (err) {
    console.error("[payments] checkout failed:", err);
    res.status(502).json({ error: "Could not start checkout" });
  }
});

// POST /payments/mock/confirm — completes a test-mode purchase. Only exists while no Stripe key is set.
router.post("/payments/mock/confirm", requireAuth, async (req, res): Promise<void> => {
  if (paymentsMode() !== "mock") { res.status(404).json({ error: "Not found" }); return; }

  const userId = (req as any).userId as number;
  const paymentId = Number((req.body ?? {}).paymentId);
  if (!Number.isInteger(paymentId)) { res.status(400).json({ error: "Invalid payment" }); return; }

  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(and(eq(paymentsTable.id, paymentId), eq(paymentsTable.userId, userId), eq(paymentsTable.provider, "mock")))
    .limit(1);
  if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }

  await fulfillPayment(payment.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.json({ success: true, tier: user?.tier, coins: user?.coins });
});

// POST /payments/manage — Stripe billing portal (change/cancel plan); in mock mode, cancels to Free
router.post("/payments/manage", requireAuth, async (req, res): Promise<void> => {
  const mode = paymentsMode();
  const userId = (req as any).userId as number;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  if (mode === "mock") {
    await db.update(usersTable).set({ tier: "free" }).where(eq(usersTable.id, userId));
    res.json({ mode: "mock", tier: "free" });
    return;
  }
  if (mode === "disabled" || !user.stripeCustomerId) {
    res.status(400).json({ error: "No active subscription to manage" });
    return;
  }

  try {
    const origin = process.env.APP_URL ?? req.get("origin");
    const portal = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      ...(origin ? { return_url: `${origin.replace(/\/$/, "")}/upgrade` } : {}),
    });
    res.json({ mode: "stripe", url: portal.url });
  } catch (err) {
    console.error("[payments] portal failed:", err);
    res.status(502).json({ error: "Could not open billing portal" });
  }
});

// Mounted in app.ts with a raw body parser — Stripe signs the exact bytes.
export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (paymentsMode() !== "stripe" || !secret) { res.status(503).json({ error: "Webhook not configured" }); return; }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, req.headers["stripe-signature"] as string, secret);
  } catch {
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = Number(session.metadata?.paymentId);
      if (session.payment_status === "paid" && Number.isInteger(paymentId)) {
        const id = (v: string | { id: string } | null) => (typeof v === "string" ? v : v?.id ?? null);
        await fulfillPayment(paymentId, {
          customerId: id(session.customer),
          subscriptionId: id(session.subscription),
        });
      }
    } else if (
      event.type === "customer.subscription.deleted" ||
      (event.type === "customer.subscription.updated" &&
        ["canceled", "unpaid", "incomplete_expired"].includes((event.data.object as Stripe.Subscription).status))
    ) {
      const sub = event.data.object as Stripe.Subscription;
      await db
        .update(usersTable)
        .set({ tier: "free", stripeSubscriptionId: null })
        .where(eq(usersTable.stripeSubscriptionId, sub.id));
    }
    res.json({ received: true });
  } catch (err) {
    console.error("[payments] webhook handling failed:", err);
    res.status(500).json({ error: "Webhook handling failed" });
  }
}

export default router;
