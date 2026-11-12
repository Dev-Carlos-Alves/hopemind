/**
 * In-memory stand-in for PrismaService used by the HTTP integration tests (Plano de Teste, 1.2).
 * It implements only the queries the services issue, with the same shapes Prisma returns
 * (select/include projection, nested create, OR filters, date ranges), so no test ever writes
 * to the real Supabase database.
 */

type Row = Record<string, any>;
type Tables = Record<'user' | 'patient' | 'psychologist' | 'triageSubmission' | 'safetyAlert' | 'matchRun' | 'appointment', Row[]>;

const RELATIONS: Record<string, Record<string, { model: keyof Tables; local: string; foreign: string; many?: boolean }>> = {
  user: {
    patient: { model: 'patient', local: 'id', foreign: 'userId' },
    psychologist: { model: 'psychologist', local: 'id', foreign: 'userId' },
    triageSubmissions: { model: 'triageSubmission', local: 'id', foreign: 'userId', many: true },
  },
  patient: { user: { model: 'user', local: 'userId', foreign: 'id' } },
  psychologist: { user: { model: 'user', local: 'userId', foreign: 'id' } },
  appointment: {
    patient: { model: 'patient', local: 'patientId', foreign: 'id' },
    psychologist: { model: 'psychologist', local: 'psychologistId', foreign: 'id' },
  },
};

const DEFAULTS: Record<string, () => Row> = {
  user: () => ({ isActive: true, gender: 'Não informado', cep: null, street: null, addressNumber: null, neighborhood: null, city: null, state: null, latitude: null, longitude: null }),
  patient: () => ({ mainComplaint: null }),
  psychologist: () => ({ biography: null, contactLink: null, sessionFee: 0 }),
  triageSubmission: () => ({ safetyLevel: 'NONE' }),
  safetyAlert: () => ({ status: 'OPEN', resolvedAt: null }),
  matchRun: () => ({}),
  appointment: () => ({ status: 'SCHEDULED' }),
};

const clone = <T>(v: T): T => (v instanceof Date ? (new Date(v) as T) : v && typeof v === 'object' ? structuredClone(v) : v);

export class FakePrisma {
  tables: Tables = { user: [], patient: [], psychologist: [], triageSubmission: [], safetyAlert: [], matchRun: [], appointment: [] };
  private ids: Record<string, number> = {};
  private clock = 0;

  user = this.delegate('user');
  patient = this.delegate('patient');
  psychologist = this.delegate('psychologist');
  triageSubmission = this.delegate('triageSubmission');
  safetyAlert = this.delegate('safetyAlert');
  matchRun = this.delegate('matchRun');
  appointment = this.delegate('appointment');

  /** Simula a perda de conexão com o banco (health check do banco). */
  databaseDown = false;

  async $queryRaw(..._args: unknown[]) {
    if (this.databaseDown) throw new Error("Can't reach database server");
    return [{ '?column?': 1 }];
  }

  async $connect() {}
  async $disconnect() {}
  async $transaction<T>(fn: (tx: this) => Promise<T>) {
    return fn(this);
  }

  reset() {
    this.databaseDown = false;
    for (const k of Object.keys(this.tables) as (keyof Tables)[]) this.tables[k] = [];
    this.ids = {};
  }

  /* ───── internals ───── */

  insert(model: keyof Tables, data: Row): Row {
    const nested: [string, Row][] = [];
    const row: Row = { ...DEFAULTS[model](), id: (this.ids[model] = (this.ids[model] ?? 0) + 1), createdAt: new Date(Date.now() + this.clock++) };
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      if (RELATIONS[model]?.[k] && v && typeof v === 'object' && 'create' in v) nested.push([k, v.create]);
      else row[k] = clone(v);
    }
    this.tables[model].push(row);
    for (const [rel, payload] of nested) {
      const r = RELATIONS[model][rel];
      this.insert(r.model, { ...payload, [r.foreign]: row[r.local] });
    }
    return row;
  }

  private matches(model: keyof Tables, row: Row, where: Row = {}): boolean {
    return Object.entries(where).every(([key, cond]) => {
      if (key === 'OR') return (cond as Row[]).some((c) => this.matches(model, row, c));
      const rel = RELATIONS[model]?.[key];
      if (rel) {
        const target = this.tables[rel.model].find((t) => t[rel.foreign] === row[rel.local]);
        return !!target && this.matches(rel.model, target, cond);
      }
      if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
        const v = row[key];
        if ('gte' in cond && !(v >= cond.gte)) return false;
        if ('lte' in cond && !(v <= cond.lte)) return false;
        if ('equals' in cond && v !== cond.equals) return false;
        return true;
      }
      return cond instanceof Date ? +row[key] === +cond : row[key] === cond;
    });
  }

  private sort(rows: Row[], orderBy?: Row) {
    if (!orderBy) return rows;
    const [[field, dir]] = Object.entries(orderBy);
    return [...rows].sort((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0) * (dir === 'desc' ? -1 : 1));
  }

  private project(model: keyof Tables, row: Row | undefined, args: Row = {}): Row | null {
    if (!row) return null;
    const out: Row = {};
    const spec = args.select ?? args.include;
    if (!args.select) for (const [k, v] of Object.entries(row)) out[k] = clone(v);
    if (!spec) return out;
    for (const [key, opt] of Object.entries(spec)) {
      if (!opt) continue;
      const rel = RELATIONS[model]?.[key];
      if (!rel) {
        out[key] = clone(row[key]);
        continue;
      }
      const nestedArgs = opt === true ? {} : (opt as Row);
      let related = this.tables[rel.model].filter((t) => t[rel.foreign] === row[rel.local]);
      if (rel.many) {
        related = this.sort(related, nestedArgs.orderBy);
        if (nestedArgs.take) related = related.slice(0, nestedArgs.take);
        out[key] = related.map((r) => this.project(rel.model, r, nestedArgs));
      } else {
        out[key] = this.project(rel.model, related[0], nestedArgs);
      }
    }
    return out;
  }

  private delegate(model: keyof Tables) {
    const rows = () => this.tables[model];
    const find = (args: Row = {}) => this.sort(rows().filter((r) => this.matches(model, r, args.where)), args.orderBy);
    return {
      findUnique: async (args: Row) => this.project(model, find(args)[0], args),
      findFirst: async (args: Row = {}) => this.project(model, find(args)[0], args),
      findMany: async (args: Row = {}) => find(args).map((r) => this.project(model, r, args)),
      count: async (args: Row = {}) => find(args).length,
      create: async (args: Row) => this.project(model, this.insert(model, args.data), args),
      update: async (args: Row) => {
        const row = find(args)[0];
        if (!row) throw new Error(`${model} não encontrado`);
        Object.assign(row, clone(args.data));
        return this.project(model, row, args);
      },
    };
  }
}
