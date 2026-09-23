import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AddressCard } from '../components/AddressCard';
import { BookablePsychologist, BookingSheet } from '../components/BookingSheet';
import { Icon } from '../components/Icon';
import { QuestionnaireForm } from '../components/QuestionnaireForm';
import { SafetyPanel } from '../components/SafetyPanel';
import { Avatar, Button, EmptyState, Mascot, PageHeader, Segmented, Sheet, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatKm, placeLabel } from '../services/address';
import { api, getErrorMessage } from '../services/api';
import { currency, firstName } from '../services/format';
import { Safety } from '../services/questionnaire';

type Component = 'demanda' | 'estilo' | 'experiencia' | 'relacao' | 'disponibilidade' | 'localizacao' | 'preferencias';
type Sort = 'score' | 'distance';

interface MatchItem {
  psychologistId: number;
  score: number;
  band: 'alta' | 'boa' | 'possivel';
  components: Record<Component, number>;
  distanceKm: number | null;
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
    neighborhood: string | null;
    city: string | null;
  };
}

interface MatchResponse {
  algorithmVersion: string;
  safety: Safety;
  evaluated: number;
  modality: 'online' | 'presencial' | 'tanto_faz' | null;
  location: { neighborhood: string | null; city: string } | null;
  excluded: Partial<Record<string, number>>;
  results: MatchItem[];
}

/** How many matches are shown before "Ver mais". */
const TOP = 10;

const BAND = {
  alta: { label: 'Alta compatibilidade', tone: 'pill--tint' },
  boa: { label: 'Boa compatibilidade', tone: 'pill--sand' },
  possivel: { label: 'Compatibilidade possível', tone: '' },
} as const;

// Same order and weights as backend/src/triage/match/match-engine.ts.
const COMPONENTS: Array<{ key: Component; label: string; weight: number }> = [
  { key: 'demanda', label: 'Demandas', weight: 25 },
  { key: 'estilo', label: 'Estilo de condução', weight: 18 },
  { key: 'localizacao', label: 'Formato e distância', weight: 15 },
  { key: 'experiencia', label: 'Experiência específica', weight: 14 },
  { key: 'relacao', label: 'Relação terapêutica', weight: 13 },
  { key: 'disponibilidade', label: 'Agenda', weight: 10 },
  { key: 'preferencias', label: 'Preferências pessoais', weight: 5 },
];

const EXCLUSION_TEXT: Record<string, string> = {
  modalidade: 'formato de atendimento',
  regiao: 'distância até o consultório',
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

const MatchCard: React.FC<{ match: MatchItem; rank: number; index: number; onBook: () => void; onExplain: () => void }> = ({
  match,
  rank,
  index,
  onBook,
  onExplain,
}) => {
  const p = match.psychologist;
  const band = BAND[match.band];
  const inPerson = p.modalities.includes('presencial');
  return (
    <article className="card card--lg match-card animate-rise" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
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
        <span className="match-card__rank" aria-label={`${rank}º na sua lista`}>
          {rank}
        </span>
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
        {inPerson && p.neighborhood && (
          <span className="pill pill--peach">
            <Icon name="map-pin" size={13} /> {p.neighborhood}
            {match.distanceKm !== null && ` · ${formatKm(match.distanceKm)}`}
          </span>
        )}
        {p.modalities.includes('online') && (
          <span className="pill">
            <Icon name="video" size={13} /> Online
          </span>
        )}
        {p.approaches.slice(0, 2).map((a) => (
          <span key={a} className="pill">
            {a}
          </span>
        ))}
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
                <span className="meter__fill" style={{ width: `${Math.round((match.components[c.key] ?? 0) * 100)}%` }} />
              </span>
              <span className="meter__weight">peso {c.weight}%</span>
            </div>
          ))}
        </div>

        <p className="t-footnote t-secondary">
          É uma estimativa de compatibilidade baseada nas respostas de vocês dois e na distância entre os CEPs — não uma indicação
          clínica. Profissionais com formato, agenda ou público incompatíveis nem entram na lista. Algoritmo {algorithm}.
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

const submittedFmt = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' });

