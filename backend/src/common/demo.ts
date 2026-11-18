/** Demo fleet, rides, wallets, KYC and users are seeded unless SEED_DEMO=false. */
export const isDemoSeedEnabled = () => process.env.SEED_DEMO !== 'false';

/** Public demo server: re-enables simulate-ride, reset-seed and mock bKash in production. Admin key, OTP and CORS gates stay on. */
export const isDemoMode = () => process.env.DEMO_MODE === 'true';
