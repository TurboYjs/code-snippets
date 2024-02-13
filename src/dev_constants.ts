const useFirebaseEmulatorInDev = true;
const useYjsDevSerInDev = false;

export const SHOULD_USE_FIREBASE_EMULATOR =
  typeof window !== 'undefined' &&
  location.hostname === 'localhost' &&
  useFirebaseEmulatorInDev;
export const SHOULD_USE_DEV_YJS_SERVER =
  (process.env.NODE_ENV !== 'production') ||
  process.env.IS_TEST_ENV;
