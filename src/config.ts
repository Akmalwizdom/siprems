/**
 * Application Configuration
 * Uses environment variables with fallbacks for development
 */

// API Base URL - configurable via .env file
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// App Info
export const APP_NAME = 'SIPREMS';
export const APP_VERSION = '1.0.0';

// Feature flags
export const FEATURES = {
  AI_PREDICTION: true,
  AI_CHATBOT: true,
  EXPORT_PDF: true,
  EXPORT_EXCEL: true,
} as const;
