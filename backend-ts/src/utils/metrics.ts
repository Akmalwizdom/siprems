import client from 'prom-client';

// Initialize the default Prometheus metrics (CPU, Memory, Event Loop Lag, etc.)
const collectDefaultMetrics = client.collectDefaultMetrics;
export const register = new client.Registry();

// Add default metrics with our prefix
collectDefaultMetrics({ register, prefix: 'siprems_' });

// Set up custom HTTP request duration histogram
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'siprems_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// Set up custom HTTP request counter
export const httpRequestCount = new client.Counter({
  name: 'siprems_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCount);
