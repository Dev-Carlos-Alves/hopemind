import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, IconName } from '../components/Icon';
import { Mascot } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { firstName, greeting } from '../services/format';

const STEPS: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: 'clipboard',
    title: 'Conte sobre você',
    text: 'Um questionário de uns 5 minutos: o que te traz aqui, como você gosta de conversar, sua rotina e se prefere online ou presencial.',
  },
  {
    icon: 'sparkles',
    title: 'Receba seus matches',
    text: 'Comparamos suas respostas com as dos psicólogos e mostramos os 10 mais compatíveis — com os motivos de cada indicação e a distância até o consultório.',
  },
  {
    icon: 'calendar',
    title: 'Agende a primeira sessão',
    text: 'Escolha um horário em comum direto na agenda do profissional. Se não sentir afinidade, é só voltar e tentar outro match.',
  },
];

const FACTORS: Array<{ label: string; weight: number; text: string }> = [
  { label: 'Demandas', weight: 25, text: 'Experiência declarada no que você quer trabalhar.' },
  { label: 'Estilo de condução', weight: 18, text: 'Mais estruturado ou mais livre, mais diretivo ou mais exploratório.' },
  { label: 'Formato e distância', weight: 15, text: 'Online, presencial e quão perto o consultório fica do seu CEP.' },
  { label: 'Experiência específica', weight: 14, text: 'Profundidade de prática em cada demanda.' },
  { label: 'Relação terapêutica', weight: 13, text: 'Acolhimento, franqueza e ritmo que você espera.' },
  { label: 'Agenda', weight: 10, text: 'Dias e períodos em comum.' },
  { label: 'Preferências pessoais', weight: 5, text: 'Só quando você declara alguma.' },
];

const PRINCIPLES: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: 'eye',
    title: 'Transparente',
    text: 'Toda indicação vem com o “porquê”. Nada de caixa-preta: você vê o peso de cada fator no cálculo.',
  },
  {
    icon: 'shield',
    title: 'Seguro por padrão',
    text: 'Respostas sobre risco nunca entram na nota. Elas acionam apoio imediato e só direcionam você a quem está preparado para acolher.',
  },
  {
    icon: 'lock',
    title: 'Privado',
    text: 'Seu endereço serve só para calcular distâncias. Psicólogos veem o bairro, e pacientes nunca veem a rua de ninguém.',
  },
  {
    icon: 'map-pin',
    title: 'Perto de você',
    text: 'Começamos pelo Recife: bairros reais, CEPs reais e distâncias calculadas para quem prefere o presencial.',
  },
];

const APPROACHES: Array<{ name: string; text: string }> = [
  { name: 'TCC', text: 'Foca em pensamentos e comportamentos do presente, com metas e exercícios práticos.' },
  { name: 'Psicanálise', text: 'Explora a história de vida e o que não é dito, no ritmo de cada pessoa.' },
  { name: 'Humanista', text: 'Parte da escuta acolhedora e da sua própria capacidade de crescer.' },
  { name: 'Sistêmica', text: 'Olha para você dentro das suas relações: família, casal, trabalho.' },
  { name: 'ACT e DBT', text: 'Aceitação, atenção plena e habilidades para regular emoções intensas.' },
  { name: 'EMDR', text: 'Abordagem estruturada para processar memórias traumáticas.' },
];

