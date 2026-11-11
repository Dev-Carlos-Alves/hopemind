import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CepService, formatCep, normalizeCep } from './cep.service';

type Route = (url: string) => unknown;

/** Replaces global fetch with canned answers per host; `null` simulates a network failure. */
function mockFetch(routes: Record<string, Route>) {
  const calls: string[] = [];
  const fn = jest.fn(async (input: string) => {
    const url = String(input);
    calls.push(url);
    const host = new URL(url).host;
    const route = routes[host];
    const body = route ? route(url) : undefined;
    if (body === null) throw new Error('network down');
    if (body === undefined) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => body };
  });
  global.fetch = fn as unknown as typeof fetch;
  return calls;
}

const VIACEP_OK = { cep: '52050-000', logradouro: 'Rua das Graças', bairro: 'Graças', localidade: 'Recife', uf: 'PE' };
const NOMINATIM_GRACAS = [{ addresstype: 'suburb', name: 'Graças', lat: '-8.045171', lon: '-34.900771' }];
const NOMINATIM_CITY = [{ addresstype: 'city', name: 'Recife', lat: '-8.0539', lon: '-34.8811' }];

describe('CepService — integração com ViaCEP, BrasilAPI e OpenStreetMap (RF-008)', () => {
  const realFetch = global.fetch;
  let service: CepService;

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });
    service = new CepService();
    jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    jest.useRealTimers();
    global.fetch = realFetch;
  });

  /** The service waits 1 s between Nominatim calls; fast-forward that wait. */
  async function lookup(cep: string) {
    const p = service.lookup(cep);
    p.catch(() => undefined);
    await jest.advanceTimersByTimeAsync(5000);
    return p;
  }

  it('normaliza e formata o CEP', () => {
    expect(normalizeCep('52.050-000')).toBe('52050000');
    expect(formatCep('52050000')).toBe('52050-000');
  });

  it('resolve endereço pelo ViaCEP e coordenadas do bairro pelo Nominatim', async () => {
    const calls = mockFetch({ 'viacep.com.br': () => VIACEP_OK, 'nominatim.openstreetmap.org': () => NOMINATIM_GRACAS });
    const a = await lookup('52050-000');
    expect(a).toEqual({
      cep: '52050-000', street: 'Rua das Graças', neighborhood: 'Graças', city: 'Recife', state: 'PE',
      latitude: -8.04517, longitude: -34.90077, precision: 'bairro',
    });
    expect(calls.some((u) => u.includes('brasilapi'))).toBe(false);
  });

  it('usa a BrasilAPI quando o ViaCEP falha', async () => {
    mockFetch({
      'viacep.com.br': () => null,
      'brasilapi.com.br': () => ({ street: 'Rua X', neighborhood: 'Graças', city: 'Recife', state: 'PE' }),
      'nominatim.openstreetmap.org': () => NOMINATIM_GRACAS,
    });
    const a = await lookup('52050000');
    expect(a.city).toBe('Recife');
    expect(a.precision).toBe('bairro');
  });

  it('cai para o centro da cidade quando o bairro não é encontrado', async () => {
    mockFetch({
      'viacep.com.br': () => VIACEP_OK,
      'nominatim.openstreetmap.org': (url) => (url.includes('Gra') ? [] : NOMINATIM_CITY),
    });
    const a = await lookup('52050000');
    expect(a.precision).toBe('cidade');
    expect(a.latitude).toBeCloseTo(-8.0539, 4);
  });

  it('salva o endereço sem coordenadas quando o Nominatim está fora do ar (não bloqueia o cadastro)', async () => {
    mockFetch({ 'viacep.com.br': () => VIACEP_OK, 'nominatim.openstreetmap.org': () => null });
    const a = await lookup('52050000');
    expect(a.city).toBe('Recife');
    expect(a.latitude).toBeNull();
    expect(a.precision).toBeNull();
  });

  it('retorna 404 quando nenhum provedor conhece o CEP', async () => {
    mockFetch({ 'viacep.com.br': () => ({ erro: true }), 'brasilapi.com.br': () => undefined });
    await expect(lookup('00000000')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('retorna 400 para CEP com tamanho errado, sem chamar serviços externos', async () => {
    const calls = mockFetch({});
    await expect(service.lookup('1234')).rejects.toBeInstanceOf(BadRequestException);
    expect(calls).toHaveLength(0);
  });

  it('guarda o resultado em cache e não repete as consultas', async () => {
    const calls = mockFetch({ 'viacep.com.br': () => VIACEP_OK, 'nominatim.openstreetmap.org': () => NOMINATIM_GRACAS });
    await lookup('52050000');
    const after = calls.length;
    await lookup('52050-000');
    expect(calls.length).toBe(after);
  });

  it('identifica a aplicação no User-Agent do Nominatim (política de uso)', async () => {
    mockFetch({ 'viacep.com.br': () => VIACEP_OK, 'nominatim.openstreetmap.org': () => NOMINATIM_GRACAS });
    await lookup('52050000');
    const nominatimCall = (global.fetch as jest.Mock).mock.calls.find(([u]) => String(u).includes('nominatim'));
    expect(nominatimCall[1].headers['User-Agent']).toMatch(/HopeMind/);
  });
});
