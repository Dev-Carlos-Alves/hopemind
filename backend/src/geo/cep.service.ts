import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

export interface CepAddress {
  cep: string;
  street: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  /** How precise the coordinates are: the neighborhood centre, the city centre, or unknown. */
  precision: 'bairro' | 'cidade' | null;
}

const TIMEOUT_MS = 6000;
// Nominatim's usage policy: identify the app and make at most one request per second.
const NOMINATIM_UA = 'HopeMind-Academic/1.0';
const NEIGHBORHOOD_TYPES = ['suburb', 'neighbourhood', 'quarter', 'city_district'];

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const normalizeCep = (raw: string) => raw.replace(/\D/g, '');
export const formatCep = (digits: string) => `${digits.slice(0, 5)}-${digits.slice(5)}`;

/**
 * Resolves a CEP to an address (ViaCEP, falling back to BrasilAPI) and to coordinates
 * (OpenStreetMap/Nominatim, at neighborhood level). BrasilAPI's own coordinates are not used:
 * for most CEPs they are just the city centroid, which would make every distance look the same.
 */
@Injectable()
export class CepService {
  private readonly logger = new Logger(CepService.name);
  private readonly cache = new Map<string, CepAddress>();
  private nominatimQueue: Promise<unknown> = Promise.resolve();

  async lookup(raw: string): Promise<CepAddress> {
    const digits = normalizeCep(raw ?? '');
    if (digits.length !== 8) throw new BadRequestException('Informe um CEP com 8 dígitos.');

    const cached = this.cache.get(digits);
    if (cached) return cached;

    const base = (await this.fromViaCep(digits)) ?? (await this.fromBrasilApi(digits));
    if (!base) throw new NotFoundException('CEP não encontrado.');

    const coords =
      (base.neighborhood && (await this.geocode(`${base.neighborhood}, ${base.city}, ${base.state}, Brasil`, true))) ||
      (await this.geocode(`${base.city}, ${base.state}, Brasil`, false));

    const address: CepAddress = {
      ...base,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      precision: coords?.precision ?? null,
    };
    this.cache.set(digits, address);
    return address;
  }

  private async fromViaCep(cep: string) {
    const data = await this.getJson<Record<string, string>>(`https://viacep.com.br/ws/${cep}/json/`);
    if (!data || 'erro' in data || !data.localidade) return null;
    return {
      cep: formatCep(cep),
      street: data.logradouro || null,
      neighborhood: data.bairro || null,
      city: data.localidade,
      state: data.uf,
    };
  }

  private async fromBrasilApi(cep: string) {
    const data = await this.getJson<Record<string, string>>(`https://brasilapi.com.br/api/cep/v2/${cep}`);
    if (!data?.city) return null;
    return {
      cep: formatCep(cep),
      street: data.street || null,
      neighborhood: data.neighborhood || null,
      city: data.city,
      state: data.state,
    };
  }

  private geocode(query: string, neighborhood: boolean) {
    // Serialize calls and keep them one second apart.
    const run = this.nominatimQueue.then(async () => {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.search = new URLSearchParams({ q: query, format: 'jsonv2', limit: '8', countrycodes: 'br' }).toString();
      const list = await this.getJson<Array<Record<string, string>>>(url.toString(), { 'User-Agent': NOMINATIM_UA });
      await new Promise((r) => setTimeout(r, 1000));
      if (!Array.isArray(list)) return null;

      const wanted = fold(query.split(',')[0]);
      const hit = neighborhood
        ? list.find((x) => NEIGHBORHOOD_TYPES.includes(x.addresstype) && fold(x.name ?? '') === wanted)
        : list.find((x) => ['city', 'town', 'municipality'].includes(x.addresstype));
      if (!hit) return null;
      return {
        latitude: Math.round(Number(hit.lat) * 1e5) / 1e5,
        longitude: Math.round(Number(hit.lon) * 1e5) / 1e5,
        precision: (neighborhood ? 'bairro' : 'cidade') as CepAddress['precision'],
      };
    });
    this.nominatimQueue = run.catch(() => null);
    return run;
  }

  private async getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch (err) {
      this.logger.warn(`Falha ao consultar ${new URL(url).host}: ${(err as Error).message}`);
      return null;
    }
  }
}
