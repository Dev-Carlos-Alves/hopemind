import React, { useMemo, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { api, getErrorMessage } from '../services/api';
import { currency } from '../services/format';
import { Icon } from './Icon';
import { Avatar, Button, Sheet } from './ui';

export interface BookablePsychologist {
  id: number;
  name: string;
  crp: string;
  specialty: string;
  biography?: string | null;
  sessionFee?: number | string | null;
}

const HOURS = [8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19];
const DAYS_AHEAD = 14;

const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
const monthShort = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
const shortDay = (d: Date) =>
  `${weekday.format(d).replace('.', '')}, ${d.getDate()} ${monthShort.format(d).replace('.', '')}`;
const longDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

function upcomingDays() {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.length < DAYS_AHEAD) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() !== 0) days.push(new Date(cursor));
  }
  return days;
}

export const BookingSheet: React.FC<{
  psychologist: BookablePsychologist | null;
  onClose: () => void;
  onBooked?: () => void;
}> = ({ psychologist, onClose, onBooked }) => {
  const days = useMemo(upcomingDays, []);
  const [day, setDay] = useState<Date>(days[0]);
  const [hour, setHour] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const slot = hour === null ? null : new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour);

  const confirm = async () => {
    if (!psychologist || !slot) return;
    setSaving(true);
    try {
      await api.post('/sessoes/agendar', { idPsicologo: psychologist.id, dataHora: slot.toISOString() });
      toast.success(`Sessão marcada para ${longDate.format(slot)}, às ${hour}h.`);
      setHour(null);
      onBooked?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Não foi possível agendar a sessão.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={!!psychologist}
      onClose={onClose}
      title="Agendar sessão"
      footer={
        <Button size="lg" block onClick={confirm} loading={saving} disabled={!slot}>
          {slot ? `Confirmar · ${shortDay(slot)} às ${hour}h` : 'Escolha um horário'}
        </Button>
      }
    >
      {psychologist && (
        <div className="stack gap-6">
          <div className="row gap-4">
            <Avatar name={psychologist.name} size="lg" />
            <div className="grow">
              <p className="t-headline">{psychologist.name}</p>
              <p className="t-subhead t-secondary">
                {psychologist.specialty} · {psychologist.crp}
              </p>
              {psychologist.sessionFee != null && (
                <p className="t-subhead" style={{ marginTop: 2 }}>
                  {currency.format(Number(psychologist.sessionFee))} <span className="t-secondary">por sessão</span>
                </p>
              )}
            </div>
          </div>

          {psychologist.biography && <p className="t-callout t-secondary">{psychologist.biography}</p>}

          <div className="stack gap-3">
            <p className="t-headline">Dia</p>
            <div className="day-strip" role="radiogroup" aria-label="Dia da sessão">
              {days.map((d) => {
                const active = d.getTime() === day.getTime();
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className="day-chip"
                    onClick={() => {
                      setDay(d);
                      setHour(null);
                    }}
                  >
                    <span className="day-chip__weekday">{weekday.format(d).replace('.', '')}</span>
                    <span className="day-chip__day">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="stack gap-3">
            <p className="t-headline">Horário</p>
            <div className="slot-grid" role="radiogroup" aria-label="Horário da sessão">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  role="radio"
                  aria-checked={hour === h}
                  className="chip"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setHour(h)}
                >
                  {String(h).padStart(2, '0')}:00
                </button>
              ))}
            </div>
            <p className="t-footnote t-secondary row gap-2">
              <Icon name="clock" size={14} /> Sessões de 50 minutos. O profissional confirma a disponibilidade.
            </p>
          </div>
        </div>
      )}
    </Sheet>
  );
};
