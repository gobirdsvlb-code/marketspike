import { Router } from "express";
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

// POST /coins/buy-bundle — disabled until a payment provider is wired up.
// Granting coins here without verified payment would let anyone mint free coins.
router.post("/coins/buy-bundle", requireAuth, (_req, res): void => {
  res.status(402).json({ error: "Coin purchases are not available yet" });
});

export default router;
