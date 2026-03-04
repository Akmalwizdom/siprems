import { Router, Request, Response } from 'express';
import { mlClient } from '../services/ml-client';
import { supabase } from '../services/database';
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

    // Use WIB timezone (UTC+7) for consistent date handling
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000; // UTC+7 in milliseconds
    const nowWib = new Date(now.getTime() + wibOffset);
    const todayWib = nowWib.toISOString().split('T')[0];

    // Fetch historical data for the last 30 days from daily_sales_summary
    const thirtyDaysAgo = new Date(nowWib.getTime() - (30 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: historicalData, error: historyError } = await supabase
        .from('daily_sales_summary')
        .select('ds, y')
        .gte('ds', thirtyDaysAgoStr)
        .lte('ds', todayWib)
        .order('ds', { ascending: true });

    if (historyError) {
        console.error('[Forecast] Error fetching history:', historyError);
    }

    // Create map of historical sales by date
    const dailyHistory: Record<string, number> = {};
    if (historicalData) {
        historicalData.forEach(row => {
            dailyHistory[row.ds] = row.y || 0;
        });
    }

    // Generate full 30-day range to ensure continuity
    const historicalChartData = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(nowWib.getTime() - (i * 24 * 60 * 60 * 1000));
        const dateStr = d.toISOString().split('T')[0];

        historicalChartData.push({
            date: dateStr,
            predicted: null,
            lower: null,
            upper: null,
            historical: dailyHistory[dateStr] || 0, // Use 0 for days with no sales
            isHoliday: false
        });
    }

    // Create prediction chart data points
    const predictionChartData = predictions.map((pred: any) => ({
        date: pred.ds,
        predicted: Math.round(pred.yhat),
        lower: Math.round(pred.yhat_lower),
        upper: Math.round(pred.yhat_upper),
        historical: null,
        isHoliday: false,
    }));

    // Merge historical and prediction data
    const chartData = [...historicalChartData, ...predictionChartData];

    // Calculate growth factor from prediction trend
    let appliedFactor = 1.0; // Default to 1.0 (0% growth) to avoid NaN
    if (predictions.length >= 14) {
        const first7Avg = predictions.slice(0, 7).reduce((sum: number, p: any) => sum + (p.yhat || 0), 0) / 7;
        const last7Avg = predictions.slice(-7).reduce((sum: number, p: any) => sum + (p.yhat || 0), 0) / 7;
        if (first7Avg > 0 && !isNaN(first7Avg) && !isNaN(last7Avg)) {
            appliedFactor = last7Avg / first7Avg;
        }
    } else if (predictions.length >= 2) {
        const firstValue = predictions[0]?.yhat || 0;
        const lastValue = predictions[predictions.length - 1]?.yhat || 0;
        if (firstValue > 0 && !isNaN(firstValue) && !isNaN(lastValue)) {
            appliedFactor = lastValue / firstValue;
        }
    }

    // Final validation to ensure appliedFactor is always valid
    if (!isFinite(appliedFactor) || isNaN(appliedFactor)) {
        appliedFactor = 1.0;
    }

    // Generate stock recommendations using enhanced ProductForecastService
    let recommendations: any[] = [];
    try {
        // Calculate total predicted revenue from ML predictions
        const totalPredictedRevenue = predictions.reduce((sum: number, p: any) =>
            sum + (p.yhat || 0), 0);

        const forecastDays = periods || 30;
        const productPredictions = await productForecastService.generateProductPredictions(
            totalPredictedRevenue,
            forecastDays
        );

        recommendations = productPredictions.map(pred => ({
            productId: pred.productId,
            productName: pred.productName,
            category: pred.category,
            currentStock: pred.currentStock,
            predictedDemand: pred.predictedDemand,
            recommendedRestock: pred.recommendedRestock,
            urgency: pred.urgency,
            safetyStock: pred.safetyStock,
            daysOfStock: pred.daysOfStock,
            confidence: pred.confidence,
            categoryGrowthFactor: pred.categoryGrowthFactor,
            historicalSales: pred.historicalSales,
            salesProportion: pred.salesProportion,
        }));
    } catch (error) {
        console.error('[Forecast] Error generating recommendations:', error);
    }

    // Determine chart date range for filtering events
    const chartStartDate = historicalChartData[0]?.date;
    const chartEndDate = predictions.length > 0
        ? predictions[predictions.length - 1]?.ds
        : historicalChartData[historicalChartData.length - 1]?.date;

    // Calculate event annotations from events - ONLY for events within chart date range
    const eventAnnotations: { date: string; titles: string[]; types: string[] }[] = (events || [])
        .filter((event: any) => event.date >= chartStartDate && event.date <= chartEndDate)
        .reduce((acc: any[], event: any) => {
            const existing = acc.find(a => a.date === event.date);
            if (existing) {
                existing.titles.push(event.title || event.type);
                existing.types.push(event.type);
            } else {
                acc.push({
                    date: event.date,
                    titles: [event.title || event.type],
                    types: [event.type],
                });
            }
            return acc;
        }, []);

    // Fetch national holidays for the chart date range and merge into eventAnnotations
    try {
        if (chartStartDate && chartEndDate) {
            const startYear = new Date(chartStartDate).getFullYear();
            const endYear = new Date(chartEndDate).getFullYear();

            for (let year = startYear; year <= endYear; year++) {
                const holidays = await holidayService.getHolidaysForYear(year);

                for (const holiday of holidays) {
                    // Only include holidays within the chart date range
                    if (holiday.date >= chartStartDate && holiday.date <= chartEndDate) {
                        const existing = eventAnnotations.find(a => a.date === holiday.date);
                        if (existing) {
                            // Add holiday to existing annotation if not already present
                            if (!existing.titles.includes(holiday.name)) {
                                existing.titles.push(holiday.name);
                                existing.types.push(holiday.is_national_holiday ? 'holiday' : 'event');
                            }
                        } else {
                            // Create new annotation for holiday
                            eventAnnotations.push({
                                date: holiday.date,
                                titles: [holiday.name],
                                types: [holiday.is_national_holiday ? 'holiday' : 'event'],
                            });
                        }
                    }
                }
            }

            // Sort annotations by date
            eventAnnotations.sort((a, b) => a.date.localeCompare(b.date));
        }
    } catch (error) {
        console.error('[Forecast] Error fetching holidays for annotations:', error);
    }

    const transformedResponse = {
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
    };

    return res.json(transformedResponse);
}

