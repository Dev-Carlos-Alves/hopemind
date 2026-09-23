import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, IconName } from '../components/Icon';
import { Avatar, PageHeader, Segmented, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { currency, maskPhone } from '../services/format';
import { getThemePreference, setThemePreference, ThemePreference } from '../services/theme';

interface Profile {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  userType: 'PATIENT' | 'PSYCHOLOGIST' | 'ADMIN';
  psychologist: {
    crp: string;
    specialty: string;
    therapeuticApproach: string;
    sessionFee: string | number;
  } | null;
}

const Row: React.FC<{ icon: IconName; color: string; label: string; value?: React.ReactNode }> = ({ icon, color, label, value }) => (
  <div className="list-row" style={{ '--row-inset': '58px' } as React.CSSProperties}>
    <span className="list-row__icon" style={{ background: color }}>
      <Icon name={icon} size={17} strokeWidth={2} />
    </span>
    <span className="list-row__label">{label}</span>
    <span className="list-row__value">{value ?? '—'}</span>
  </div>
);

const birthFmt = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference);

  useEffect(() => {
    api.get<Profile>('/auth/me').then((res) => setProfile(res.data)).catch(() => undefined);
  }, []);

  const changeTheme = (t: ThemePreference) => {
    setTheme(t);
    setThemePreference(t);
  };

  const isPsychologist = user?.userType === 'PSYCHOLOGIST';

  return (
    <>
      <PageHeader title="Ajustes" />

      <div className="settings">
        <section className="card card--lg settings__profile">
          {user && <Avatar name={user.name} size="xl" />}
          <div className="stack gap-1" style={{ alignItems: 'center' }}>
            <h2 className="t-title-2">{user?.name}</h2>
            <p className="t-callout t-secondary">{user?.email}</p>
            <span className={`pill ${isPsychologist ? 'pill--sand' : 'pill--tint'}`} style={{ marginTop: 6 }}>
              {isPsychologist ? 'Psicólogo(a)' : 'Paciente'}
            </span>
          </div>
        </section>

        <section className="group">
          <h3 className="group__header">Dados pessoais</h3>
          <div className="group__body">
            {profile ? (
              <>
                <Row icon="user" color="#3a7733" label="Nome" value={profile.name} />
                <Row icon="mail" color="#4a64b0" label="E-mail" value={profile.email} />
                <Row icon="phone" color="#2f7a64" label="Celular" value={profile.phone ? maskPhone(profile.phone) : undefined} />
                <Row
                  icon="calendar"
                  color="#c0573a"
                  label="Nascimento"
                  value={profile.birthDate ? birthFmt.format(new Date(profile.birthDate)) : undefined}
                />
              </>
            ) : (
              [0, 1, 2, 3].map((i) => (
                <div key={i} className="list-row">
                  <Skeleton width={30} height={30} radius={8} />
                  <Skeleton width="30%" height={14} />
                </div>
              ))
            )}
          </div>
        </section>

        {isPsychologist && profile?.psychologist && (
          <section className="group">
            <h3 className="group__header">Registro profissional</h3>
            <div className="group__body">
              <Row icon="badge" color="#9a7428" label="CRP" value={profile.psychologist.crp} />
              <Row icon="brain" color="#3a7733" label="Especialidade" value={profile.psychologist.specialty} />
              <Row icon="credit-card" color="#c47a2c" label="Valor da sessão" value={currency.format(Number(profile.psychologist.sessionFee))} />
            </div>
          </section>
        )}

        <section className="group">
          <h3 className="group__header">Aparência</h3>
          <div className="group__body" style={{ padding: 12 }}>
            <Segmented<ThemePreference>
              label="Aparência"
              value={theme}
              onChange={changeTheme}
              options={[
                { value: 'auto', label: 'Automático' },
                { value: 'light', label: 'Claro' },
                { value: 'dark', label: 'Escuro' },
              ]}
            />
          </div>
          <p className="group__footer">“Automático” acompanha a aparência do seu sistema.</p>
        </section>

        <section className="group">
          <h3 className="group__header">{isPsychologist ? 'Atendimento' : 'Seu perfil'}</h3>
          <div className="group__body">
            <Link to="/triagem" className="list-row list-row--button" style={{ '--row-inset': '58px' } as React.CSSProperties}>
              <span className="list-row__icon" style={{ background: '#3a7733' }}>
                <Icon name="clipboard" size={17} strokeWidth={2} />
              </span>
              <span className="list-row__label">{isPsychologist ? 'Perfil de atendimento' : 'Refazer questionário'}</span>
              <Icon name="chevron-right" size={18} className="list-row__chevron" />
            </Link>
          </div>
        </section>

        <section className="group">
          <div className="group__body">
            <button type="button" className="list-row list-row--button t-danger" onClick={logout} style={{ justifyContent: 'center', fontWeight: 600 }}>
              Sair da conta
            </button>
          </div>
        </section>

        <p className="t-footnote t-tertiary t-center">HopeMind · um projeto SafeMindLive</p>
      </div>
    </>
  );
};
