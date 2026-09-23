import React from 'react';
import { Wordmark } from './AppShell';
import { Icon, IconName } from './Icon';
import { Mascot } from './ui';

const FEATURES: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'sparkles', title: 'Match pelo seu jeito', text: 'Consideramos estilo de atendimento, objetivos e rotina.' },
  { icon: 'shield', title: 'Seus dados protegidos', text: 'Sessão segura e informações de saúde tratadas com cuidado.' },
  { icon: 'calendar', title: 'Agendamento simples', text: 'Escolha dia e horário em poucos toques.' },
];

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="auth">
    <section className="auth__brand">
      <div className="auth__logo">
        <img src="/images/emblema.png" alt="" />
        <span style={{ color: 'var(--label)' }}>
          <Wordmark />
        </span>
      </div>

      <div className="auth__pitch">
        <Mascot className="auth__mascot" size={96} />
        <h1 className="auth__headline">
          Terapia que <em>combina</em> com você.
        </h1>
        <p className="auth__lede">
          Responda algumas perguntas e encontre psicólogos com o estilo de atendimento que faz sentido para você.
        </p>
        <ul className="auth__features" aria-label="Por que HopeMind">
          {FEATURES.map((f) => (
            <li key={f.title} className="auth__feature">
              <span className="auth__feature-icon">
                <Icon name={f.icon} size={18} />
              </span>
              <div>
                <strong>{f.title}</strong>
                <span>{f.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="auth__credit">
        <img src="/images/safe-mind-live-logo.png" alt="SafeMindLive" />
        <span>
          Um projeto <strong>SafeMindLive</strong>
        </span>
      </div>
    </section>

    <section className="auth__panel">{children}</section>
  </div>
);