const HABITS: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'moon', title: 'Sono', text: 'Horários regulares ajudam o humor e a concentração mais do que parece.' },
  { icon: 'leaf', title: 'Pausas', text: 'Alguns minutos longe das telas ao longo do dia reduzem a sobrecarga.' },
  { icon: 'message', title: 'Rede de apoio', text: 'Conversar com alguém de confiança é um cuidado, não um incômodo.' },
];

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const isPsychologist = user?.userType === 'PSYCHOLOGIST';

  return (
    <div className="home">
      <section className="home-hero animate-rise">
        <div className="stack gap-4 home-hero__copy">
          <p className="page-header__eyebrow">
            {greeting()}
            {user ? `, ${firstName(user.name)}` : ''}
          </p>
          <h1 className="home-hero__title t-balance">Cuidar da mente começa com o encontro certo.</h1>
          <p className="home-hero__lede">
            O HopeMind aproxima pessoas de psicólogos com quem elas realmente combinam — pelo que precisam trabalhar, pelo jeito de
            conduzir a terapia, pela agenda e pela distância.
          </p>
          <div className="row gap-3 wrap">
            {isPsychologist ? (
              <>
                <Link to="/consultas" className="btn btn--filled btn--lg">
                  Ver minha agenda
                  <Icon name="arrow-right" size={18} />
                </Link>
                <Link to="/triagem" className="btn btn--gray btn--lg">
                  Perfil de atendimento
                </Link>
              </>
            ) : (
              <>
                <Link to="/matches" className="btn btn--filled btn--lg">
                  {user?.hasTriage ? 'Ver meus matches' : 'Encontrar meu psicólogo'}
                  <Icon name="arrow-right" size={18} />
                </Link>
                <a href="#como-funciona" className="btn btn--gray btn--lg">
                  Como funciona
                </a>
              </>
            )}
          </div>
        </div>
        <Mascot size={180} className="home-hero__art" />
      </section>

      <section className="home-section home-about">
        <div className="stack gap-3">
          <p className="page-header__eyebrow">Quem somos</p>
          <h2 className="t-title-1 t-balance">Uma plataforma de saúde mental feita para o primeiro passo.</h2>
        </div>
        <div className="stack gap-4 t-callout t-secondary">
          <p>
            Procurar terapia costuma começar com uma lista enorme de nomes e nenhuma pista de quem vai te entender. Muita gente desiste
            ali, ou troca de profissional várias vezes até encontrar alguém com quem se sinta à vontade.
          </p>
          <p>
            O HopeMind nasceu na <strong className="t-tint">SafeMindLive</strong> para encurtar esse caminho. A relação entre paciente e
            psicólogo — a aliança terapêutica — é um dos fatores mais associados a bons resultados na psicoterapia. Por isso nossa
            recomendação não olha só para a especialidade, mas para como vocês dois funcionam juntos.
          </p>
        </div>
      </section>

      <section className="home-section" id="como-funciona">
        <div className="stack gap-2">
          <p className="page-header__eyebrow">Como funciona</p>
          <h2 className="t-title-1">Três passos até a primeira sessão</h2>
        </div>
        <ol className="home-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card card--lg home-step">
              <span className="home-step__number">{i + 1}</span>
              <span className="home-icon">
                <Icon name={s.icon} size={22} />
              </span>
              <h3 className="t-title-3">{s.title}</h3>
              <p className="t-callout t-secondary">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-section home-split">
        <div className="stack gap-3">
          <p className="page-header__eyebrow">O que levamos em conta</p>
          <h2 className="t-title-1 t-balance">Compatibilidade que dá para explicar</h2>
          <p className="t-callout t-secondary">
            Primeiro saem os profissionais que não podem te atender — formato, agenda, faixa etária ou distância. Depois, cada fator vira
            uma nota de 0 a 100% e entra no cálculo com o seu peso.
          </p>
        </div>
        <ul className="card card--lg home-factors">
          {FACTORS.map((f) => (
            <li key={f.label} className="home-factor">
              <div className="row between gap-3">
                <span className="t-headline">{f.label}</span>
                <span className="t-footnote t-tint" style={{ fontWeight: 600 }}>
                  {f.weight}%
                </span>
              </div>
              <span className="meter__track" aria-hidden>
                <span className="meter__fill" style={{ width: `${f.weight * 4}%` }} />
              </span>
              <span className="t-footnote t-secondary">{f.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-section">
        <div className="stack gap-2">
          <p className="page-header__eyebrow">Nossos princípios</p>
          <h2 className="t-title-1">Tecnologia a serviço do cuidado</h2>
        </div>
        <div className="home-grid">
          {PRINCIPLES.map((p) => (
            <article key={p.title} className="card home-card">
              <span className="home-icon">
                <Icon name={p.icon} size={22} />
              </span>
              <h3 className="t-headline">{p.title}</h3>
              <p className="t-subhead t-secondary">{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="stack gap-2">
          <p className="page-header__eyebrow">Abordagens</p>
          <h2 className="t-title-1">Existem vários jeitos de fazer terapia</h2>
          <p className="t-callout t-secondary" style={{ maxWidth: 640 }}>
            Você não precisa saber qual é a sua — o questionário pergunta como você prefere ser atendido e a gente traduz isso. Mas, se
            tiver curiosidade:
          </p>
        </div>
        <dl className="home-grid home-grid--3">
          {APPROACHES.map((a) => (
            <div key={a.name} className="home-approach">
              <dt className="t-headline">{a.name}</dt>
              <dd className="t-subhead t-secondary">{a.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="home-section">
        <div className="stack gap-2">
          <p className="page-header__eyebrow">No dia a dia</p>
          <h2 className="t-title-1">Pequenos cuidados também contam</h2>
        </div>
        <div className="home-grid home-grid--3">
          {HABITS.map((h) => (
            <article key={h.title} className="card home-card">
              <span className="home-icon home-icon--sand">
                <Icon name={h.icon} size={22} />
              </span>
              <h3 className="t-headline">{h.title}</h3>
              <p className="t-subhead t-secondary">{h.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-help" aria-labelledby="ajuda-agora">
        <span className="home-help__icon">
          <Icon name="heart" size={26} />
        </span>
        <div className="stack gap-2 grow">
          <h2 id="ajuda-agora" className="t-title-2">
            Precisa de ajuda agora?
          </h2>
          <p className="t-callout">
            O HopeMind não é um serviço de emergência. Se você está em sofrimento intenso ou pensando em se machucar, fale agora com o{' '}
            <strong>CVV</strong> pelo <a href="tel:188">188</a> (24 horas, gratuito e sigiloso) ou ligue para o <strong>SAMU</strong> no{' '}
            <a href="tel:192">192</a>.
          </p>
        </div>
      </section>

      <p className="t-footnote t-tertiary t-center">HopeMind · um projeto SafeMindLive · As recomendações não substituem avaliação profissional.</p>
    </div>
  );
};
