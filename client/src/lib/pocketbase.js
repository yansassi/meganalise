import PocketBase from 'pocketbase';

export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://auth.meganalise.pro:8080');
