import { evaluateSafety, isRiskLevel, SUPPORT_RESOURCES } from './safety';

describe('protocolo de segurança (RF-009 / RN-008)', () => {
  it.each([
    [{ P26: 'nao', P27: 'nao' }, 'NONE'],
    [{ P26: 'conversar', P27: 'nao' }, 'WANTS_TALK'],
    [{ P26: 'sim', P27: 'nao' }, 'ELEVATED'],
    [{ P26: 'nao', P27: 'nao_sei' }, 'ELEVATED'],
    [{ P26: 'sim', P27: 'sim' }, 'IMMEDIATE'],
    [{ P26: 'nao', P27: 'sim' }, 'IMMEDIATE'],
  ])('classifica %j como %s', (answers, level) => {
    expect(evaluateSafety(answers)).toBe(level);
  });

  it('não acusa risco quando as perguntas de segurança não foram respondidas', () => {
    expect(evaluateSafety({})).toBe('NONE');
  });

  it('só trata ELEVATED e IMMEDIATE como risco para o filtro do match', () => {
    expect(isRiskLevel('NONE')).toBe(false);
    expect(isRiskLevel('WANTS_TALK')).toBe(false);
    expect(isRiskLevel('ELEVATED')).toBe(true);
    expect(isRiskLevel('IMMEDIATE')).toBe(true);
  });

  it('oferece os contatos do CVV (188) e do SAMU (192)', () => {
    const hrefs = SUPPORT_RESOURCES.map((r) => r.href);
    expect(hrefs).toContain('tel:188');
    expect(hrefs).toContain('tel:192');
  });
});
