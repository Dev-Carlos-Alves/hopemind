import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookablePsychologist, BookingSheet } from '../components/BookingSheet';
import { Icon } from '../components/Icon';
import { SafetyPanel } from '../components/SafetyPanel';
import { Avatar, Button, EmptyState, Mascot, PageHeader, Sheet, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, getErrorMessage } from '../services/api';
import { currency, firstName, greeting } from '../services/format';
import { Safety } from '../services/questionnaire';

type Component = 'demanda' | 'estilo' | 'experiencia' | 'relacao' | 'disponibilidade' | 'modalidade' | 'preferencias';

interface MatchItem {
  psychologistId: number;
  score: number;
  band: 'alta' | 'boa' | 'possivel';
  components: Record<Component, number>;
  reasons: string[];
  considerations: string[];
  psychologist: {
    id: number;
    name: string;
    crp: string;
    specialty: string;
    approaches: string[];
    biography: string | null;
    sessionFee: string | number;
    modalities: string[];
    city: string | null;
  };
}

interface MatchResponse {
  algorithmVersion: string;
  safety: Safety;
  evaluated: number;
  excluded: Partial<Record<string, number>>;
  results: MatchItem[];
}

const BAND = {
  alta: { label: 'Alta compatibilidade', tone: 'pill--tint' },
  boa: { label: 'Boa compatibilidade', tone: 'pill--sand' },
  possivel: { label: 'Compatibilidade possível', tone: '' },
} as const;

// Same order and weights as backend/src/triage/match/match-engine.ts (section 6 of the requirements).
const COMPONENTS: Array<{ key: Component; label: string; weight: number }> = [
  { key: 'demanda', label: 'Demandas', weight: 25 },
  { key: 'estilo', label: 'Estilo de condução', weight: 20 },
  { key: 'experiencia', label: 'Experiência específica', weight: 15 },
  { key: 'relacao', label: 'Relação terapêutica', weight: 15 },
  { key: 'disponibilidade', label: 'Agenda', weight: 10 },
  { key: 'modalidade', label: 'Formato e local', weight: 10 },
  { key: 'preferencias', label: 'Preferências pessoais', weight: 5 },
];

const EXCLUSION_TEXT: Record<string, string> = {
  modalidade: 'formato de atendimento',
  regiao: 'cidade',
  faixa_etaria: 'faixa etária atendida',
  demanda_nao_atendida: 'demanda não atendida',
  sem_horario: 'agenda sem horários em comum',
  protocolo_seguranca: 'protocolo de acolhimento',
};

const toBookable = (m: MatchItem): BookablePsychologist => ({
  id: m.psychologist.id,
  name: m.psychologist.name,
  crp: m.psychologist.crp,
  specialty: m.psychologist.specialty,
  biography: m.psychologist.biography,
  sessionFee: m.psychologist.sessionFee,
});

const MatchCard: React.FC<{ match: MatchItem; index: number; onBook: () => void; onExplain: () => void }> = ({
  match,
  index,
  onBook,
  onExplain,
}) => {
  const p = match.psychologist;
  const band = BAND[match.band];
  return (
    <article className="card card--lg match-card animate-rise" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="row gap-4" style={{ alignItems: 'flex-start' }}>
        <Avatar name={p.name} size="lg" />
        <div className="grow">
          <h3 className="t-headline">{p.name}</h3>
          <p className="t-footnote t-secondary">{p.specialty}</p>
          <p className="t-caption t-tertiary">{p.crp}</p>
          <div className="row gap-2 wrap" style={{ marginTop: 8 }}>
            <span className={`pill pill--dot ${band.tone}`}>{band.label}</span>
          </div>
        </div>
      </div>

      <div className="stack gap-2">
        <ul className="stack gap-2" style={{ listStyle: 'none' }}>
          {match.reasons.slice(0, 3).map((r) => (
            <li key={r} className="reason">
              <Icon name="check" size={16} strokeWidth={2.4} />
              {r}
            </li>
          ))}
        </ul>
        <button type="button" className="match-card__why" onClick={onExplain}>
          Por que essa indicação?
          <Icon name="chevron-right" size={14} strokeWidth={2.2} />
        </button>
      </div>

      <div className="row gap-2 wrap">
        {p.approaches.slice(0, 3).map((a) => (
          <span key={a} className="pill">
            {a}
          </span>
        ))}
        {p.modalities.includes('online') && (
          <span className="pill">
            <Icon name="video" size={13} /> Online
          </span>
        )}
        {p.modalities.includes('presencial') && p.city && (
          <span className="pill">
            <Icon name="map-pin" size={13} /> {p.city}
          </span>
        )}
      </div>

      <div className="match-card__footer">
        <div>
          <p className="t-headline">{currency.format(Number(p.sessionFee || 0))}</p>
          <p className="t-caption t-secondary">por sessão</p>
        </div>
        <Button variant="tinted" icon="calendar" onClick={onBook}>
          Ver horários
        </Button>
      </div>
    </article>
  );
};

