import { Router, Request, Response } from 'express';
import { holidayService } from '../services/holiday';

const router = Router();

// Get holidays for a specific year
router.get('/:year', async (req: Request, res: Response) => {
    try {
        const year = parseInt(req.params.year);

        if (isNaN(year) || year < 2000 || year > 2100) {
            return res.status(400).json({
                status: 'error',
                error: 'Invalid year'
            });
        }

        const holidays = await holidayService.getHolidaysForYear(year);

        res.json({
            status: 'success',
            year,
            count: holidays.length,
            holidays
        });
    } catch (error: any) {
        console.error('[Holidays] Get year failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Get holidays for a specific month
router.get('/:year/:month', async (req: Request, res: Response) => {
    try {
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);

        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({
                status: 'error',
                error: 'Invalid year or month'
            });
        }

        const holidays = await holidayService.getHolidaysForMonth(year, month);

        res.json({
            status: 'success',
            year,
            month,
            count: holidays.length,
            holidays
        });
    } catch (error: any) {
        console.error('[Holidays] Get month failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

export default router;
