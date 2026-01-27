/**
 * Transaction History Routes (Stubbed)
 */

import { Router, type Request, type Response } from 'express';
import type { Router as RouterType } from 'express';

const router: RouterType = Router();

router.get('/transactions/:playerAddress', (_req: Request, res: Response) => {
  res.json({ transactions: [], message: 'Transaction history not yet implemented' });
});

export default router;
