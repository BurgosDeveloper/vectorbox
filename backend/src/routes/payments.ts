import { Router } from 'express';
import { provincialWebhook, simulateBankTransaction, getExchangeRate } from '../controllers/payments';

const router = Router();

// Ruta pública para simulación de webhook de Pago Móvil Provincial
router.post('/provincial-webhook', provincialWebhook);

// Ruta pública para simulación directa de transacciones bancarias (Zelle y Provincial)
router.post('/simulate-bank-transaction', simulateBankTransaction);

// Ruta pública para obtener la tasa de cambio de Binance P2P
router.get('/exchange-rate', getExchangeRate);

export default router;


