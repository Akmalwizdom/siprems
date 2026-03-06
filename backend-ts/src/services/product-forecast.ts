import { db } from './database';

export interface ProductDemandPrediction {
    productId: string;
    productName: string;
    category: string;
    currentStock: number;
    predictedDemand: number;
    recommendedRestock: number;
    safetyStock: number;
    daysOfStock: number;
    urgency: 'high' | 'medium' | 'low';
    confidence: number;
    categoryGrowthFactor: number;
    historicalSales: number;
    salesProportion: number;
}

interface CategorySales {
    category: string;
    totalUnits: number;
    totalRevenue: number;
    productCount: number;
    avgDailySales: number;
    growthFactor: number;
}

class ProductForecastService {
    async getTimeWeightedSales(lookbackDays: number = 90): Promise<{
        productSales: Record<number, { weighted: number; raw: number; recent: number; older: number }>;
        categorySales: Record<string, CategorySales>;
        totalWeightedUnits: number;
        totalRawUnits: number;
    }> {
        const now = new Date();
        const wibOffset = 7 * 60 * 60 * 1000;
        const nowWib = new Date(now.getTime() + wibOffset);
        const todayStr = nowWib.toISOString().split('T')[0];
        const recentCutoffStr = new Date(nowWib.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        const lookbackStr = new Date(nowWib.getTime() - (lookbackDays * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

        // Fetch products mapping
        const { rows: products } = await db.query('SELECT id, name, category, stock, selling_price FROM products');
        const productCategory: Record<number, string> = {};
        products.forEach((p: any) => productCategory[p.id] = p.category || 'Uncategorized');

        // Fetch transaction items with dates
        const { rows: transactionItems } = await db.query(
            `SELECT ti.product_id, ti.quantity, ti.unit_price, t.date 
             FROM transaction_items ti 
             JOIN transactions t ON ti.transaction_id = t.id 
             WHERE t.date >= $1 AND t.date <= $2`,
            [lookbackStr, todayStr]
        );

        const productSales: Record<number, { weighted: number; raw: number; recent: number; older: number }> = {};
        const categorySalesMap: Record<string, any> = {};
        let totalWeightedUnits = 0;
        let totalRawUnits = 0;

        transactionItems.forEach((item: any) => {
            const productId = item.product_id;
            const quantity = Number(item.quantity) || 0;
            const price = Number(item.unit_price) || 0;
            const txDate = item.date;
            const category = productCategory[productId] || 'Uncategorized';
            const isRecent = txDate >= recentCutoffStr;
            const weight = isRecent ? 2.0 : 1.0;
            const weightedQty = quantity * weight;

            if (!productSales[productId]) productSales[productId] = { weighted: 0, raw: 0, recent: 0, older: 0 };
            productSales[productId].weighted += weightedQty;
            productSales[productId].raw += quantity;
            if (isRecent) productSales[productId].recent += quantity;
            else productSales[productId].older += quantity;

            totalWeightedUnits += weightedQty;
            totalRawUnits += quantity;

            if (!categorySalesMap[category]) {
                categorySalesMap[category] = { recentUnits: 0, olderUnits: 0, recentRevenue: 0, olderRevenue: 0, products: new Set() };
            }
            categorySalesMap[category].products.add(productId);
            if (isRecent) {
                categorySalesMap[category].recentUnits += quantity;
                categorySalesMap[category].recentRevenue += quantity * price;
            } else {
                categorySalesMap[category].olderUnits += quantity;
                categorySalesMap[category].olderRevenue += quantity * price;
            }
        });

        const categorySales: Record<string, CategorySales> = {};
        for (const [category, data] of Object.entries(categorySalesMap)) {
            const totalUnits = data.recentUnits + data.olderUnits;
            const recentDailyRate = data.recentUnits / 30;
            const olderDailyRate = data.olderUnits / Math.max(1, lookbackDays - 30);
            const growthFactor = olderDailyRate > 0 ? recentDailyRate / olderDailyRate : 1.0;

            categorySales[category] = {
                category,
                totalUnits,
                totalRevenue: data.recentRevenue + data.olderRevenue,
                productCount: data.products.size,
                avgDailySales: totalUnits / lookbackDays,
                growthFactor: Math.min(3.0, Math.max(0.3, growthFactor)),
            };
        }

        return { productSales, categorySales, totalWeightedUnits, totalRawUnits };
    }

    calculateSafetyStock(avgDailyDemand: number, stdDevDaily: number, leadTimeDays: number = 7, serviceLevel: number = 0.95): number {
        const zScore = serviceLevel === 0.95 ? 1.65 : serviceLevel === 0.99 ? 2.33 : 1.28;
        const safetyStock = Math.ceil(zScore * stdDevDaily * Math.sqrt(leadTimeDays));
        return Math.max(safetyStock, Math.ceil(avgDailyDemand * 3), 5);
    }

    async generateProductPredictions(totalPredictedRevenue: number, forecastDays: number = 30, categoryEvents?: Record<string, number>): Promise<ProductDemandPrediction[]> {
        const { productSales, categorySales, totalWeightedUnits, totalRawUnits } = await this.getTimeWeightedSales(90);
        const { rows: products } = await db.query('SELECT id, name, category, stock, selling_price FROM products');

        const avgProductPrice = products.length > 0 ? products.reduce((sum: number, p: any) => sum + (Number(p.selling_price) || 0), 0) / products.length : 0;
        const totalPredictedUnits = avgProductPrice > 0 ? totalPredictedRevenue / avgProductPrice : totalPredictedRevenue;

        const predictions: ProductDemandPrediction[] = [];
        for (const product of products) {
            const category = product.category || 'Uncategorized';
            const currentStock = Number(product.stock) || 0;
            const productId = product.id;
            const sales = productSales[productId] || { weighted: 0, raw: 0, recent: 0, older: 0 };
            const catData = categorySales[category];

            let salesProportion = totalWeightedUnits > 0 && sales.weighted > 0 ? sales.weighted / totalWeightedUnits : (totalRawUnits > 0 && sales.raw > 0 ? sales.raw / totalRawUnits : 1 / products.length);
            const categoryGrowthFactor = catData?.growthFactor || 1.0;
            const eventMultiplier = categoryEvents?.[category] || 1.0;

            const predictedDemand = Math.ceil(totalPredictedUnits * salesProportion * categoryGrowthFactor * eventMultiplier);
            const dailyDemand = predictedDemand / forecastDays;
            const stdDevDaily = Math.abs((sales.recent / 30) - (sales.older / 60)) / 2 + dailyDemand * 0.2;
            const safetyStock = this.calculateSafetyStock(dailyDemand, stdDevDaily, 7, 0.95);
            const daysOfStock = dailyDemand > 0 ? Math.floor(currentStock / dailyDemand) : 999;
            const targetStock = predictedDemand + safetyStock;
            const recommendedRestock = Math.max(0, targetStock - currentStock);

            let urgency: 'high' | 'medium' | 'low' = 'low';
            if (daysOfStock < forecastDays / 3 || currentStock < safetyStock / 2) urgency = 'high';
            else if (daysOfStock < forecastDays / 2 || currentStock < safetyStock) urgency = 'medium';

            let confidence = 70 + (sales.raw > 50 ? 20 : (sales.raw > 20 ? 10 : 0)) + (sales.recent > 10 ? 10 : 0);
            confidence = Math.min(95, confidence);

            if (recommendedRestock > 0 || daysOfStock < forecastDays || urgency !== 'low') {
                predictions.push({
                    productId: productId.toString(), productName: product.name, category, currentStock,
                    predictedDemand, recommendedRestock, safetyStock, daysOfStock, urgency, confidence,
                    categoryGrowthFactor, historicalSales: sales.raw, salesProportion,
                });
            }
        }

        return predictions.sort((a: ProductDemandPrediction, b: ProductDemandPrediction) => {
            const order: any = { high: 0, medium: 1, low: 2 };
            if (order[a.urgency] !== order[b.urgency]) return order[a.urgency] - order[b.urgency];
            return b.recommendedRestock - a.recommendedRestock;
        });
    }
}

export const productForecastService = new ProductForecastService();
