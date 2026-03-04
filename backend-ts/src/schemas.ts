import { z } from 'zod';

// ==========================================
// Transaction schemas
// ==========================================
export const transactionItemSchema = z.object({
    product_id: z.number().int().positive(),
    quantity: z.number().int().positive(),
    unit_price: z.number().nonnegative(),
    subtotal: z.number().nonnegative(),
});

export const createTransactionSchema = z.object({
    items: z.array(transactionItemSchema).min(1, 'At least one item is required'),
    total_amount: z.number().positive('total_amount must be positive'),
    payment_method: z.string().optional().default('Cash'),
    order_types: z.string().optional().default('dine-in'),
    items_count: z.number().int().optional(),
});

// ==========================================
// Product schemas
// ==========================================
export const createProductSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    category: z.string().min(1, 'Category is required'),
    sku: z.string().optional(),
    stock: z.number().int().nonnegative().optional().default(0),
    selling_price: z.number().nonnegative(),
    cost_price: z.number().nonnegative().optional(),
    image_url: z.string().url().optional().nullable(),
    description: z.string().optional().nullable(),
});

export const updateProductSchema = z.object({
    stock: z.number().int().nonnegative().optional(),
    price: z.number().nonnegative().optional(),
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    selling_price: z.number().nonnegative().optional(),
    cost_price: z.number().nonnegative().optional(),
    description: z.string().optional().nullable(),
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
});

// ==========================================
// Event schemas
// ==========================================
const eventTypeEnum = z.enum(['promotion', 'holiday', 'store-closed', 'event']);

export const createEventSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    title: z.string().min(1, 'Title is required'),
    type: eventTypeEnum.optional().default('event'),
    description: z.string().optional().nullable(),
    impact_weight: z.number().min(0).max(10).optional().default(1.0),
});

// ==========================================
// Chat schema
// ==========================================
export const chatMessageSchema = z.object({
    message: z.string().min(1, 'Message is required').max(2000, 'Message is too long (max 2000 characters)'),
    predictionData: z.any().optional().nullable(),
    chatHistory: z.array(z.object({
        role: z.string(),
        content: z.string(),
    })).optional().default([]),
});

// ==========================================
// Settings schema
// ==========================================
export const updateSettingsSchema = z.object({
    store_name: z.string().min(1).optional(),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    currency: z.string().optional(),
    timezone: z.string().optional(),
    low_stock_threshold: z.number().int().nonnegative().optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
});

// ==========================================
// User schemas
// ==========================================
export const updateUserRoleSchema = z.object({
    role: z.enum(['user', 'admin']),
});

// Export inferred types
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type TransactionItemInput = z.infer<typeof transactionItemSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
