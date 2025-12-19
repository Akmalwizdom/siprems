import axios from 'axios';
import { config } from '../config';
import { ForecastRequest, ForecastResponse } from '../types';

const ML_SERVICE_URL = config.mlService.url;

class MLClient {
    private client = axios.create({
        baseURL: ML_SERVICE_URL,
        timeout: 60000, // 60 seconds for ML operations
    });

    async trainModel(
        storeId: string,
        endDate?: string,
        forceRetrain: boolean = false
    ): Promise<any> {
        try {
            console.log(`[ML] Training model for store ${storeId}...`);

            const response = await this.client.post('/ml/train', {
                store_id: storeId,
                end_date: endDate,
                force_retrain: forceRetrain,
            });

            console.log(`[ML] Training completed: ${response.data.status}`);
            return response.data;
        } catch (error) {
            console.error('[ML] Training failed:', error);
            throw new Error(`ML training failed: ${error}`);
        }
    }

    async predict(request: ForecastRequest): Promise<ForecastResponse> {
        try {
            console.log(`[ML] Predicting ${request.periods} periods for store ${request.store_id}...`);

            const response = await this.client.post('/ml/predict', {
                store_id: request.store_id,
                periods: request.periods,
                events: request.events || [],
            });

            console.log(`[ML] Prediction completed: ${response.data.predictions?.length || 0} data points`);
            return response.data;
        } catch (error) {
            console.error('[ML] Prediction failed:', error);
            throw new Error(`ML prediction failed: ${error}`);
        }
    }

    async getModelStatus(storeId: string): Promise<any> {
        try {
            const response = await this.client.get(`/ml/model/${storeId}/status`);
            return response.data;
        } catch (error) {
            console.error('[ML] Get model status failed:', error);
            return { exists: false, error: String(error) };
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            await this.client.get('/health', { timeout: 5000 });
            return true;
        } catch (error) {
            console.error('[ML] Health check failed:', error);
            return false;
        }
    }
}

export const mlClient = new MLClient();
