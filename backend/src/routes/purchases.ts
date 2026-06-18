import { Router } from 'express';
import { checkout, submitPayment, getMyPurchases } from '../controllers/purchases';
import { verifyToken } from '../middlewares/auth';

const router = Router();

// Rutas protegidas de compras
router.get('/', verifyToken, getMyPurchases);
router.post('/checkout', verifyToken, checkout);
router.post('/submit-payment', verifyToken, submitPayment);

export default router;
