import { BOA_VIAGEM, ESPINHEIRO, GRACAS } from '../testing/fixtures';
import { distanceKm, hasCoords } from './distance';

const point = (l: { latitude?: number; longitude?: number }) => ({ latitude: l.latitude!, longitude: l.longitude! });

describe('distância por Haversine (RF-008)', () => {
  it('é zero para o mesmo ponto', () => {
    expect(distanceKm(point(GRACAS), point(GRACAS))).toBe(0);
  });

  it('é simétrica', () => {
    expect(distanceKm(point(GRACAS), point(BOA_VIAGEM))).toBeCloseTo(distanceKm(point(BOA_VIAGEM), point(GRACAS)), 10);
  });

  it('calcula distâncias reais entre bairros do Recife', () => {
    // Graças ↔ Espinheiro são vizinhos (~1 km); Graças ↔ Boa Viagem ficam a ~8,7 km em linha reta.
    expect(distanceKm(point(GRACAS), point(ESPINHEIRO))).toBeGreaterThan(0.8);
    expect(distanceKm(point(GRACAS), point(ESPINHEIRO))).toBeLessThan(1.3);
    expect(distanceKm(point(GRACAS), point(BOA_VIAGEM))).toBeGreaterThan(8);
    expect(distanceKm(point(GRACAS), point(BOA_VIAGEM))).toBeLessThan(9.5);
  });

  it('calcula a distância Recife ↔ São Paulo na ordem correta (~2.100 km)', () => {
    const saoPaulo = { latitude: -23.5505, longitude: -46.6333 };
    expect(distanceKm(point(GRACAS), saoPaulo)).toBeGreaterThan(2000);
    expect(distanceKm(point(GRACAS), saoPaulo)).toBeLessThan(2200);
  });

  it('só considera coordenadas numéricas', () => {
    expect(hasCoords({ latitude: -8, longitude: -34 })).toBe(true);
    expect(hasCoords({ latitude: null as unknown as number, longitude: -34 })).toBe(false);
    expect(hasCoords(null)).toBe(false);
    expect(hasCoords(undefined)).toBe(false);
  });
});