/** "Meu questionário": collapsed summary that expands into the full questionnaire. */
const QuestionnairePanel: React.FC<{
  answered: boolean;
  open: boolean;
  onToggle: () => void;
  onSubmitted: (safety: Safety) => void;
  submittedAt: string | null;
}> = ({ answered, open, onToggle, onSubmitted, submittedAt }) => (
  <section className={`card card--lg disclosure${open ? ' disclosure--open' : ''}`}>
    <button type="button" className="disclosure__header" onClick={onToggle} aria-expanded={open} aria-controls="meu-questionario">
      <span className="disclosure__icon">
        <Icon name="clipboard" size={22} />
      </span>
      <span className="grow stack gap-1" style={{ textAlign: 'left' }}>
        <span className="t-headline">Meu questionário</span>
        <span className="t-footnote t-secondary">
          {answered
            ? `Respondido${submittedAt ? ` em ${submittedFmt.format(new Date(submittedAt))}` : ''}. Atualize quando quiser — seus matches são recalculados na hora.`
            : 'Uns 5 minutos sobre o que você busca, como gosta de conversar e quando pode ser atendido.'}
        </span>
      </span>
      <span className="disclosure__action">
        {open ? 'Fechar' : answered ? 'Ver e editar' : 'Responder'}
        <Icon name="chevron-right" size={16} strokeWidth={2.2} className="disclosure__chevron" />
      </span>
    </button>
    {open && (
      <div id="meu-questionario" className="disclosure__body">
        <QuestionnaireForm className="questionnaire--embedded" onSubmitted={onSubmitted} />
      </div>
    )}
  </section>
);

