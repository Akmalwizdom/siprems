import { Router, Request, Response } from 'express';
import { mlClient } from '../services/ml-client';
import { db } from '../services/database';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { holidayService } from '../services/holiday';
import { productForecastService } from '../services/product-forecast';

const router = Router();

function toModelAccuracyResponse(status: any) {
    if (status.exists) {
        return {
            status: 'success',
            accuracy: status.accuracy || null,
            train_mape: status.train_mape || null,
            validation_mape: status.validation_mape || null,
            error_gap: status.validation_mape && status.train_mape
                ? Math.abs(status.validation_mape - status.train_mape)
                : null,
            fit_status: status.accuracy && status.accuracy > 90 ? 'good' : 'fair',
            data_points: status.data_points || null,
            model_version: status.store_id || null,
            last_trained: status.last_trained || null,
        };
    }
    return {
        status: 'no_model',
        accuracy: null,
        train_mape: null,
        validation_mape: null,
        error_gap: null,
        fit_status: 'unknown',
    };
}

async function handlePredictByStoreId(
    store_id: string,
    periods: number | undefined,
    events: any[] | undefined,
    res: Response
) {
    const result = await mlClient.predict({
        store_id,
        periods: periods || 30,
        events: events || [],
    });

    const predictions = result.predictions || [];
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000;
    const nowWib = new Date(now.getTime() + wibOffset);
    const todayWib = nowWib.toISOString().split('T')[0];

    const thirtyDaysAgo = new Date(nowWib.getTime() - (30 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { rows: historicalData } = await db.query(
        'SELECT ds, y FROM daily_sales_summary WHERE ds >= $1 AND ds <= $2 ORDER BY ds ASC',
        [thirtyDaysAgoStr, todayWib]
    );

    const dailyHistory: Record<string, number> = {};
    historicalData.forEach((row: any) => {
        dailyHistory[row.ds] = Number(row.y) || 0;
    });

    const historicalChartData = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(nowWib.getTime() - (i * 24 * 60 * 60 * 1000));
        const dateStr = d.toISOString().split('T')[0];
        historicalChartData.push({
            date: dateStr,
            predicted: null,
            lower: null,
            upper: null,
            historical: dailyHistory[dateStr] || 0,
            isHoliday: false
        });
    }

    const predictionChartData = predictions.map((pred: any) => ({
        date: pred.ds,
        predicted: Math.round(pred.yhat),
        lower: Math.round(pred.yhat_lower),
        upper: Math.round(pred.yhat_upper),
        historical: null,
        isHoliday: false,
    }));

    const chartData = [...historicalChartData, ...predictionChartData];

    let appliedFactor = 1.0;
    if (predictions.length >= 14) {
        const first7Avg = predictions.slice(0, 7).reduce((sum: number, p: any) => sum + (p.yhat || 0), 0) / 7;
        const last7Avg = predictions.slice(-7).reduce((sum: number, p: any) => sum + (p.yhat || 0), 0) / 7;
        if (first7Avg > 0) appliedFactor = last7Avg / first7Avg;
    }

    if (!isFinite(appliedFactor) || isNaN(appliedFactor)) appliedFactor = 1.0;

    let recommendations: any[] = [];
    try {
        const totalPredictedRevenue = predictions.reduce((sum: number, p: any) => sum + (p.yhat || 0), 0);
        const forecastDays = periods || 30;
        const productPredictions = await productForecastService.generateProductPredictions(
            totalPredictedRevenue,
            forecastDays
        );
        recommendations = productPredictions;
    } catch (error) {
        console.error('[Forecast] Error generating recommendations:', error);
    }

    const chartStartDate = historicalChartData[0]?.date;
    const chartEndDate = predictions.length > 0
        ? predictions[predictions.length - 1]?.ds
        : historicalChartData[historicalChartData.length - 1]?.date;

    const eventAnnotations: any[] = (events || [])
        .filter((event: any) => event.date >= chartStartDate && event.date <= chartEndDate)
        .reduce((acc: any[], event: any) => {
            const existing = acc.find(a => a.date === event.date);
            if (existing) {
                existing.titles.push(event.title || event.type);
                existing.types.push(event.type);
            } else {
                acc.push({ date: event.date, titles: [event.title || event.type], types: [event.type] });
            }
            return acc;
        }, []);

    try {
        if (chartStartDate && chartEndDate) {
            const startYear = new Date(chartStartDate).getFullYear();
            const endYear = new Date(chartEndDate).getFullYear();
            for (let year = startYear; year <= endYear; year++) {
                const holidays = await holidayService.getHolidaysForYear(year);
                for (const holiday of holidays) {
                    if (holiday.date >= chartStartDate && holiday.date <= chartEndDate) {
                        const existing = eventAnnotations.find(a => a.date === holiday.date);
                        if (existing) {
                            if (!existing.titles.includes(holiday.name)) {
                                existing.titles.push(holiday.name);
                                existing.types.push(holiday.is_national_holiday ? 'holiday' : 'event');
                            }
                        } else {
                            eventAnnotations.push({
                                date: holiday.date,
                                titles: [holiday.name],
                                types: [holiday.is_national_holiday ? 'holiday' : 'event'],
                            });
                        }
                    }
                }
            }
            eventAnnotations.sort((a, b) => a.date.localeCompare(b.date));
        }
    } catch (error) {
        console.error('[Forecast] Error fetching holidays:', error);
    }

    res.json({
        status: result.status || 'success',
        chartData,
        recommendations,
        eventAnnotations,
        meta: {
            applied_factor: appliedFactor,
            historicalDays: result.metadata?.historical_days || 0,
            forecastDays: periods || 30,
            lastHistoricalDate: result.metadata?.last_historical_date,
            accuracy: result.metadata?.model_accuracy,
            train_mape: result.metadata?.train_mape,
            validation_mape: result.metadata?.validation_mape,
        },
    });
}

router.post('/train', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { store_id, end_date, force_retrain } = req.body;
        const result = await mlClient.trainModel(store_id, end_date, force_retrain);
        res.json(result);
    } catch (error: any) {
        console.error('[Forecast] Train failed:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

router.post('/predict', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { store_id, periods, events } = req.body;
        const result = await mlClient.predict({ store_id, periods: periods || 30, events: events || [] });
        res.json(result);
    } catch (error: any) {
        console.error('[Forecast] Predict failed:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

router.get('/model/:store_id/status', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const status = await mlClient.getModelStatus(req.params.store_id);
        res.json({ status: 'success', model: status });
    } catch (error: any) {
        console.error('[Forecast] Get status failed:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

router.get('/model/accuracy', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const store_id = req.query.store_id as string || '1';
        const status = await mlClient.getModelStatus(store_id);
        res.json(toModelAccuracyResponse(status));
    } catch (error: any) {
        console.error('[Forecast] Get accuracy failed:', error);
        res.status(500).json({ status: 'error', accuracy: null, fit_status: 'unknown' });
    }
});

router.get('/model/:store_id/accuracy', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const status = await mlClient.getModelStatus(req.params.store_id);
        res.json(toModelAccuracyResponse(status));
    } catch (error: any) {
        res.status(500).json({ status: 'error', accuracy: null, fit_status: 'unknown' });
    }
});

router.post('/predict/:store_id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { periods, events } = req.body;
        await handlePredictByStoreId(req.params.store_id, periods, events, res);
    } catch (error: any) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

router.post('/:store_id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { periods, events } = req.body;
        await handlePredictByStoreId(req.params.store_id, periods, events, res);
    } catch (error: any) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

export default router;
