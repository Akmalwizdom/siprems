import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK for server-side JWT verification.
 * 
 * Uses Application Default Credentials (ADC) in production.
 * Set GOOGLE_APPLICATION_CREDENTIALS env var to point to
 * your Firebase service account JSON key file, OR deploy on
 * a Google Cloud environment where ADC is automatically available.
 * 
 * For local development without a service account file,
 * set FIREBASE_PROJECT_ID to enable token verification.
 */
if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (serviceAccountPath) {
        // Production: use service account key file
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId,
        });
        console.log('[Firebase Admin] Initialized with service account credentials');
    } else if (projectId) {
        // Fallback: initialize with just project ID (works in Google Cloud)
        admin.initializeApp({ projectId });
        console.log(`[Firebase Admin] Initialized with project ID: ${projectId}`);
    } else {
        // Minimal initialization for development (will still verify tokens if project ID is set)
        admin.initializeApp();
        console.warn('[Firebase Admin] Initialized without explicit credentials — token verification may fail');
    }
}

export const firebaseAdmin = admin;
export const firebaseAuth = admin.auth();
