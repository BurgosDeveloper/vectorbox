import { Router } from 'express';
import { register, login, logout, me } from '../controllers/auth';
import { verifyToken } from '../middlewares/auth';

const router = Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, me);

export default router;
