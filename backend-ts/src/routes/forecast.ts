import { Router, Request, Response } from 'express';
import { mlClient } from '../services/ml-client';
import { supabase } from '../services/database';
import { authenticate, requireAdmin, optionalAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

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

        // Extract accuracy info from model status
        if (status.exists) {
            res.json({
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
            });
        } else {
            res.json({
                status: 'no_model',
                accuracy: null,
                train_mape: null,
                validation_mape: null,
                error_gap: null,
                fit_status: 'unknown',
            });
        }
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

// Predict endpoint with store_id in path - for frontend compatibility (Admin only)
router.post('/:store_id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { store_id } = req.params;
        const { periods, events } = req.body;

        const result = await mlClient.predict({
            store_id,
            periods: periods || 30,
            events: events || [],
        });

        // Transform ML service response to frontend format
        // ML service returns: {status, predictions: [{ds, yhat, yhat_lower, yhat_upper}], metadata}
        // Frontend expects: {status, chartData: [{date, predicted, lower, upper, historical}], recommendations, meta, eventAnnotations}

        const predictions = result.predictions || [];

        // Use WIB timezone (UTC+7) for consistent date handling
        const now = new Date();
        const wibOffset = 7 * 60 * 60 * 1000; // UTC+7 in milliseconds
        const nowWib = new Date(now.getTime() + wibOffset);
        const todayWib = nowWib.toISOString().split('T')[0];

        // Fetch historical data for the last 30 days from daily_sales_summary
        // This table is pre-aggregated and matches what dashboard uses
        const thirtyDaysAgo = new Date(nowWib.getTime() - (30 * 24 * 60 * 60 * 1000));
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        console.log(`[Forecast] Fetching history from ${thirtyDaysAgoStr} to ${todayWib} (WIB)`);

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
            console.log(`[Forecast] Loaded ${historicalData.length} days of historical data`);
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

        // Generate stock recommendations based on predictions and product inventory
        const recommendations: any[] = [];

        try {
            // Fetch products from Supabase
            const { data: products, error: productError } = await supabase
                .from('products')
                .select('id, name, category, stock, selling_price');

            console.log(`[Forecast] Product fetch: error=${productError?.message || 'none'}, count=${products?.length || 0}`);

            if (!productError && products && products.length > 0) {
                // Fetch historical sales per product from transaction_items
                const { data: salesHistory, error: salesError } = await supabase
                    .from('transaction_items')
                    .select('product_id, quantity');

                // Aggregate sales by product_id
                const productSales: Record<number, number> = {};
                let totalUnitsSold = 0;
                if (!salesError && salesHistory) {
                    salesHistory.forEach((item: any) => {
                        const qty = item.quantity || 0;
                        productSales[item.product_id] = (productSales[item.product_id] || 0) + qty;
                        totalUnitsSold += qty;
                    });
                }
                console.log(`[Forecast] Sales history: ${totalUnitsSold} total units sold across ${Object.keys(productSales).length} products`);

                // Calculate total predicted sales over forecast period (in revenue)
                const totalPredictedRevenue = predictions.reduce((sum: number, p: any) =>
                    sum + (p.yhat || 0), 0);

                // Average product price to convert revenue to units
                const avgProductPrice = products.reduce((sum, p) => sum + (p.selling_price || 0), 0) / products.length;
                const totalPredictedUnits = avgProductPrice > 0 ? totalPredictedRevenue / avgProductPrice : totalPredictedRevenue;

                const forecastDays = periods || 30;

                // For each product, estimate demand based on historical sales proportion
                for (const product of products) {
                    const currentStock = product.stock || 0;
                    const reorderPoint = 10; // Default reorder point

                    // Calculate this product's sales proportion based on historical data
                    const productHistoricalSales = productSales[product.id] || 0;
                    const salesProportion = totalUnitsSold > 0
                        ? productHistoricalSales / totalUnitsSold
                        : 1 / products.length; // Fallback to equal distribution if no history

                    // Estimate demand based on sales proportion
                    const estimatedDemand = Math.ceil(totalPredictedUnits * salesProportion);
                    const productDailyDemand = forecastDays > 0 ? estimatedDemand / forecastDays : 0;

                    // Calculate days of stock remaining
                    const daysOfStock = productDailyDemand > 0
                        ? Math.floor(currentStock / productDailyDemand)
                        : 999;

                    // Calculate recommended restock to cover forecast period + buffer
                    const recommendedRestock = Math.max(0, estimatedDemand - currentStock + reorderPoint);

                    // Determine urgency based on days of stock relative to forecast period
                    // High: stock won't last half the forecast period
                    // Medium: stock lasts less than forecast period
                    // Low: stock lasts longer than forecast period
                    let urgency: 'high' | 'medium' | 'low' = 'low';
                    if (daysOfStock < forecastDays / 2 || currentStock < reorderPoint) {
                        urgency = 'high';
                    } else if (daysOfStock < forecastDays || currentStock < reorderPoint * 2) {
                        urgency = 'medium';
                    }

                    // Only add products that actually need restocking
                    // Include if: restock needed OR stock won't last the forecast period
                    if (recommendedRestock > 0 || daysOfStock < forecastDays) {
                        recommendations.push({
                            productId: product.id.toString(),
                            productName: product.name,
                            category: product.category || 'Uncategorized',
                            currentStock,
                            predictedDemand: estimatedDemand,
                            recommendedRestock,
                            urgency,
                        });
                    }
                }

                // Sort by urgency (high first) then by lowest stock
                recommendations.sort((a, b) => {
                    const urgencyOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
                    const aUrgency = urgencyOrder[a.urgency as string] ?? 2;
                    const bUrgency = urgencyOrder[b.urgency as string] ?? 2;
                    if (aUrgency !== bUrgency) {
                        return aUrgency - bUrgency;
                    }
                    return a.currentStock - b.currentStock;
                });
            }
        } catch (error) {
            console.error('[Forecast] Error generating recommendations:', error);
            // Continue without recommendations if there's an error
        }

        // Calculate event annotations from events
        const eventAnnotations = (events || []).reduce((acc: any[], event: any) => {
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

        console.log(`[Forecast] Transformed response: ${chartData.length} data points, growth factor: ${appliedFactor.toFixed(2)}`);
        res.json(transformedResponse);
    } catch (error: any) {
        console.error('[Forecast] Predict with path param failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

export default router;
