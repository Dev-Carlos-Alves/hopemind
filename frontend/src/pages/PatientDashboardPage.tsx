import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookablePsychologist, BookingSheet } from '../components/BookingSheet';
import { Icon } from '../components/Icon';
import { Avatar, Button, EmptyState, Mascot, PageHeader, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, getErrorMessage } from '../services/api';
import { currency, firstName, greeting } from '../services/format';

interface PsychologistMatch {
  idPsicologo: number;
  nome: string;
  especialidade: string;
  crp: string;
  valorSessao: number | string;
  biografia: string | null;
  matchPercentage: number;
}

function compatibility(percent: number) {
  if (percent >= 70) return { label: 'Alta compatibilidade', tone: 'pill--tint' };
  if (percent >= 40) return { label: 'Boa compatibilidade', tone: 'pill--sand' };
  return { label: 'Compatibilidade parcial', tone: '' };
}

const MatchCard: React.FC<{ match: PsychologistMatch; onBook: () => void; index: number }> = ({ match, onBook, index }) => {
  const c = compatibility(match.matchPercentage);
  return (
    <article className="card card--lg match-card animate-rise" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="row gap-4" style={{ alignItems: 'flex-start' }}>
        <Avatar name={match.nome} size="lg" />
        <div className="grow">
          <h3 className="t-headline">{match.nome}</h3>
          <p className="t-footnote t-secondary">{match.crp}</p>
          <div className="row gap-2 wrap" style={{ marginTop: 8 }}>
            <span className={`pill pill--dot ${c.tone}`}>{c.label}</span>
          </div>
        </div>
      </div>

      <div className="stack gap-2">
        <p className="t-subhead" style={{ fontWeight: 600 }}>
          {match.especialidade}
        </p>
        <p className="t-subhead t-secondary match-card__bio">
          {match.biografia || 'Atendimento clínico para adultos e jovens adultos.'}
        </p>
      </div>

      <div className="match-card__footer">
        <div>
          <p className="t-headline">{currency.format(Number(match.valorSessao || 0))}</p>
          <p className="t-caption t-secondary">por sessão</p>
        </div>
        <Button variant="tinted" icon="calendar" onClick={onBook}>
          Ver horários
        </Button>
      </div>
    </article>
  );
};

const MatchSkeleton: React.FC = () => (
  <div className="card card--lg match-card" aria-hidden>
    <div className="row gap-4">
      <Skeleton width={64} height={64} radius={32} />
      <div className="grow stack gap-2">
        <Skeleton width="60%" height={18} />
        <Skeleton width="35%" height={12} />
      </div>
    </div>
    <Skeleton height={12} />
    <Skeleton width="80%" height={12} />
    <div className="match-card__footer">
      <Skeleton width={90} height={22} />
      <Skeleton width={130} height={44} radius={22} />
    </div>
  </div>
);

export const PatientDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [matches, setMatches] = useState<PsychologistMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<BookablePsychologist | null>(null);

  useEffect(() => {
    if (!user?.patientId || !user.hasTriage) {
      setLoading(false);
      return;
    }
    api
      .get<PsychologistMatch[]>(`/matches/${user.patientId}`)
      .then((res) => setMatches(res.data))
      .catch((err) => toast.error(getErrorMessage(err, 'Não foi possível carregar suas recomendações.')))
      .finally(() => setLoading(false));
  }, [user, toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return matches;
    return matches.filter((m) => `${m.nome} ${m.especialidade}`.toLowerCase().includes(q));
  }, [matches, query]);

  const name = user ? firstName(user.name) : '';

  return (
    <>
      <PageHeader
        eyebrow="Para você"
        title={`${greeting()}, ${name}`}
        subtitle={
          user?.hasTriage
            ? 'Estes são os profissionais cujo estilo de atendimento mais combina com o que você nos contou.'
            : 'Para recomendarmos profissionais, precisamos conhecer um pouco do que você procura.'
        }
      />

      {!user?.hasTriage ? (
        <section className="hero">
          <div className="stack gap-4">
            <h2 className="t-title-1 t-balance">Vamos encontrar alguém que combine com você</h2>
            <p className="t-callout t-secondary" style={{ maxWidth: 480 }}>
              São perguntas rápidas sobre o que você busca, como gosta de conversar e quando pode ser atendido.
              Não é um diagnóstico — é só para entender suas preferências.
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
                placeholder="Buscar por nome ou especialidade"
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
          ) : filtered.length === 0 ? (
            <div className="card card--lg">
              <EmptyState
                title={query ? 'Nenhum resultado' : 'Ainda sem recomendações'}
                text={
                  query
                    ? `Não encontramos profissionais para “${query}”.`
                    : 'Ainda não há profissionais compatíveis com o seu perfil. Tente revisar suas respostas.'
                }
                action={
                  !query && (
                    <Link to="/triagem" className="btn btn--tinted">
                      Revisar questionário
                    </Link>
                  )
                }
              />
            </div>
          ) : (
            <div className="grid-cards">
              {filtered.map((m, i) => (
                <MatchCard
                  key={m.idPsicologo}
                  match={m}
                  index={i}
                  onBook={() =>
                    setSelected({
                      id: m.idPsicologo,
                      name: m.nome,
                      crp: m.crp,
                      specialty: m.especialidade,
                      biography: m.biografia,
                      sessionFee: m.valorSessao,
                    })
                  }
                />
              ))}
            </div>
          )}

          <p className="t-footnote t-secondary row gap-2">
            <Icon name="info" size={14} />
            A compatibilidade é uma estimativa baseada nas suas respostas, não uma indicação clínica.
          </p>
        </section>
      )}

      <BookingSheet key={selected?.id ?? 'none'} psychologist={selected} onClose={() => setSelected(null)} />
    </>
  );
};
