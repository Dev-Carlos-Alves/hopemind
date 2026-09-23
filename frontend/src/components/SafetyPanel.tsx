import React from 'react';
import { Safety } from '../services/questionnaire';
import { Icon } from './Icon';

const COPY: Record<Exclude<Safety['level'], 'NONE'>, { title: string; text: string }> = {
  IMMEDIATE: {
    title: 'Você não precisa passar por isso sozinho(a)',
    text: 'Obrigado por nos contar. Como você indicou que pode estar em perigo agora, procure ajuda imediata em um dos canais abaixo. Eles atendem a qualquer hora.',
  },
  ELEVATED: {
    title: 'Obrigado por confiar isso a nós',
    text: 'O que você está sentindo importa. Os canais abaixo atendem 24 horas, de forma gratuita e sigilosa, sempre que você precisar conversar.',
  },
  WANTS_TALK: {
    title: 'Você pode falar sobre isso com um profissional',
    text: 'Conte na primeira sessão o que preferir. E, se em algum momento precisar, estes canais atendem 24 horas.',
  },
};

export const SafetyPanel: React.FC<{ safety: Safety; compact?: boolean; children?: React.ReactNode }> = ({ safety, compact, children }) => {
  if (safety.level === 'NONE') return null;
  const copy = COPY[safety.level];
  const urgent = safety.level === 'IMMEDIATE';

  return (
    <section className={`safety ${urgent ? 'safety--urgent' : ''} ${compact ? 'safety--compact' : ''}`} aria-live="polite">
      <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
        <span className="safety__icon">
          <Icon name="heart" size={20} />
        </span>
        <div className="stack gap-1">
          <h2 className={compact ? 't-headline' : 't-title-3'}>{copy.title}</h2>
          <p className="t-callout t-secondary">{copy.text}</p>
        </div>
      </div>

      <div className="group__body">
        {safety.resources.map((r) => {
          const content = (
            <>
              <span className="list-row__icon" style={{ background: r.href ? 'var(--tint)' : '#8e8e93' }}>
                <Icon name={r.href ? 'phone' : 'map-pin'} size={16} strokeWidth={2} />
              </span>
              <span className="list-row__label">
                <strong className="t-callout" style={{ display: 'block' }}>
                  {r.name}
                </strong>
                <span className="t-footnote t-secondary">{r.detail}</span>
              </span>
              {r.href && <Icon name="chevron-right" size={18} className="list-row__chevron" />}
            </>
          );
          return r.href ? (
            <a key={r.name} href={r.href} className="list-row list-row--button" style={{ '--row-inset': '58px' } as React.CSSProperties}>
              {content}
            </a>
          ) : (
            <div key={r.name} className="list-row" style={{ '--row-inset': '58px' } as React.CSSProperties}>
              {content}
            </div>
          );
        })}
      </div>
      {children}
    </section>
  );
};
