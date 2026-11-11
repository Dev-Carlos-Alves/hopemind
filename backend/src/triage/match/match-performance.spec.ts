import { patientAnswers, patientProfile, syntheticPsychologists } from '../../testing/fixtures';
import { band, computeScore, findMatches, WEIGHTS } from './match-engine';

describe('desempenho e contrato do motor de match (RNF-002 / RN-004)', () => {
  const population = syntheticPsychologists(500);

  it('gera uma população sintética válida e determinística', () => {
    expect(population).toHaveLength(500);
    expect(syntheticPsychologists(5)).toEqual(syntheticPsychologists(5));
  });

  it('calcula o ranking de 500 psicólogos em menos de 3 segundos', () => {
    const patients = [
      patientProfile(),
      patientProfile(patientAnswers({ P20: 'presencial' })),
      patientProfile(patientAnswers({ P20: 'tanto_faz' })),
    ];
    for (const p of patients) {
      const start = performance.now();
      const outcome = findMatches(p, population);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(3000);
      const counted = outcome.results.length + Object.values(outcome.excluded).reduce((a, b) => a + b, 0);
      expect(counted).toBe(500);
    }
  });

  it('ordena por pontuação decrescente, de forma estável', () => {
    const { results } = findMatches(patientProfile(), population);
    expect(results.length).toBeGreaterThan(10);
    for (let i = 1; i < results.length; i++) expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    expect(findMatches(patientProfile(), population).results.map((r) => r.psychologistId)).toEqual(results.map((r) => r.psychologistId));
  });

  it('expõe faixas e nunca percentuais', () => {
    const { results } = findMatches(patientProfile(), population);
    for (const r of results) {
      expect(['alta', 'boa', 'possivel']).toContain(r.band);
      expect(r.band).toBe(band(r.score));
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
      expect(JSON.stringify(r)).not.toMatch(/%/);
    }
  });

  it('respeita os limites das faixas (Alta ≥ 0,75; Boa ≥ 0,55; Possível abaixo)', () => {
    expect(band(0.75)).toBe('alta');
    expect(band(0.7499)).toBe('boa');
    expect(band(0.55)).toBe('boa');
    expect(band(0.5499)).toBe('possivel');
  });

  it('nunca reduz a pontuação quando um fator melhora (monotonicidade)', () => {
    const keys = Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[];
    const base = Object.fromEntries(keys.map((k) => [k, 0.5])) as Record<keyof typeof WEIGHTS, number>;
    for (const k of keys) {
      expect(computeScore({ ...base, [k]: 1 })).toBeGreaterThan(computeScore(base));
    }
    expect(computeScore(Object.fromEntries(keys.map((k) => [k, 1])) as typeof base)).toBeCloseTo(1, 10);
  });

  it('usa os pesos da RN-004', () => {
    expect(WEIGHTS).toEqual({
      demanda: 0.25,
      estilo: 0.18,
      localizacao: 0.15,
      experiencia: 0.14,
      relacao: 0.13,
      disponibilidade: 0.1,
      preferencias: 0.05,
    });
  });
});
