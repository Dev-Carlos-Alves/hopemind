import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { api, getErrorMessage } from './api';

type Reply = { status: number; data?: unknown };

/** Routes axios through a fake adapter so no real HTTP request is made. */
function fakeServer(handler: (config: InternalAxiosRequestConfig) => Reply) {
  const calls: string[] = [];
  api.defaults.adapter = async (config) => {
    calls.push(`${config.method?.toUpperCase()} ${config.url}`);
    const { status, data } = handler(config);
    const response = { status, data, statusText: String(status), headers: {}, config, request: {} };
    if (status >= 400) throw new AxiosError(`HTTP ${status}`, String(status), config, {}, response);
    return response;
  };
  return calls;
}

describe('cliente HTTP — sessão por cookies (US-02 / RNF-004)', () => {
  it('envia cookies (withCredentials) e usa /api como base', () => {
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.baseURL).toBe('/api');
  });

  it('em 401 renova a sessão uma vez e repete a requisição', async () => {
    let refreshed = false;
    const calls = fakeServer((c) => {
      if (c.url === '/auth/refresh') {
        refreshed = true;
        return { status: 200 };
      }
      return refreshed ? { status: 200, data: { ok: true } } : { status: 401 };
    });
    const res = await api.get('/matches');
    expect(res.data).toEqual({ ok: true });
    expect(calls).toEqual(['GET /matches', 'POST /auth/refresh', 'GET /matches']);
  });

  it('requisições simultâneas compartilham uma única renovação', async () => {
    let refreshed = false;
    const calls = fakeServer((c) => {
      if (c.url === '/auth/refresh') {
        refreshed = true;
        return { status: 200 };
      }
      return refreshed ? { status: 200 } : { status: 401 };
    });
    await Promise.all([api.get('/matches'), api.get('/sessoes')]);
    expect(calls.filter((c) => c === 'POST /auth/refresh')).toHaveLength(1);
  });

  it('se a renovação falhar, devolve o erro original (o app leva ao login)', async () => {
    fakeServer(() => ({ status: 401 }));
    await expect(api.get('/auth/me')).rejects.toMatchObject({ response: { status: 401 } });
  });

  it('não tenta renovar nas rotas de login, cadastro e logout', async () => {
    const calls = fakeServer(() => ({ status: 401, data: { message: 'E-mail ou senha incorretos.' } }));
    await expect(api.post('/auth/login', {})).rejects.toBeInstanceOf(AxiosError);
    expect(calls).toEqual(['POST /auth/login']);
  });

  it('não renova em outros erros (ex.: 403)', async () => {
    const calls = fakeServer(() => ({ status: 403 }));
    await expect(api.post('/sessoes/agendar', {})).rejects.toBeInstanceOf(AxiosError);
    expect(calls).toEqual(['POST /sessoes/agendar']);
  });
});

describe('mensagens de erro (tabela 4.4 do documento de Integração)', () => {
  const err = (status?: number, data?: unknown) => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    return new AxiosError('x', 'x', config, {}, status ? { status, data, statusText: '', headers: {}, config } : undefined);
  };

  it('sem resposta: servidor inacessível', () => {
    expect(getErrorMessage(err())).toBe('Não foi possível conectar ao servidor.');
  });
  it('429: pede para aguardar', () => {
    expect(getErrorMessage(err(429))).toMatch(/Aguarde um minuto/);
  });
  it('usa a mensagem da API, inclusive a primeira de uma lista de validação', () => {
    expect(getErrorMessage(err(409, { message: 'Horário ocupado.' }))).toBe('Horário ocupado.');
    expect(getErrorMessage(err(400, { message: ['CEP deve ter 8 dígitos.', 'outro'] }))).toBe('CEP deve ter 8 dígitos.');
  });
  it('cai no texto padrão para erros desconhecidos', () => {
    expect(getErrorMessage(new Error('boom'), 'Padrão')).toBe('Padrão');
  });
});
