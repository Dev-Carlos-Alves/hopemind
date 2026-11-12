import { MailService, parseAddress } from './mail.service';

describe('MailService', () => {
  const env = { ...process.env };
  const mail = { to: 'ana@teste.dev', subject: 'Código', text: 'Seu código é 123456.' };
  let fetchMock: jest.Mock;

  beforeEach(() => {
    for (const k of ['BREVO_API_KEY', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM']) delete process.env[k];
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });
  afterAll(() => {
    process.env = env;
  });

  it('separa nome e e-mail do remetente', () => {
    expect(parseAddress('HopeMind <contato@hopemind.app>')).toEqual({ name: 'HopeMind', email: 'contato@hopemind.app' });
    expect(parseAddress(' contato@hopemind.app ')).toEqual({ email: 'contato@hopemind.app' });
  });

  it('sem configuração não envia (e não lança erro)', async () => {
    const service = new MailService();
    expect(service.configured).toBe(false);
    await expect(service.send(mail)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('com BREVO_API_KEY envia pela API HTTP do Brevo, com o remetente de MAIL_FROM', async () => {
    process.env.BREVO_API_KEY = 'chave-de-teste';
    process.env.MAIL_FROM = 'HopeMind <contato@hopemind.app>';
    fetchMock.mockResolvedValue({ ok: true, status: 201, text: async () => '' });
    const service = new MailService();

    await expect(service.send(mail)).resolves.toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.headers['api-key']).toBe('chave-de-teste');
    expect(JSON.parse(init.body)).toEqual({
      sender: { name: 'HopeMind', email: 'contato@hopemind.app' },
      to: [{ email: 'ana@teste.dev' }],
      subject: 'Código',
      textContent: 'Seu código é 123456.',
    });
  });

  it('o Brevo tem prioridade sobre o SMTP e um erro dele vira false', async () => {
    process.env.BREVO_API_KEY = 'chave-de-teste';
    process.env.SMTP_HOST = 'smtp.exemplo.com';
    process.env.SMTP_USER = 'u';
    process.env.SMTP_PASS = 'p';
    fetchMock.mockResolvedValue({ ok: false, status: 401, text: async () => 'Key not found' });
    const service = new MailService();
    expect(service.provider).toBe('brevo');
    await expect(service.send(mail)).resolves.toBe(false);
  });
});
