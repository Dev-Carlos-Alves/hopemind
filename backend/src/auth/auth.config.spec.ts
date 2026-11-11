import { accessSecret, ACCESS_TTL_MS, cookieOptions, REFRESH_TTL_MS } from './auth.config';

describe('configuração de sessão (RNF-004)', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it('em produção os cookies são httpOnly, Secure e SameSite=None (web e API em origens diferentes)', () => {
    process.env.NODE_ENV = 'production';
    expect(cookieOptions(ACCESS_TTL_MS)).toEqual({ httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: ACCESS_TTL_MS });
  });

  it('em desenvolvimento usa SameSite=Lax sem Secure (localhost sem HTTPS)', () => {
    process.env.NODE_ENV = 'development';
    expect(cookieOptions()).toEqual({ httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
  });

  it('acesso dura 15 minutos e renovação 7 dias', () => {
    expect(ACCESS_TTL_MS).toBe(15 * 60 * 1000);
    expect(REFRESH_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('falha cedo quando o segredo do JWT não está configurado', () => {
    delete process.env.JWT_ACCESS_SECRET;
    expect(() => accessSecret()).toThrow(/JWT_ACCESS_SECRET/);
  });
});
