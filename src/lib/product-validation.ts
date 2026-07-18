import { z } from 'zod'

interface StoredProductPrice {
  price: number
  sale_price: number | null
}

const productCreateShape = {
  name: z.string().min(1),
  slug: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive(),
  sale_price: z.number().positive().optional().nullable(),
  sku: z.string().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  status: z.enum(['active', 'inactive', 'draft']).default('active'),
  is_customizable: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  featured_image: z.string().optional().nullable(),
  category_id: z.number().optional().nullable(),
  images: z.array(z.string()).optional(),
}

const productUpdateShape = {
  name: z.string().min(1).max(200).optional(),
  slug: z.string().max(200).optional(),
  short_description: z.string().max(2000).optional().nullable(),
  description: z.string().max(200_000).optional().nullable(),
  price: z.number().positive().optional(),
  sale_price: z.number().positive().optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  stock: z.number().int().min(0).max(1_000_000).optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
  is_customizable: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  featured_image: z.string().max(2000).optional().nullable(),
  category_id: z.number().int().positive().optional().nullable(),
  images: z.array(z.string().max(2000)).max(50).optional(),
}

function addInvalidSalePriceIssue(
  price: number,
  salePrice: number | null | undefined,
  ctx: z.RefinementCtx,
) {
  if (salePrice !== null && salePrice !== undefined && salePrice >= price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sale_price'],
      message: 'Giá khuyến mãi phải NHỎ HƠN giá gốc',
    })
  }
}

export const productCreateSchema = z.object(productCreateShape).superRefine((data, ctx) => {
  addInvalidSalePriceIssue(data.price, data.sale_price, ctx)
})

export function createProductUpdateSchema(existing: StoredProductPrice) {
  return z.object(productUpdateShape).strict().superRefine((data, ctx) => {
    const effectivePrice = data.price ?? existing.price
    const effectiveSalePrice = data.sale_price === undefined
      ? existing.sale_price
      : data.sale_price

    addInvalidSalePriceIssue(effectivePrice, effectiveSalePrice, ctx)
  })
}
