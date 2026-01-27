/**
 * Transaction History Routes (Stubbed)
 */

import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/transactions/:playerAddress', (_req: Request, res: Response) => {
  res.json({ transactions: [], message: 'Transaction history not yet implemented' });
});

export default router;
