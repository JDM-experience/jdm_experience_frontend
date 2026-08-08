export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const USE_MOCKS: boolean = (import.meta.env.VITE_USE_MOCKS ?? 'true') !== 'false';