const ExplainSheet: React.FC<{ match: MatchItem | null; algorithm: string; onClose: () => void }> = ({ match, algorithm, onClose }) => (
  <Sheet open={!!match} onClose={onClose} title="Por que essa indicação?">
    {match && (
      <div className="stack gap-6">
        <div className="row gap-3">
          <Avatar name={match.psychologist.name} />
          <div>
            <p className="t-headline">{match.psychologist.name}</p>
            <p className="t-footnote t-secondary">{BAND[match.band].label}</p>
          </div>
        </div>

        <ul className="stack gap-3" style={{ listStyle: 'none' }}>
          {match.reasons.map((r) => (
            <li key={r} className="reason">
              <Icon name="check" size={16} strokeWidth={2.4} />
              {r}
            </li>
          ))}
          {match.considerations.map((c) => (
            <li key={c} className="reason reason--note">
              <Icon name="info" size={16} />
              {c}
            </li>
          ))}
        </ul>

        <div className="stack gap-3">
          <p className="t-headline">Como calculamos</p>
          {COMPONENTS.map((c) => (
            <div key={c.key} className="meter">
              <span className="meter__label">{c.label}</span>
              <span className="meter__track" aria-hidden>
                <span className="meter__fill" style={{ width: `${Math.round(match.components[c.key] * 100)}%` }} />
              </span>
              <span className="meter__weight">peso {c.weight}%</span>
            </div>
          ))}
        </div>

        <p className="t-footnote t-secondary">
          É uma estimativa de compatibilidade baseada nas respostas de vocês dois — não uma indicação clínica. Profissionais
          com formato, agenda ou público incompatíveis nem entram na lista. Algoritmo {algorithm}.
        </p>
      </div>
    )}
  </Sheet>
);

const MatchSkeleton: React.FC = () => (
  <div className="card card--lg match-card" aria-hidden>
    <div className="row gap-4">
      <Skeleton width={64} height={64} radius={32} />
      <div className="grow stack gap-2">
        <Skeleton width="60%" height={18} />
        <Skeleton width="45%" height={12} />
      </div>
    </div>
    <Skeleton height={12} />
    <Skeleton width="85%" height={12} />
    <Skeleton width="70%" height={12} />
    <div className="match-card__footer">
      <Skeleton width={90} height={22} />
      <Skeleton width={130} height={44} radius={22} />
    </div>
  </div>
);

