import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/register', '/auth/logout'];

let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const isAuthCall = NO_REFRESH_PATHS.some((p) => config?.url?.startsWith(p));

    if (error.response?.status !== 401 || !config || config._retried || isAuthCall) {
      return Promise.reject(error);
    }

    config._retried = true;
    refreshing ??= api.post('/auth/refresh').then(() => undefined).finally(() => {
      refreshing = null;
    });

    try {
      await refreshing;
    } catch {
      return Promise.reject(error);
    }
    return api(config);
  },
);

export function getErrorMessage(err: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Não foi possível conectar ao servidor.';
    if (err.response.status === 429) return 'Muitas tentativas. Aguarde um minuto e tente de novo.';
    const message = (err.response.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (message) return message;
  }
  return fallback;
}
