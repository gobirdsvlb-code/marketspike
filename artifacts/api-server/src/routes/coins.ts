import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

export const COIN_BUNDLES = [
  { id: "starter", coins: 500,   label: "Starter Pack",  price: 0.99,  bonus: null },
  { id: "value",   coins: 2000,  label: "Value Pack",    price: 2.99,  bonus: "+200 bonus" },
  { id: "mega",    coins: 5500,  label: "Mega Pack",     price: 6.99,  bonus: "+500 bonus" },
  { id: "ultra",   coins: 15000, label: "Ultra Pack",    price: 14.99, bonus: "+2000 bonus" },
];

// GET /coins/bundles — list available bundles
router.get("/coins/bundles", (_req, res) => {
  res.json(COIN_BUNDLES);
});

// POST /coins/buy-bundle — grant coins immediately (demo; production would gate behind payment webhook)
router.post("/coins/buy-bundle", requireAuth, async (req, res): Promise<void> => {
  const { bundleId } = req.body as { bundleId: string };
  const bundle = COIN_BUNDLES.find(b => b.id === bundleId);
  if (!bundle) { res.status(400).json({ error: "Invalid bundle ID" }); return; }

  const userId = (req as any).userId;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!users[0]) { res.status(404).json({ error: "User not found" }); return; }

  const newCoins = users[0].coins + bundle.coins;
  await db.update(usersTable).set({ coins: newCoins }).where(eq(usersTable.id, userId));

  res.json({ success: true, coinsAdded: bundle.coins, newCoins });
});

export default router;