// Train Prophet model (Admin only)
router.post('/train', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { store_id, end_date, force_retrain } = req.body;

        if (!store_id) {
            return res.status(400).json({
                status: 'error',
                error: 'store_id is required'
            });
        }

        const result = await mlClient.trainModel(store_id, end_date, force_retrain);

        res.json(result);
    } catch (error: any) {
        console.error('[Forecast] Train failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Get forecast predictions (Admin only)
router.post('/predict', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { store_id, periods, events } = req.body;

        if (!store_id) {
            return res.status(400).json({
                status: 'error',
                error: 'store_id is required'
            });
        }

        const result = await mlClient.predict({
            store_id,
            periods: periods || 30,
            events: events || [],
        });

        res.json(result);
    } catch (error: any) {
        console.error('[Forecast] Predict failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Get model status (Admin only)
router.get('/model/:store_id/status', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { store_id } = req.params;
        const status = await mlClient.getModelStatus(store_id);

        res.json({
            status: 'success',
            model: status
        });
    } catch (error: any) {
        console.error('[Forecast] Get status failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Get model accuracy (Admin only)
router.get('/model/accuracy', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const store_id = req.query.store_id as string || '1';
        const status = await mlClient.getModelStatus(store_id);
        res.json(toModelAccuracyResponse(status));
    } catch (error: any) {
        console.error('[Forecast] Get model accuracy failed:', error);
        res.status(500).json({
            status: 'error',
            accuracy: null,
            train_mape: null,
            validation_mape: null,
            error_gap: null,
            fit_status: 'unknown',
        });
    }
});

// Canonical contract endpoint: GET /forecast/model/:store_id/accuracy
router.get('/model/:store_id/accuracy', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { store_id } = req.params;
        const status = await mlClient.getModelStatus(store_id);
        res.json(toModelAccuracyResponse(status));
    } catch (error: any) {
        console.error('[Forecast] Get model accuracy by store failed:', error);
        res.status(500).json({
            status: 'error',
            accuracy: null,
            train_mape: null,
            validation_mape: null,
            error_gap: null,
            fit_status: 'unknown',
        });
    }
});

// Canonical contract endpoint: POST /forecast/predict/:store_id
router.post('/predict/:store_id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { store_id } = req.params;
        const { periods, events } = req.body;
        await handlePredictByStoreId(store_id, periods, events, res);
    } catch (error: any) {
        console.error('[Forecast] Predict by canonical path failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Backward compatibility: legacy endpoint with store_id in path
router.post('/:store_id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { store_id } = req.params;
        const { periods, events } = req.body;
        await handlePredictByStoreId(store_id, periods, events, res);
    } catch (error: any) {
        console.error('[Forecast] Predict with legacy path failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

export default router;
