import React from 'react';
import { currency } from '../services/format';
import { formatKm, placeLabel } from '../services/address';
import { Icon } from './Icon';
import { Avatar, Button, Sheet } from './ui';

/*
 * Perfis detalhados (mesmos do app): clicar na foto ou no nome de alguém abre tudo o que a pessoa
 * contou sobre si, para o paciente escolher com mais segurança e o psicólogo conhecer quem agendou.
 */

export interface DetailedPsychologist {
  id: number;
  name: string;
  crp: string;
  specialty: string;
  approaches: string[];
  biography: string | null;
  sessionFee: string | number;
  contactLink?: string | null;
  modalities: string[];
  neighborhood: string | null;
  therapeuticApproach?: string | null;
  experience?: string | null;
  audiences?: string[];
  demands?: string[];
  experiencedWith?: string[];
}

/** Perfil do paciente enviado ao psicólogo da sessão (GET /api/sessoes). */
export interface PatientCard {
  nome: string;
  idade: number | null;
  genero: string | null;
  sobre: string | null;
  prioridades: string[];
  outrosTemas: string[];
  modalidade: string | null;
  bairro: string | null;
  cidade: string | null;
}

/** Perfil do psicólogo enviado ao paciente da sessão (GET /api/sessoes). */
export interface PsychologistCard {
  id: number;
  nome: string;
  crp: string;
  especialidade: string;
  abordagem: string | null;
  biografia: string | null;
  valorSessao: string | number | null;
  contato: string | null;
  bairro: string | null;
  cidade: string | null;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="stack gap-1">
    <h3 className="t-caption t-secondary profile-sheet__label">{title}</h3>
    {children}
  </section>
);

const Chips: React.FC<{ title: string; items?: string[] }> = ({ title, items }) =>
  items && items.length > 0 ? (
    <Section title={title}>
      <div className="row gap-2 wrap">
        {items.map((i) => (
          <span key={i} className="pill">
            {i}
          </span>
        ))}
      </div>
    </Section>
  ) : null;

const Header: React.FC<{ name: string; lines: string[] }> = ({ name, lines }) => (
  <div className="row gap-4 profile-sheet__header">
    <Avatar name={name} size="xl" />
    <div className="stack gap-1">
      <h2 className="t-title-2">{name}</h2>
      {lines.map((l) => (
        <p key={l} className="t-subhead t-secondary">
          {l}
        </p>
      ))}
    </div>
  </div>
);

const ContactLink: React.FC<{ href: string; name: string }> = ({ href, name }) => (
  <a className="btn btn--gray btn--lg grow" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Falar com ${name}`}>
    <Icon name="message" size={18} />
    Contato
  </a>
);

export const PsychologistProfileSheet: React.FC<{
  psychologist: DetailedPsychologist | null;
  distanceKm: number | null;
  onBook: () => void;
  onClose: () => void;
}> = ({ psychologist: p, distanceKm, onBook, onClose }) => (
  <Sheet
    open={!!p}
    onClose={onClose}
    title="Perfil do profissional"
    footer={
      p && (
        <div className="row gap-3">
          {p.contactLink && <ContactLink href={p.contactLink} name={p.name} />}
          <Button
            size="lg"
            icon="calendar"
            className="grow"
            onClick={() => {
              onClose();
              onBook();
            }}
          >
            Ver horários
          </Button>
        </div>
      )
    }
  >
    {p && (
      <div className="stack gap-6 profile-sheet">
        <Header name={p.name} lines={[p.specialty, p.crp]} />
        <div className="row gap-2 wrap">
          {p.modalities.includes('online') && (
            <span className="pill pill--peach">
              <Icon name="video" size={14} /> Online
            </span>
          )}
          {p.modalities.includes('presencial') && p.neighborhood && (
            <span className="pill pill--peach">
              <Icon name="map-pin" size={14} /> {p.neighborhood}
              {distanceKm != null && ` · ${formatKm(distanceKm)}`}
            </span>
          )}
        </div>
        <Section title="Sobre">
          <p className="t-body">{p.biography || 'Este profissional ainda não escreveu uma apresentação.'}</p>
        </Section>
        {p.approaches.length === 0 && p.therapeuticApproach && (
          <Section title="Abordagem">
            <p className="t-body">{p.therapeuticApproach}</p>
          </Section>
        )}
        <Chips title="Abordagens" items={p.approaches} />
        {p.experience && (
          <Section title="Tempo de prática">
            <p className="t-body">{p.experience}</p>
          </Section>
        )}
        <Chips title="Atende" items={p.audiences} />
        <Chips title="Tem experiência com" items={p.demands} />
        <Chips title="Perfis de paciente com quem tem mais experiência" items={p.experiencedWith} />
        <Section title="Valor da sessão">
          <p className="t-body">{currency.format(Number(p.sessionFee || 0))} por sessão</p>
        </Section>
      </div>
    )}
  </Sheet>
);

export const PsychologistCardSheet: React.FC<{ psychologist: PsychologistCard | null; onClose: () => void }> = ({ psychologist: p, onClose }) => (
  <Sheet
    open={!!p}
    onClose={onClose}
    title="Perfil do profissional"
    footer={p?.contato ? <div className="row">{<ContactLink href={p.contato} name={p.nome} />}</div> : undefined}
  >
    {p && (
      <div className="stack gap-6 profile-sheet">
        <Header name={p.nome} lines={[p.especialidade, p.crp]} />
        <Section title="Sobre">
          <p className="t-body">{p.biografia || 'Este profissional ainda não escreveu uma apresentação.'}</p>
        </Section>
        {p.abordagem && (
          <Section title="Abordagem">
            <p className="t-body">{p.abordagem}</p>
          </Section>
        )}
        {placeLabel({ neighborhood: p.bairro, city: p.cidade }) && (
          <Section title="Consultório">
            <p className="t-body">{placeLabel({ neighborhood: p.bairro, city: p.cidade })}</p>
          </Section>
        )}
        <Section title="Valor da sessão">
          <p className="t-body">{currency.format(Number(p.valorSessao || 0))} por sessão</p>
        </Section>
      </div>
    )}
  </Sheet>
);

export const PatientProfileSheet: React.FC<{ patient: PatientCard | null; onClose: () => void }> = ({ patient: p, onClose }) => {
  const details = p ? [p.idade != null ? `${p.idade} anos` : null, p.genero && p.genero !== 'Não informado' ? p.genero : null].filter(Boolean).join(' · ') : '';
  return (
    <Sheet open={!!p} onClose={onClose} title="Perfil do paciente">
      {p && (
        <div className="stack gap-6 profile-sheet">
          <Header name={p.nome} lines={['Paciente', ...(details ? [details] : [])]} />
          <Section title="Sobre mim">
            <p className="t-body">{p.sobre?.trim() || 'O paciente não escreveu uma descrição no cadastro.'}</p>
          </Section>
          <Chips title="O que mais quer trabalhar" items={p.prioridades} />
          <Chips title="Outros temas de interesse" items={p.outrosTemas} />
          {p.modalidade && (
            <Section title="Prefere atendimento">
              <p className="t-body">{p.modalidade}</p>
            </Section>
          )}
          {placeLabel({ neighborhood: p.bairro, city: p.cidade }) && (
            <Section title="Região">
              <p className="t-body">{placeLabel({ neighborhood: p.bairro, city: p.cidade })}</p>
            </Section>
          )}
        </div>
      )}
    </Sheet>
  );
};
