import { api } from './api';
import { onlyDigits } from './format';

/** What GET /api/geo/cep/:cep returns (ViaCEP/BrasilAPI + OpenStreetMap). */
export interface CepAddress {
  cep: string;
  street: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  precision: 'bairro' | 'cidade' | null;
}

/** Address fields stored on the user (GET /api/auth/me). */
export interface ProfileAddress {
  cep: string | null;
  street: string | null;
  addressNumber: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
}

export function maskCep(value: string) {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export const lookupCep = (cep: string) => api.get<CepAddress>(`/geo/cep/${onlyDigits(cep)}`).then((r) => r.data);

export const saveAddress = (cep: string, addressNumber?: string) =>
  api.patch<ProfileAddress>('/auth/me/address', { cep: onlyDigits(cep), addressNumber: addressNumber || undefined }).then((r) => r.data);

/** "Graças, Recife – PE" */
export function placeLabel(a: { neighborhood?: string | null; city?: string | null; state?: string | null }) {
  const city = [a.city, a.state].filter(Boolean).join(' – ');
  return [a.neighborhood, city].filter(Boolean).join(', ');
}

/** "1,2 km" / "menos de 1 km" — same wording as the match engine. */
export const formatKm = (km: number) => (km < 1 ? 'menos de 1 km' : `${km.toFixed(1).replace('.', ',')} km`);
