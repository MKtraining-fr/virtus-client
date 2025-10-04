import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

type FirebaseConfigKeys =
  | 'VITE_FIREBASE_API_KEY'
  | 'VITE_FIREBASE_AUTH_DOMAIN'
  | 'VITE_FIREBASE_PROJECT_ID'
  | 'VITE_FIREBASE_STORAGE_BUCKET'
  | 'VITE_FIREBASE_MESSAGING_SENDER_ID'
  | 'VITE_FIREBASE_APP_ID';

type FirebaseEnv = Record<FirebaseConfigKeys, string>;

const readFirebaseConfig = (): FirebaseEnv => {
  const env = import.meta.env as Record<string, string | undefined>;
  const requiredKeys: FirebaseConfigKeys[] = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missingKeys = requiredKeys.filter((key) => !env[key]);
  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missingKeys.join(', ')}. Make sure they are defined in your Vite environment.`,
    );
  }

  return requiredKeys.reduce((config, key) => {
    config[key] = env[key] as string;
    return config;
  }, {} as FirebaseEnv);
};

const createFirebaseApp = () => {
  if (typeof window === 'undefined') {
    // During SSR or build-time evaluation we still allow initialization with the provided config.
    const config = readFirebaseConfig();
    return initializeApp({
      apiKey: config.VITE_FIREBASE_API_KEY,
      authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: config.VITE_FIREBASE_PROJECT_ID,
      storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: config.VITE_FIREBASE_APP_ID,
    });
  }

  if (!getApps().length) {
    const config = readFirebaseConfig();
    return initializeApp({
      apiKey: config.VITE_FIREBASE_API_KEY,
      authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: config.VITE_FIREBASE_PROJECT_ID,
      storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: config.VITE_FIREBASE_APP_ID,
    });
  }

  return getApp();
};

export const firebaseApp = createFirebaseApp();
export const db = getFirestore(firebaseApp);
