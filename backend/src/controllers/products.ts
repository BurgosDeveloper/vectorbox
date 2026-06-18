import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

/**
 * Obtener todos los productos del catálogo
 * GET /api/products
 */
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      status: 'success',
      results: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener todas las categorías
 * GET /api/products/categories
 */
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return res.status(200).json({
      status: 'success',
      results: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener los detalles de un producto por ID
 * GET /api/products/:id
 */
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'Producto no encontrado',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
