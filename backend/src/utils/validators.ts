import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, 'El nombre solo puede contener letras y espacios'),
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
    .min(5, 'La cédula o RIF debe tener al menos 5 caracteres')
    .regex(/^[A-Za-z0-9-]+$/, 'La cédula/RIF solo puede contener letras, números y guiones'),
  billingAddress: z
    .string()
    .trim()
    .min(5, 'La dirección de facturación debe tener al menos 5 caracteres'),
  billingPhone: z
    .string()
    .trim()
    .min(7, 'El teléfono de facturación debe tener al menos 7 caracteres')
    .regex(/^[0-9+\-\s]+$/, 'El teléfono solo puede contener números, +, guiones y espacios'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es obligatorio')
    .email('El correo electrónico no es válido'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const checkoutSchema = z.object({
  productIds: z
    .array(z.string().min(1, 'El ID de producto no es válido'))
    .min(1, 'El carrito debe tener al menos un producto'),
  paymentMethod: z.enum(['ZELLE', 'PROVINCIAL'], {
    message: 'El método de pago debe ser ZELLE o PROVINCIAL',
  }),
  paymentReference: z.string().trim().min(1, 'La referencia de pago es obligatoria')
    .regex(/^[A-Za-z0-9]+$/, 'La referencia solo puede contener letras y números'),
  paymentHolder: z.string().trim().optional(),
  paymentPhone: z.string().trim().optional()
    .refine(val => !val || /^[0-9+\-\s]+$/.test(val), 'El teléfono emisor tiene formato inválido'),
  frontendExchangeRate: z.number().optional(),
  cedula: z.string().trim().optional().nullable()
    .refine(val => !val || /^[A-Za-z0-9-]+$/.test(val), 'La cédula/RIF tiene formato inválido'),
  billingAddress: z.string().trim().optional().nullable(),
  billingPhone: z.string().trim().optional().nullable()
    .refine(val => !val || /^[0-9+\-\s]+$/.test(val), 'El teléfono tiene formato inválido'),
}).superRefine((data, ctx) => {
  if (data.paymentMethod === 'ZELLE') {
    if (!data.paymentHolder || data.paymentHolder.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El titular de Zelle es obligatorio',
        path: ['paymentHolder'],
      });
    }
  }
  if (data.paymentMethod === 'PROVINCIAL') {
    if (!data.paymentPhone || data.paymentPhone.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El número de teléfono emisor es obligatorio para Pago Móvil',
        path: ['paymentPhone'],
      });
    }
  }
});

export const submitPaymentSchema = z
  .object({
    purchaseId: z.string().trim().min(1, 'El ID de la compra es obligatorio'),
    paymentMethod: z.enum(['ZELLE', 'PROVINCIAL'], {
      message: 'El método de pago debe ser ZELLE o PROVINCIAL',
    }),
    paymentReference: z.string().trim().min(1, 'La referencia de pago es obligatoria'),
    paymentHolder: z.string().trim().optional(),
    paymentPhone: z.string().trim().optional(),
    cedula: z.string().optional().nullable(),
    billingAddress: z.string().optional().nullable(),
    billingPhone: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === 'ZELLE') {
      if (!data.paymentHolder || data.paymentHolder.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El titular de Zelle es obligatorio',
          path: ['paymentHolder'],
        });
      } else {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.paymentHolder);
        const isPhone = /^\+?[0-9]{7,15}$/.test(data.paymentHolder.replace(/\s/g, ''));
        if (!isEmail && !isPhone) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'El titular de Zelle debe ser un correo electrónico o un número de teléfono válido',
            path: ['paymentHolder'],
          });
        }
      }
    }
    if (data.paymentMethod === 'PROVINCIAL') {
      if (!data.paymentPhone || data.paymentPhone.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El número de teléfono emisor es obligatorio para Pago Móvil',
          path: ['paymentPhone'],
        });
      }
    }
  });

export const provincialWebhookSchema = z.object({
  message: z.string().trim().min(1, 'El mensaje del SMS es obligatorio'),
});

export const simulateBankTransactionSchema = z
  .object({
    method: z.enum(['ZELLE', 'PROVINCIAL'], {
      message: 'El método debe ser ZELLE o PROVINCIAL',
    }),
    reference: z.string().trim().min(1, 'La referencia es obligatoria'),
    amount: z.number({ message: 'El monto es obligatorio' }).positive('El monto debe ser positivo'),
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === 'ZELLE') {
      if (!data.email || data.email.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El correo del titular es obligatorio para transacciones de Zelle',
          path: ['email'],
        });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El correo del titular no es un correo electrónico válido',
          path: ['email'],
        });
      }
    }
    if (data.method === 'PROVINCIAL') {
      if (!data.phone || data.phone.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El número de teléfono emisor es obligatorio para Pago Móvil Provincial',
          path: ['phone'],
        });
      } else if (!/^\+?[0-9]{7,15}$/.test(data.phone.replace(/\s/g, ''))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El número de teléfono emisor debe ser un número de teléfono válido',
          path: ['phone'],
        });
      }
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type SubmitPaymentInput = z.infer<typeof submitPaymentSchema>;
export type ProvincialWebhookInput = z.infer<typeof provincialWebhookSchema>;
export type SimulateBankTransactionInput = z.infer<typeof simulateBankTransactionSchema>;


