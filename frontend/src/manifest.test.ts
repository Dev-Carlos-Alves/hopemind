import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('manifesto PWA (RNF-003)', () => {
  const publicDir = resolve(__dirname, '../public');
  const manifest = JSON.parse(readFileSync(resolve(publicDir, 'manifest.json'), 'utf8'));

  it('tem nome, start_url e modo standalone para instalação', () => {
    expect(manifest.name).toMatch(/HopeMind/);
    expect(manifest.short_name).toBe('HopeMind');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
  });

  it('declara ícones 192 e 512 que existem de verdade', () => {
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
    for (const icon of manifest.icons) expect(existsSync(resolve(publicDir, `.${icon.src}`))).toBe(true);
  });

  it('é referenciado pelo index.html', () => {
    expect(readFileSync(resolve(__dirname, '../index.html'), 'utf8')).toMatch(/rel="manifest"\s+href="\/manifest.json"/);
  });
});
