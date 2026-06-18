import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio'),
  email: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es obligatorio')
    .email('El correo electrónico no es válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  cedula: z
    .string()
    .trim()
    .min(5, 'La cédula o RIF debe tener al menos 5 caracteres'),
  billingAddress: z
    .string()
    .trim()
    .min(5, 'La dirección de facturación debe tener al menos 5 caracteres'),
  billingPhone: z
    .string()
    .trim()
    .min(7, 'El teléfono de facturación debe tener al menos 7 caracteres'),
});

export const checkoutSchema = z.object({
  cedula: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  billingPhone: z.string().optional().nullable(),
});
