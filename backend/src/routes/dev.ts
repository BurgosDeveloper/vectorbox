import { Router } from 'express';
import {
  getMetrics,
  getUsers,
  updateUser,
  deleteUser,
  getLogs,
} from '../controllers/dev';
import { verifyToken, requireRole } from '../middlewares/auth';

const router = Router();

// Secure all developer routes with token verification and role restriction (DEV only)
router.use(verifyToken);
router.use(requireRole(['DEV']));

router.get('/metrics', getMetrics);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/logs', getLogs);

export default router;
