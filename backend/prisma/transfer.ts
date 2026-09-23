/**
 * Copia os dados do HopeMind entre bancos, passando por um arquivo JSON.
 * Foi usado para levar o banco local (MariaDB) para o Supabase (PostgreSQL):
 *
 *   npx ts-node prisma/transfer.ts export dados.json   # lê do banco do DATABASE_URL atual
 *   npx ts-node prisma/transfer.ts import dados.json   # grava no banco do DATABASE_URL atual (precisa estar vazio)
 *
 * Os ids são mantidos, então relações e sessões agendadas continuam apontando para os mesmos registros.
 */
import { Prisma, PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync } from 'node:fs';

const prisma = new PrismaClient();

/** Schema do PostgreSQL onde ficam as tabelas (parâmetro ?schema= da URL; padrão public). */
const SCHEMA = (() => {
  try {
    return new URL(process.env.DATABASE_URL ?? '').searchParams.get('schema') || 'public';
  } catch {
    return 'public';
  }
})();

// Ordem que respeita as chaves estrangeiras.
const TABLES = [
  ['user', 'users'],
  ['patient', 'patients'],
  ['psychologist', 'psychologists'],
  ['triageSubmission', 'triage_submissions'],
  ['safetyAlert', 'safety_alerts'],
  ['matchRun', 'match_runs'],
  ['appointment', 'appointments'],
  ['auditLog', 'audit_logs'],
] as const;

type Model = (typeof TABLES)[number][0];
type Delegate = { findMany(args?: unknown): Promise<Record<string, unknown>[]>; createMany(args: unknown): Promise<{ count: number }>; count(): Promise<number> };
const delegate = (m: Model) => prisma[m] as unknown as Delegate;

const DATE_FIELDS = new Set(['birthDate', 'createdAt', 'updatedAt', 'resolvedAt', 'appointmentDate']);

/** JSON não tem BigInt nem Decimal: vira texto na exportação e volta ao tipo certo na importação. */
const toJson = (row: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k,
      typeof v === 'bigint' ? { $bigint: v.toString() } : v instanceof Prisma.Decimal ? { $decimal: v.toString() } : v,
    ]),
  );

const fromJson = (row: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(row).map(([k, v]) => {
      if (v && typeof v === 'object' && '$bigint' in v) return [k, BigInt((v as { $bigint: string }).$bigint)];
      if (v && typeof v === 'object' && '$decimal' in v) return [k, new Prisma.Decimal((v as { $decimal: string }).$decimal)];
      if (DATE_FIELDS.has(k) && typeof v === 'string') return [k, new Date(v)];
      // Campos Json nulos precisam do marcador do Prisma para serem gravados.
      if (v === null && (k === 'payload' || k === 'answers' || k === 'results')) return [k, Prisma.DbNull];
      return [k, v];
    }),
  );

async function exportTo(file: string) {
  const data: Record<string, unknown[]> = {};
  for (const [model] of TABLES) {
    data[model] = (await delegate(model).findMany({ orderBy: { id: 'asc' } })).map(toJson);
    console.log(`  ${model}: ${data[model].length}`);
  }
  writeFileSync(file, JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2));
  console.log(`Exportado para ${file}`);
}

async function importFrom(file: string) {
  const { data } = JSON.parse(readFileSync(file, 'utf8')) as { data: Record<Model, Record<string, unknown>[]> };

  for (const [model] of TABLES) {
    if ((await delegate(model).count()) > 0) {
      throw new Error(`A tabela de ${model} já tem dados. Importe num banco vazio (npx prisma db push --force-reset).`);
    }
  }

  for (const [model, table] of TABLES) {
    const rows = (data[model] ?? []).map(fromJson);
    if (rows.length) await delegate(model).createMany({ data: rows });
    // Como os ids vieram prontos, o contador do PostgreSQL precisa continuar depois do maior id.
    const qualified = `"${SCHEMA}"."${table}"`;
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('${qualified}', 'id'), COALESCE((SELECT MAX(id) FROM ${qualified}), 0) + 1, false)`,
    );
    console.log(`  ${model}: ${rows.length}`);
  }
  console.log('Importação concluída.');
}

const [mode, file] = process.argv.slice(2);
const run = mode === 'export' ? exportTo : mode === 'import' ? importFrom : null;
if (!run || !file) {
  console.error('Uso: npx ts-node prisma/transfer.ts <export|import> <arquivo.json>');
  process.exit(1);
}

run(file)
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
