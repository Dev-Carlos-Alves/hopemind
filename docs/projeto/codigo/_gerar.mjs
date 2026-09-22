/**
 * Regenera o índice de código a partir dos fontes atuais da base Distac.
 * Executar na raiz: node docs/projeto/codigo/_gerar.mjs
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const output = join(repo, 'docs/projeto/codigo');
const extensions = new Set(['.ts', '.tsx', '.css', '.prisma', '.sql', '.html']);
const roots = ['backend/src', 'backend/prisma', 'backend/stress', 'frontend/src', 'frontend/index.html'];

/** Recursively returns supported source files relative to repository root. */
function collect(path) {
  const absolute = join(repo, path);
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    if (entry.isDirectory()) return collect(child);
    return extensions.has(extname(entry.name)) ? [child] : [];
  });
}

const sources = roots.flatMap((path) =>
  extname(path) ? (extensions.has(extname(path)) ? [path] : []) : collect(path),
);

for (const directory of ['backend', 'frontend']) {
  rmSync(join(output, directory), { recursive: true, force: true });
}
mkdirSync(output, { recursive: true });

for (const source of sources) {
  const doc = join(output, source.replace(/\.[^.]+$/, '.md'));
  mkdirSync(dirname(doc), { recursive: true });
  const toSource = relative(dirname(doc), join(repo, source));
  writeFileSync(
    doc,
    `# \`${source}\`\n\nDocumento gerado a partir da árvore atual da base fusionada.\n\n**Código-fonte:** [\`${source}\`](${toSource})\n\n> Rotas HTTP da API usam o prefixo \`/api\`; consulte \`docs/projeto/fluxo-aplicacao.md\` e Swagger em \`/api/docs\`.\n`,
  );
}

const rows = sources
  .sort()
  .map((source) => `| [\`${source}\`](${source.replace(/\.[^.]+$/, '.md')}) |`)
  .join('\n');
writeFileSync(
  join(output, 'README.md'),
  `# Código anotado — Distac\n\nÍndice regenerado da árvore atual. Execute \`node docs/projeto/codigo/_gerar.mjs\` depois de adicionar, remover ou mover fontes.\n\nA API usa o prefixo \`/api\` e Swagger em \`/api/docs\`.\n\n| Fonte |\n|-------|\n${rows}\n`,
);

console.log(`OK: ${sources.length} documentos em ${output}`);
