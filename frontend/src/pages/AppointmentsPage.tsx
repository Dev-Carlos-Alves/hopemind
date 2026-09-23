import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, EmptyState, PageHeader, Segmented, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, getErrorMessage } from '../services/api';

interface AppointmentItem {
  id: number;
  dataHora: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  psicologoNome: string;
  pacienteNome: string;
  especialidade: string;
  crp: string;
}

const STATUS: Record<AppointmentItem['status'], { label: string; tone: string }> = {
  SCHEDULED: { label: 'Agendada', tone: 'pill--tint' },
  COMPLETED: { label: 'Concluída', tone: '' },
  CANCELLED: { label: 'Cancelada', tone: 'pill--danger' },
};

const dayHeader = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const dayHeaderWithYear = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

function dayLabel(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  const label = (date.getFullYear() === today.getFullYear() ? dayHeader : dayHeaderWithYear).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

type Tab = 'upcoming' | 'past';

export const AppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isPsychologist = user?.userType === 'PSYCHOLOGIST';
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('upcoming');

  useEffect(() => {
    api
      .get<AppointmentItem[]>('/sessoes')
      .then((res) => setItems(res.data))
      .catch((err) => toast.error(getErrorMessage(err, 'Não foi possível carregar suas sessões.')))
      .finally(() => setLoading(false));
  }, [toast]);

  const groups = useMemo(() => {
    const now = Date.now();
    const list = items
      .filter((i) => (tab === 'upcoming' ? new Date(i.dataHora).getTime() >= now : new Date(i.dataHora).getTime() < now))
      .sort((a, b) =>
        tab === 'upcoming'
          ? new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
          : new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
      );
    const map = new Map<string, AppointmentItem[]>();
    for (const item of list) {
      const key = dayLabel(new Date(item.dataHora));
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return Array.from(map.entries());
  }, [items, tab]);

  const upcomingCount = items.filter((i) => new Date(i.dataHora).getTime() >= Date.now() && i.status === 'SCHEDULED').length;

  return (
    <>
      <PageHeader
        eyebrow={isPsychologist ? 'Agenda' : 'Sessões'}
        title={isPsychologist ? 'Sua agenda' : 'Minhas sessões'}
        subtitle={
          loading
            ? ' '
            : upcomingCount === 0
              ? 'Nenhuma sessão marcada por enquanto.'
              : `${upcomingCount} ${upcomingCount === 1 ? 'sessão marcada' : 'sessões marcadas'} daqui pra frente.`
        }
        actions={
          <Segmented<Tab>
            label="Filtrar sessões"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'upcoming', label: 'Próximas' },
              { value: 'past', label: 'Anteriores' },
            ]}
            className="appointments__tabs"
          />
        }
      />

      {loading ? (
        <div className="group">
          <Skeleton width={120} height={14} />
          <div className="group__body">
            {[0, 1, 2].map((i) => (
              <div key={i} className="list-row">
                <Skeleton width={56} height={28} />
                <Skeleton width={40} height={40} radius={20} />
                <div className="grow stack gap-2">
                  <Skeleton width="40%" height={14} />
                  <Skeleton width="25%" height={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : groups.length === 0 ? (
        <div className="card card--lg">
          <EmptyState
            title={tab === 'upcoming' ? 'Nada marcado ainda' : 'Sem histórico'}
            text={
              tab === 'upcoming'
                ? isPsychologist
                  ? 'Quando um paciente agendar uma sessão com você, ela aparece aqui.'
                  : 'Escolha um profissional recomendado e marque sua primeira conversa.'
                : 'Suas sessões anteriores aparecerão aqui.'
            }
            action={
              tab === 'upcoming' &&
              !isPsychologist && (
                <Link to="/dashboard" className="btn btn--filled">
                  Ver recomendações
                </Link>
              )
            }
          />
        </div>
      ) : (
        groups.map(([label, list]) => (
          <section key={label} className="group">
            <h2 className="group__header">{label}</h2>
            <div className="group__body">
              {list.map((item) => {
                const other = isPsychologist ? item.pacienteNome : item.psicologoNome;
                const status = STATUS[item.status] ?? STATUS.SCHEDULED;
                return (
                  <div key={item.id} className="list-row appointment-row" style={{ '--row-inset': '92px' } as React.CSSProperties}>
                    <div className="appointment-row__time">{timeFmt.format(new Date(item.dataHora))}</div>
                    <Avatar name={other} />
                    <div className="grow">
                      <p className="t-headline">{other}</p>
                      <p className="t-footnote t-secondary">
                        {isPsychologist ? 'Paciente' : `${item.especialidade} · ${item.crp}`}
                      </p>
                    </div>
                    <span className={`pill ${status.tone}`}>{status.label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </>
  );
};
