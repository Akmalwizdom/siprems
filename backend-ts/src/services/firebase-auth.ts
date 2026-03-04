import axios from 'axios';
import { config } from '../config';

interface VerifiedFirebaseUser {
    uid: string;
    email: string | null;
    name: string | null;
    picture: string | null;
}

type FirebaseAdminModule = {
    apps: unknown[];
    initializeApp: (options?: unknown) => void;
    credential: {
        cert: (serviceAccount: unknown) => unknown;
    };
    auth: () => {
        verifyIdToken: (token: string, checkRevoked?: boolean) => Promise<{
            uid: string;
            email?: string;
            name?: string;
            picture?: string;
        }>;
    };
};

let firebaseAdminModule: FirebaseAdminModule | null | undefined;

function loadFirebaseAdminModule(): FirebaseAdminModule | null {
    if (firebaseAdminModule !== undefined) {
        return firebaseAdminModule;
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        firebaseAdminModule = require('firebase-admin') as FirebaseAdminModule;
    } catch {
        firebaseAdminModule = null;
    }

    return firebaseAdminModule;
}

function resolveServiceAccount(): Record<string, string> | null {
    if (config.firebase.serviceAccountJson) {
        try {
            return JSON.parse(config.firebase.serviceAccountJson) as Record<string, string>;
        } catch {
            return null;
        }
    }

    if (
        config.firebase.projectId &&
        config.firebase.serviceAccountClientEmail &&
        config.firebase.serviceAccountPrivateKey
    ) {
        return {
            project_id: config.firebase.projectId,
            client_email: config.firebase.serviceAccountClientEmail,
            private_key: config.firebase.serviceAccountPrivateKey,
        };
    }

    return null;
}

async function verifyWithFirebaseAdmin(idToken: string): Promise<VerifiedFirebaseUser> {
    const admin = loadFirebaseAdminModule();
    if (!admin) {
        throw new Error('firebase-admin is not installed');
    }

    const serviceAccount = resolveServiceAccount();
    if (!serviceAccount) {
        throw new Error('Firebase service account credentials are not configured');
    }

    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: config.firebase.projectId || serviceAccount.project_id,
        });
    }

    const decoded = await admin.auth().verifyIdToken(idToken, true);
    return {
        uid: decoded.uid,
        email: decoded.email ?? null,
        name: decoded.name ?? null,
        picture: decoded.picture ?? null,
    };
}

async function verifyWithIdentityToolkit(idToken: string): Promise<VerifiedFirebaseUser> {
    if (!config.firebase.webApiKey) {
        throw new Error('FIREBASE_WEB_API_KEY is not configured');
    }

    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.firebase.webApiKey}`;
    const response = await axios.post(url, { idToken }, { timeout: 10_000 });

    const users = response.data?.users as Array<Record<string, unknown>> | undefined;
    if (!users || users.length === 0) {
        throw new Error('Firebase user was not found');
    }

    const account = users[0];
    const localId = account.localId;
    if (typeof localId !== 'string' || localId.length === 0) {
        throw new Error('Invalid Firebase account response');
    }

    return {
        uid: localId,
        email: typeof account.email === 'string' ? account.email : null,
        name: typeof account.displayName === 'string' ? account.displayName : null,
        picture: typeof account.photoUrl === 'string' ? account.photoUrl : null,
    };
}

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser> {
    try {
        return await verifyWithFirebaseAdmin(idToken);
    } catch (adminError) {
        return verifyWithIdentityToolkit(idToken);
    }
}
