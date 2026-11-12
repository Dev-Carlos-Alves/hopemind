import { isAnswered, isVisible, Questionnaire, QuestionDef, visibleAnswers } from './questionnaire';

const q = (over: Partial<QuestionDef>): QuestionDef => ({ code: 'X', type: 'single', prompt: '?', required: true, usage: 'alta', ...over });

describe('regras do questionário (US-04)', () => {
  it('mostra perguntas condicionais apenas quando a condição é atendida', () => {
    const onlyPresencial = q({ code: 'P24', showIf: { code: 'P20', in: ['presencial', 'tanto_faz'] } });
    expect(isVisible(onlyPresencial, { P20: 'online' })).toBe(false);
    expect(isVisible(onlyPresencial, { P20: 'presencial' })).toBe(true);
    const notNone = q({ code: 'S04', showIf: { code: 'S03', notIn: ['nenhuma'] } });
    expect(isVisible(notNone, {})).toBe(false);
    expect(isVisible(notNone, { S03: ['ansiedade'] })).toBe(true);
    expect(isVisible(q({}), {})).toBe(true);
  });

  it('decide quando uma resposta está completa', () => {
    expect(isAnswered(q({}), undefined, {})).toBe(false);
    expect(isAnswered(q({ type: 'text' }), '   ', {})).toBe(false);
    expect(isAnswered(q({ type: 'multi' }), [], {})).toBe(false);
    expect(isAnswered(q({ type: 'multi' }), ['a'], {})).toBe(true);
    expect(isAnswered(q({ type: 'scale', scale: { minLabel: '', maxLabel: '', allowNotApplicable: true } }), null, {})).toBe(true);
    expect(isAnswered(q({ type: 'scale' }), 3, {})).toBe(true);
    const matrix = q({ type: 'matrix', rowsFrom: 'S03' });
    expect(isAnswered(matrix, { ansiedade: 5 }, { S03: ['ansiedade', 'sono'] })).toBe(false);
    expect(isAnswered(matrix, { ansiedade: 5, sono: 2 }, { S03: ['ansiedade', 'sono'] })).toBe(true);
  });

  it('envia só as respostas de perguntas visíveis', () => {
    const questionnaire: Questionnaire = {
      audience: 'PATIENT',
      version: 'test',
      sections: [{ id: 'a', title: 'A', questions: [q({ code: 'P20' }), q({ code: 'P24', showIf: { code: 'P20', in: ['presencial'] } })] }],
    };
    expect(visibleAnswers(questionnaire, { P20: 'online', P24: 'perto', LIXO: 'x' })).toEqual({ P20: 'online' });
    expect(visibleAnswers(questionnaire, { P20: 'presencial', P24: 'perto' })).toEqual({ P20: 'presencial', P24: 'perto' });
  });
});
