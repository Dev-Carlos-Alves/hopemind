import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * LGPD (RNF-007): deleting a user must remove every record that depends on it. The account
 * deletion endpoint is planned, but the cascade rules it relies on already live in the schema.
 */
describe('modelo de dados — exclusão em cascata (RNF-007)', () => {
  const schema = readFileSync(join(__dirname, '../../prisma/schema.prisma'), 'utf8');

  const modelBody = (name: string) => {
    const m = schema.match(new RegExp(`model ${name} \\{([\\s\\S]*?)\\n\\}`));
    if (!m) throw new Error(`model ${name} não encontrado`);
    return m[1];
  };
  const relation = (model: string, field: string) =>
    modelBody(model)
      .split('\n')
      .find((l) => new RegExp(`^\\s*${field}\\s`).test(l)) ?? '';

  it.each([
    ['Patient', 'user'],
    ['Psychologist', 'user'],
    ['TriageSubmission', 'user'],
    ['SafetyAlert', 'patient'],
    ['SafetyAlert', 'submission'],
    ['MatchRun', 'patient'],
    ['MatchRun', 'submission'],
    ['Appointment', 'patient'],
    ['Appointment', 'psychologist'],
  ])('%s.%s usa onDelete: Cascade', (model, field) => {
    expect(relation(model, field)).toMatch(/onDelete:\s*Cascade/);
  });

  it('mantém a trilha de auditoria quando o usuário é excluído (SET NULL)', () => {
    expect(relation('AuditLog', 'user')).toMatch(/onDelete:\s*SetNull/);
  });

  it('e-mail, CPF e CRP são únicos', () => {
    expect(relation('User', 'email')).toMatch(/@unique/);
    expect(relation('User', 'cpf')).toMatch(/@unique/);
    expect(relation('Psychologist', 'crp')).toMatch(/@unique/);
  });

  it('as tabelas usam os nomes documentados', () => {
    for (const table of ['users', 'patients', 'psychologists', 'triage_submissions', 'safety_alerts', 'match_runs', 'appointments', 'audit_logs']) {
      expect(schema).toContain(`@@map("${table}")`);
    }
  });
});
