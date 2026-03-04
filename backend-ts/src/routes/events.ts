import { Router, Request, Response } from 'express';
import { db } from '../services/database';
import { geminiService } from '../services/gemini';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createEventSchema } from '../schemas';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// Get all events - Public access for viewing calendar
router.get('/', async (_req: Request, res: Response) => {
    try {
        const events = await db.events.getAll();
        // Return array directly for frontend compatibility
        res.json(events || []);
    } catch (error: any) {
        console.error('[Events] Get all failed:', error);
        sendError(res, 'EVENTS_FETCH_ERROR', error.message);
    }
});

async function createEvent(req: AuthenticatedRequest, res: Response) {
    try {
        const payload = req.body;

        const event = await db.events.create({
            date: payload.date,
            title: payload.title,
            type: payload.type,
            description: payload.description || null,
            impact_weight: payload.impact_weight ?? 1.0,
        });

        sendSuccess(res, event);
    } catch (error: any) {
        console.error('[Events] Create failed:', error);
        const message = error?.message || 'Failed to create event';
        sendError(res, 'EVENT_CREATE_ERROR', message, 500);
    }
}

// Get AI suggestion for event classification (Admin only)
router.post('/suggest', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { title, description, date } = req.body;

        if (!title) {
            return sendError(res, 'VALIDATION_ERROR', 'Title is required', 400);
        }

        const classification = await geminiService.classifyEvent(title, description, date);

        sendSuccess(res, {
            suggested_category: classification.category,
            confidence: classification.confidence,
            rationale: classification.rationale,
        });
    } catch (error: any) {
        console.error('[Events] AI suggestion failed:', error);
        sendError(res, 'EVENT_SUGGEST_ERROR', error.message);
    }
});

// Create event (Admin only) - Canonical endpoint with Zod validation
router.post('/', authenticate, requireAdmin, validate(createEventSchema), createEvent);

// Backward compatibility for legacy frontend route
router.post('/confirm', authenticate, requireAdmin, validate(createEventSchema), createEvent);

// Update event (Admin only) with Zod validation
router.put('/:id', authenticate, requireAdmin, validate(createEventSchema), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const payload = req.body;
        const event = await db.events.update(req.params.id, {
            date: payload.date,
            title: payload.title,
            type: payload.type,
            description: payload.description || null,
            impact_weight: payload.impact_weight ?? 1.0,
        });

        sendSuccess(res, event);
    } catch (error: any) {
        console.error('[Events] Update failed:', error);
        sendError(res, 'EVENT_UPDATE_ERROR', error?.message || 'Failed to update event');
    }
});

// Calibration history (placeholder)
router.get('/:id/history', authenticate, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
    sendSuccess(res, { history: [] });
});

// Optional calibrate endpoint from roadmap contract
router.post('/:id/calibrate', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    sendSuccess(res, {
        message: 'Calibration endpoint is available but calibration logic is not implemented yet.',
        calibration: { event_id: req.params.id, new_impact: null },
    });
});

// Delete event (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        await db.events.delete(req.params.id);
        sendSuccess(res, { message: 'Event deleted' });
    } catch (error: any) {
        console.error('[Events] Delete failed:', error);
        sendError(res, 'EVENT_DELETE_ERROR', error.message);
    }
});

export default router;
