import { Router, Request, Response } from 'express';
import { geminiService } from '../services/gemini';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { chatMessageSchema } from '../schemas';
import { sendSuccess, sendError } from '../utils/response';
import { config } from '../config';

const router = Router();
const chatRateLimitStore = new Map<string, { windowStart: number; count: number }>();

function consumeChatRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
    const now = Date.now();
    const windowMs = config.security.chatRateLimitWindowMs;
    const maxRequests = config.security.chatRateLimitMaxRequests;

    const existing = chatRateLimitStore.get(key);
    if (!existing || now - existing.windowStart >= windowMs) {
        chatRateLimitStore.set(key, { windowStart: now, count: 1 });
        return { allowed: true };
    }

    if (existing.count >= maxRequests) {
        const retryAfterMs = windowMs - (now - existing.windowStart);
        return {
            allowed: false,
            retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
        };
    }

    existing.count += 1;
    chatRateLimitStore.set(key, existing);
    return { allowed: true };
}

/**
 * POST /api/chat
 * Authenticated AI chat with Zod validation + rate limiting.
 */
router.post('/', authenticate, validate(chatMessageSchema), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userKey = req.user?.id || req.ip || 'unknown';
        const rateLimitResult = consumeChatRateLimit(userKey);
        if (!rateLimitResult.allowed) {
            return sendError(
                res,
                'RATE_LIMITED',
                'Too many chat requests. Please wait before retrying.',
                429,
                { retry_after_seconds: rateLimitResult.retryAfterSeconds },
            );
        }

        const { message, predictionData, chatHistory } = req.body;

        console.log(`[Chat] User ${req.user?.email || 'unknown'}: "${message.substring(0, 50)}..."`);

        const result = await geminiService.chat(
            message,
            predictionData || null,
            chatHistory || []
        );

        console.log(`[Chat] Response generated successfully`);

        sendSuccess(res, result);
    } catch (error: any) {
        console.error('[Chat] Error:', error);
        sendError(res, 'CHAT_ERROR', 'Maaf, terjadi kesalahan server. Silakan coba lagi.');
    }
});

export default router;