export const PatientDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [booking, setBooking] = useState<BookablePsychologist | null>(null);
  const [explaining, setExplaining] = useState<MatchItem | null>(null);

  useEffect(() => {
    if (!user?.hasTriage) {
      setLoading(false);
      return;
    }
    api
      .get<MatchResponse>('/matches')
      .then((res) => setData(res.data))
      .catch((err) => toast.error(getErrorMessage(err, 'Não foi possível carregar suas recomendações.')))
      .finally(() => setLoading(false));
  }, [user?.hasTriage, toast]);

  const results = useMemo(() => {
    const all = data?.results ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((m) =>
      `${m.psychologist.name} ${m.psychologist.specialty} ${m.psychologist.approaches.join(' ')}`.toLowerCase().includes(q),
    );
  }, [data, query]);

  const excludedTotal = Object.values(data?.excluded ?? {}).reduce<number>((a, b) => a + (b ?? 0), 0);
  const excludedWhy = Object.keys(data?.excluded ?? {})
    .map((k) => EXCLUSION_TEXT[k])
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <PageHeader
        eyebrow="Para você"
        title={`${greeting()}, ${user ? firstName(user.name) : ''}`}
        subtitle={
          user?.hasTriage
            ? 'Estes profissionais combinam com o que você nos contou sobre suas necessidades, seu jeito e sua rotina.'
            : 'Para recomendarmos profissionais, precisamos conhecer um pouco do que você procura.'
        }
      />

      {data && data.safety.level !== 'NONE' && <SafetyPanel safety={data.safety} compact />}

      {!user?.hasTriage ? (
        <section className="hero">
          <div className="stack gap-4">
            <h2 className="t-title-1 t-balance">Vamos encontrar alguém que combine com você</h2>
            <p className="t-callout t-secondary" style={{ maxWidth: 480 }}>
              Leva uns 5 minutos: o que você busca, como gosta de conversar e quando pode ser atendido. Não é um diagnóstico —
              é só para entender suas preferências.
            </p>
            <div>
              <Link to="/triagem" className="btn btn--filled btn--lg">
                Começar questionário
                <Icon name="arrow-right" size={18} />
              </Link>
            </div>
          </div>
          <Mascot size={132} className="hero__art" />
        </section>
      ) : (
        <section className="section">
          <div className="section__header">
            <h2 className="t-title-2">Recomendados</h2>
            <div className="search section__search">
              <Icon name="search" size={18} className="search__icon" />
              <input
                className="search__input"
                type="search"
                placeholder="Buscar por nome ou abordagem"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar profissionais"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid-cards">
              <MatchSkeleton />
              <MatchSkeleton />
              <MatchSkeleton />
            </div>
          ) : results.length === 0 ? (
            <div className="card card--lg">
              <EmptyState
                title={query ? 'Nenhum resultado' : 'Ainda sem recomendações'}
                text={
                  query
                    ? `Não encontramos profissionais para “${query}”.`
                    : 'Nenhum profissional atende hoje ao formato, agenda e público que você indicou. Ampliar sua disponibilidade costuma ajudar.'
                }
                action={
                  !query && (
                    <Link to="/triagem" className="btn btn--tinted">
                      Revisar respostas
                    </Link>
                  )
                }
              />
            </div>
          ) : (
            <div className="grid-cards">
              {results.map((m, i) => (
                <MatchCard
                  key={m.psychologistId}
                  match={m}
                  index={i}
                  onBook={() => setBooking(toBookable(m))}
                  onExplain={() => setExplaining(m)}
                />
              ))}
            </div>
          )}

          {data && (
            <div className="stack gap-2">
              {excludedTotal > 0 && (
                <p className="t-footnote t-secondary row gap-2" style={{ alignItems: 'flex-start' }}>
                  <Icon name="sliders" size={14} />
                  <span>
                    {excludedTotal} {excludedTotal === 1 ? 'profissional não aparece' : 'profissionais não aparecem'} por
                    incompatibilidade de {excludedWhy}. <Link to="/triagem">Revisar respostas</Link>
                  </span>
                </p>
              )}
              <p className="t-footnote t-secondary row gap-2">
                <Icon name="info" size={14} />
                A compatibilidade é uma estimativa baseada nas suas respostas, não uma indicação clínica.
              </p>
            </div>
          )}
        </section>
      )}

      <BookingSheet key={booking?.id ?? 'none'} psychologist={booking} onClose={() => setBooking(null)} />
      <ExplainSheet match={explaining} algorithm={data?.algorithmVersion ?? ''} onClose={() => setExplaining(null)} />
    </>
  );
};
