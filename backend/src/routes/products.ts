import { Router } from 'express';
import { getProducts, getProductById, getCategories } from '../controllers/products';

const router = Router();

// Rutas públicas de productos
router.get('/categories', getCategories);
router.get('/', getProducts);
router.get('/:id', getProductById);

export default router;
