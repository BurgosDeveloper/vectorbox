import { Router } from 'express';
import { downloadProductFile } from '../controllers/downloads';
import { verifyToken } from '../middlewares/auth';

const router = Router();

// Ruta protegida por JWT para descargar el archivo digital de un producto en una compra aprobada
router.get('/:purchaseId', verifyToken, downloadProductFile);

export default router;
