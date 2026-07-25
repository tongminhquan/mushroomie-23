import { z } from 'zod'
import { shippingFeeValueSchema } from '@/lib/shipping-fee'

export const orderSchema = z.object({
  customer_name: z.string().trim().min(1).max(120),
  customer_email: z.string().email(),
  customer_phone: z.string().trim().regex(/^(0|\+84)[0-9]{8,9}$/),
  shipping_address: z.string().trim().min(10).max(1000),
  note: z.string().trim().max(2000).optional(),
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    product_name: z.string().optional(),
    quantity: z.number().int().positive().max(99),
    price_snapshot: z.number().optional(),
    selected_options: z.record(z.string().max(100), z.string().max(300)).optional(),
    custom_note: z.string().trim().max(1000).optional(),
  })).min(1).max(50),
  payment_method: z.enum(['bank_transfer', 'cod']).default('bank_transfer'),
  user_voucher_id: z.string().optional().nullable(),
  expected_shipping_fee: shippingFeeValueSchema.optional(),
})

export type OrderInput = z.infer<typeof orderSchema>
