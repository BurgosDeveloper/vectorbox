import { Router } from 'express';
import { handleSMSWebhook } from '../controllers/webhooks';

const router = Router();

// El endpoint será POST /api/webhooks/sms
router.post('/sms', handleSMSWebhook);

export default router;
