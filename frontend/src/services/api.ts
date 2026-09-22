import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Habilita envio automático dos cookies httpOnly (Modelo Prottus)
  headers: {
    'Content-Type': 'application/json',
  },
});
