import { Router, Request, Response } from 'express';
import { geminiService } from '../services/gemini';

const router = Router();

interface ChatRequest {
    message: string;
    predictionData: any | null;
    chatHistory: Array<{ role: string; content: string }>;
}

/**
 * POST /api/chat
 * Chat with AI assistant for inventory management
 */
router.post('/', async (req: Request<{}, {}, ChatRequest>, res: Response) => {
    try {
        const { message, predictionData, chatHistory } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Message is required and must be a string',
            });
        }

        console.log(`[Chat] Received message: "${message.substring(0, 50)}..."`);

        const result = await geminiService.chat(
            message,
            predictionData || null,
            chatHistory || []
        );

        console.log(`[Chat] Response generated successfully`);

        return res.json(result);
    } catch (error) {
        console.error('[Chat] Error:', error);
        return res.status(500).json({
            response: 'Maaf, terjadi kesalahan server. Silakan coba lagi.',
            action: { type: 'none', needsConfirmation: false },
        });
    }
});

export default router;
