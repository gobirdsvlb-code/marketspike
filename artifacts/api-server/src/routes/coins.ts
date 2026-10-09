import { Router } from "express";
import { COIN_BUNDLES } from "../services/payments";

const router = Router();

// GET /coins/bundles — list available bundles (purchases go through /payments/checkout)
router.get("/coins/bundles", (_req, res) => {
  res.json(COIN_BUNDLES.map(b => ({ ...b, price: b.amountCents / 100 })));
});

export default router;
