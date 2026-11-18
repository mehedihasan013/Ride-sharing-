// Set VITE_API_URL at build time for deployed environments.
export const API_BASE: string = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
