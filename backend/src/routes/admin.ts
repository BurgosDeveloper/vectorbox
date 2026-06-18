import { Router } from 'express';
import {
  createProduct,
  createCategory,
  deleteCategory,
  getAllPurchases,
  approvePurchase,
  rejectPurchase,
  reconcileCSV,
} from '../controllers/admin';
import { verifyToken, requireRole } from '../middlewares/auth';

const router = Router();

// Secure all admin routes with authentication and role restriction (MAFER or DEV)
router.use(verifyToken);
router.use(requireRole(['MAFER', 'DEV']));

router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);
router.post('/products', createProduct);
router.get('/purchases', getAllPurchases);
router.post('/purchases/:id/approve', approvePurchase);
router.post('/purchases/:id/reject', rejectPurchase);
router.post('/reconcile-csv', reconcileCSV);

export default router;