export const MatchesPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<MatchResponse | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionnaireOpen, setQuestionnaireOpen] = useState(!user?.hasTriage || params.has('questionario'));
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState<Sort>('score');
  const [query, setQuery] = useState('');
  const [booking, setBooking] = useState<BookablePsychologist | null>(null);
  const [explaining, setExplaining] = useState<MatchItem | null>(null);
  const [riskResult, setRiskResult] = useState<Safety | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    if (!user?.hasTriage) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([api.get<MatchResponse>('/matches'), api.get<{ submittedAt: string } | null>('/triage/me')])
      .then(([m, me]) => {
        setData(m.data);
        setSubmittedAt(me.data?.submittedAt ?? null);
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Não foi possível carregar seus matches.')))
      .finally(() => setLoading(false));
  }, [user?.hasTriage, toast]);

  useEffect(load, [load]);

  const toggleQuestionnaire = () => {
    setQuestionnaireOpen((o) => !o);
    if (params.has('questionario')) setParams({}, { replace: true });
  };

  const onSubmitted = (safety: Safety) => {
    setQuestionnaireOpen(false);
    setShowAll(false);
    setRiskResult(safety.level === 'IMMEDIATE' || safety.level === 'ELEVATED' ? safety : null);
    load();
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  // Top 10 by compatibility; the rest are lower matches that can still be an option.
  const { top, rest } = useMemo(() => {
    const all = data?.results ?? [];
    const q = query.trim().toLowerCase();
    const matches = (m: MatchItem) =>
      !q ||
      `${m.psychologist.name} ${m.psychologist.specialty} ${m.psychologist.approaches.join(' ')} ${m.psychologist.neighborhood ?? ''}`
        .toLowerCase()
        .includes(q);
    const order = (list: MatchItem[]) =>
      sort === 'distance'
        ? [...list].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || b.score - a.score)
        : list;
    return { top: order(all.slice(0, TOP).filter(matches)), rest: order(all.slice(TOP).filter(matches)) };
  }, [data, query, sort]);

  const rankOf = useMemo(() => new Map((data?.results ?? []).map((m, i) => [m.psychologistId, i + 1])), [data]);

  const excludedTotal = Object.values(data?.excluded ?? {}).reduce<number>((a, b) => a + (b ?? 0), 0);
  const excludedWhy = Object.keys(data?.excluded ?? {})
    .map((k) => EXCLUSION_TEXT[k])
    .filter(Boolean)
    .join(', ');
  const needsAddress = !!data && !data.location;
  const hasDistances = !!data?.results.some((m) => m.distanceKm !== null);
  const safety = riskResult ?? (data && data.safety.level !== 'NONE' ? data.safety : null);

  const renderGrid = (list: MatchItem[], offset = 0) => (
    <div className="grid-cards">
      {list.map((m, i) => (
        <MatchCard
          key={m.psychologistId}
          match={m}
          rank={rankOf.get(m.psychologistId) ?? i + 1}
          index={i + offset}
          onBook={() => setBooking(toBookable(m))}
          onExplain={() => setExplaining(m)}
        />
      ))}
    </div>
  );

  return (
    <>
      <PageHeader
        eyebrow="Matches"
        title={user?.hasTriage ? `Seus matches, ${user ? firstName(user.name) : ''}` : 'Encontre quem combina com você'}
        subtitle={
          user?.hasTriage
            ? 'Profissionais ordenados pela compatibilidade com suas necessidades, seu jeito, sua rotina e a distância até você.'
            : 'Responda o questionário e mostramos os psicólogos mais compatíveis com você — e por quê.'
        }
      />

      {safety && <SafetyPanel safety={safety} compact={!riskResult} />}

      {!user?.hasTriage && !questionnaireOpen && (
        <section className="hero">
          <div className="stack gap-4">
            <h2 className="t-title-1 t-balance">Vamos encontrar alguém que combine com você</h2>
            <p className="t-callout t-secondary" style={{ maxWidth: 480 }}>
              Não é um diagnóstico — é só para entender suas preferências e calcular a compatibilidade com cada profissional.
            </p>
            <div>
              <Button size="lg" iconRight="arrow-right" onClick={() => setQuestionnaireOpen(true)}>
                Começar questionário
              </Button>
            </div>
          </div>
          <Mascot size={132} className="hero__art" />
        </section>
      )}

      <QuestionnairePanel
        answered={!!user?.hasTriage}
        open={questionnaireOpen}
        onToggle={toggleQuestionnaire}
        onSubmitted={onSubmitted}
        submittedAt={submittedAt}
      />

      {needsAddress && (
        <AddressCard
          title="Seu CEP"
          startEditing
          footer={
            data?.modality === 'online'
              ? 'Opcional para quem prefere online — mas ajuda a mostrar quem atende perto de você.'
              : 'Sem o CEP não conseguimos incluir atendimentos presenciais. Usamos só para calcular a distância; ninguém vê seu endereço.'
          }
          onSaved={load}
        />
      )}

      {user?.hasTriage && (
        <section className="section" ref={resultsRef} style={{ scrollMarginTop: 80 }}>
          <div className="section__header">
            <div className="stack gap-1">
              <h2 className="t-title-2">Seus 10 melhores matches</h2>
              {data?.location && (
                <p className="t-footnote t-secondary row gap-1">
                  <Icon name="map-pin" size={13} /> Distâncias a partir de {placeLabel(data.location)}
                </p>
              )}
            </div>
            <div className="row gap-3 wrap matches__tools">
              {hasDistances && (
                <Segmented<Sort>
                  label="Ordenar por"
                  value={sort}
                  onChange={setSort}
                  options={[
                    { value: 'score', label: 'Compatibilidade' },
                    { value: 'distance', label: 'Distância' },
                  ]}
                />
              )}
              <div className="search section__search">
                <Icon name="search" size={18} className="search__icon" />
                <input
                  className="search__input"
                  type="search"
                  placeholder="Nome, abordagem ou bairro"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Buscar profissionais"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid-cards">
              <MatchSkeleton />
              <MatchSkeleton />
              <MatchSkeleton />
            </div>
          ) : top.length + rest.length === 0 ? (
            <div className="card card--lg">
              <EmptyState
                title={query ? 'Nenhum resultado' : 'Ainda sem matches'}
                text={
                  query
                    ? `Não encontramos profissionais para “${query}”.`
                    : 'Nenhum profissional atende hoje ao formato, agenda e público que você indicou. Ampliar sua disponibilidade ou aceitar atendimento online costuma ajudar.'
                }
                action={
                  !query && (
                    <Button variant="tinted" onClick={() => setQuestionnaireOpen(true)}>
                      Revisar respostas
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <>
              {top.length > 0 ? renderGrid(top) : <p className="t-callout t-secondary">Nenhum dos 10 primeiros corresponde à busca.</p>}

              {rest.length > 0 && (
                <div className="stack gap-4">
                  <button
                    type="button"
                    className="more-toggle"
                    onClick={() => setShowAll((s) => !s)}
                    aria-expanded={showAll}
                    aria-controls="outras-opcoes"
                  >
                    <span className="stack gap-1" style={{ textAlign: 'left' }}>
                      <span className="t-headline">
                        {showAll ? 'Ocultar outras opções' : `Ver mais ${rest.length} ${rest.length === 1 ? 'profissional' : 'profissionais'}`}
                      </span>
                      <span className="t-footnote t-secondary">Compatibilidade mais baixa, mas que também podem ser uma boa opção.</span>
                    </span>
                    <Icon name="chevron-right" size={18} strokeWidth={2.2} className={`more-toggle__chevron${showAll ? ' is-open' : ''}`} />
                  </button>
                  {showAll && (
                    <div id="outras-opcoes" className="stack gap-4">
                      <h3 className="t-title-3">Outras opções</h3>
                      {renderGrid(rest, 0)}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {data && (
            <div className="stack gap-2">
              {excludedTotal > 0 && (
                <p className="t-footnote t-secondary row gap-2" style={{ alignItems: 'flex-start' }}>
                  <Icon name="sliders" size={14} />
                  <span>
                    {excludedTotal} {excludedTotal === 1 ? 'profissional não aparece' : 'profissionais não aparecem'} por
                    incompatibilidade de {excludedWhy}.{' '}
                    <button type="button" className="link" onClick={() => setQuestionnaireOpen(true)}>
                      Revisar respostas
                    </button>
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
