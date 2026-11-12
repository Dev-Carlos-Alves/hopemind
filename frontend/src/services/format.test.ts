import { firstName, greeting, maskCpf, maskPhone, onlyDigits } from './format';
import { formatKm, maskCep, placeLabel } from './address';

describe('máscaras de formulário (US-01)', () => {
  it('extrai apenas dígitos', () => {
    expect(onlyDigits('(81) 9 9999-0000')).toBe('81999990000');
  });

  it.each([
    ['529', '529'],
    ['5299822', '529.982.2'],
    ['52998224725', '529.982.247-25'],
    ['52998224725999', '529.982.247-25'],
  ])('CPF %s → %s', (input, out) => expect(maskCpf(input)).toBe(out));

  it.each([
    ['', ''],
    ['81', '(81'],
    ['819999', '(81) 9999'],
    ['8133334444', '(81) 3333-4444'],
    ['81999990000', '(81) 99999-0000'],
  ])('telefone %s → %s', (input, out) => expect(maskPhone(input)).toBe(out));

  it.each([
    ['52050', '52050'],
    ['520500', '52050-0'],
    ['52050000', '52050-000'],
    ['52.050-000x', '52050-000'],
  ])('CEP %s → %s', (input, out) => expect(maskCep(input)).toBe(out));
});

describe('textos exibidos', () => {
  it('usa o primeiro nome, sem títulos', () => {
    expect(firstName('Dra. Ana Souza')).toBe('Ana');
    expect(firstName('Dr Bruno Lima (CRP 02/1234)')).toBe('Bruno');
  });

  it.each([
    [3, 'Boa noite'],
    [9, 'Bom dia'],
    [15, 'Boa tarde'],
    [21, 'Boa noite'],
  ])('saudação às %ih: %s', (hour, text) => expect(greeting(new Date(2026, 10, 11, hour))).toBe(text));

  it('formata o local como "Bairro, Cidade – UF"', () => {
    expect(placeLabel({ neighborhood: 'Graças', city: 'Recife', state: 'PE' })).toBe('Graças, Recife – PE');
    expect(placeLabel({ city: 'Recife', state: 'PE' })).toBe('Recife – PE');
  });

  it('formata a distância como o motor de match', () => {
    expect(formatKm(0.4)).toBe('menos de 1 km');
    expect(formatKm(8.66)).toBe('8,7 km');
  });
});
