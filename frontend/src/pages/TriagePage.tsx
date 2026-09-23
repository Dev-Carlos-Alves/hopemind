import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { QuestionField } from '../components/QuestionField';
import { SafetyPanel } from '../components/SafetyPanel';
import { Button, EmptyState, PageHeader, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, getErrorMessage } from '../services/api';
import { Answers, isAnswered, isVisible, Questionnaire, Safety, visibleAnswers } from '../services/questionnaire';

export const TriagePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const isPsychologist = user?.userType === 'PSYCHOLOGIST';

  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Safety | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.get<Questionnaire>('/triage/questionnaire'),
      api.get<{ answers: Answers } | null>('/triage/me'),
    ])
      .then(([q, mine]) => {
        setQuestionnaire(q.data);
        if (mine.data?.answers) setAnswers(mine.data.answers);
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Não foi possível carregar o questionário.')))
      .finally(() => setLoading(false));
  }, [toast]);

  const sections = questionnaire?.sections ?? [];
  const section = sections[step];
  const isLast = step === sections.length - 1;

  const optionLabelsByCode = useMemo(() => {
    const byCode: Record<string, Record<string, string>> = {};
    for (const q of sections.flatMap((s) => s.questions)) {
      byCode[q.code] = Object.fromEntries((q.options ?? []).map((o) => [o.value, o.label]));
    }
    return byCode;
  }, [sections]);

  const setAnswer = (code: string, value: Answers[string]) => {
    setAnswers((a) => ({ ...a, [code]: value }));
    setErrors((e) => {
      if (!e[code]) return e;
      const { [code]: _removed, ...rest } = e;
      return rest;
    });
  };

  const goTo = (next: number) => {
    setStep(next);
    setErrors({});
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const validateSection = () => {
    const found: Record<string, string> = {};
    for (const q of section.questions) {
      if (!isVisible(q, answers) || !q.required) continue;
      if (!isAnswered(q, answers[q.code], answers)) {
        found[q.code] = q.type === 'matrix' ? 'Informe o nível de cada demanda.' : 'Responda esta pergunta para continuar.';
      }
    }
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) document.querySelector(`[data-code="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return !first;
  };

  const submit = async () => {
    if (!questionnaire) return;
    setSubmitting(true);
    try {
      const res = await api.post<{ safety: Safety }>('/triage/submissions', { answers: visibleAnswers(questionnaire, answers) });
      await refreshProfile();
      const level = res.data.safety.level;
      if (level === 'IMMEDIATE' || level === 'ELEVATED') {
        setResult(res.data.safety);
        requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        return;
      }
      toast.success(isPsychologist ? 'Perfil de atendimento salvo.' : 'Pronto! Suas recomendações foram atualizadas.');
      navigate(isPsychologist ? '/consultas' : '/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Não foi possível enviar suas respostas.'));
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (!validateSection()) return;
    if (isLast) submit();
    else goTo(step + 1);
  };

  if (result) {
    return (
      <>
        <div ref={topRef} />
        <PageHeader eyebrow="Questionário concluído" title="Antes de continuar" />
        <SafetyPanel safety={result}>
          <div className="row gap-3 wrap">
            <Button size="lg" onClick={() => navigate('/dashboard')} iconRight="arrow-right">
              Ver profissionais recomendados
            </Button>
          </div>
        </SafetyPanel>
      </>
    );
  }

  return (
    <>
      <div ref={topRef} style={{ scrollMarginTop: 80 }} />
      <PageHeader
        eyebrow={isPsychologist ? 'Perfil de atendimento' : 'Questionário'}
        title={isPsychologist ? 'Como você atende' : 'Conte um pouco sobre você'}
        subtitle={
          isPsychologist
            ? 'Suas respostas são comparadas com as preferências dos pacientes para indicar você a quem mais combina com o seu estilo.'
            : 'Não é um diagnóstico — serve para entender suas preferências e encontrar quem combina com você.'
        }
      />

      <section className="card card--lg questionnaire">
        {loading ? (
          <div className="stack gap-4">
            <Skeleton height={4} />
            <Skeleton width="50%" height={26} />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={56} radius={12} />
            ))}
          </div>
        ) : !section ? (
          <EmptyState title="Questionário indisponível" text="Tente novamente em instantes." />
        ) : (
          <>
            <div className="stack gap-2">
              <div className="row between t-footnote t-secondary">
                <span>
                  Etapa {step + 1} de {sections.length}
                </span>
                <span>{section.title}</span>
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-label="Progresso do questionário"
                aria-valuenow={step + 1}
                aria-valuemin={1}
                aria-valuemax={sections.length}
              >
                <div className="progress__bar" style={{ width: `${((step + 1) / sections.length) * 100}%` }} />
              </div>
            </div>

            <div className="questionnaire__step" key={section.id}>
              <div className="stack gap-2">
                <h2 className="t-title-1 t-balance">{section.title}</h2>
                {section.subtitle && <p className="t-callout t-secondary">{section.subtitle}</p>}
              </div>

              {section.id === 'seguranca' && !isPsychologist && (
                <div className="banner banner--tint">
                  <Icon name="heart" size={18} />
                  <span>
                    Se você estiver passando por um momento difícil, o <strong>CVV</strong> atende 24 horas pelo{' '}
                    <a href="tel:188">188</a>, de graça e em sigilo.
                  </span>
                </div>
              )}

              <div>
                {section.questions
                  .filter((q) => isVisible(q, answers))
                  .map((q) => (
                    <QuestionField
                      key={q.code}
                      question={q}
                      value={answers[q.code]}
                      answers={answers}
                      onChange={(v) => setAnswer(q.code, v)}
                      error={errors[q.code]}
                      rowLabels={q.rowsFrom ? optionLabelsByCode[q.rowsFrom] : undefined}
                    />
                  ))}
              </div>
            </div>

            <div className="questionnaire__nav">
              <Button variant="gray" icon="chevron-left" onClick={() => goTo(step - 1)} disabled={step === 0}>
                Voltar
              </Button>
              <Button onClick={next} loading={submitting} iconRight={isLast ? 'check' : 'chevron-right'}>
                {isLast ? 'Enviar respostas' : 'Continuar'}
              </Button>
            </div>
          </>
        )}
      </section>

      <p className="t-footnote t-secondary row gap-2" style={{ alignItems: 'flex-start' }}>
        <Icon name="lock" size={14} className="footnote-icon" />
        Suas respostas são usadas apenas para recomendar profissionais e não substituem uma avaliação psicológica.
      </p>
    </>
  );
};
