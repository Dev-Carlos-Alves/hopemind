import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Button, EmptyState, PageHeader, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, getErrorMessage } from '../services/api';

interface Option {
  idOpcao: number;
  idPergunta: number;
  textoOpcao: string;
}

interface Question {
  idPergunta: number;
  textoPergunta: string;
  opcoes: Option[];
}

export const TriagePage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const isPsychologist = user?.userType === 'PSYCHOLOGIST';

  useEffect(() => {
    api
      .get<Question[]>('/triage/questions', { params: { tipo: user?.userType } })
      .then((res) => setQuestions(res.data))
      .catch((err) => toast.error(getErrorMessage(err, 'Não foi possível carregar o questionário.')))
      .finally(() => setLoading(false));
  }, [user?.userType, toast]);

  const question = questions[step];
  const isLast = step === questions.length - 1;
  const progress = questions.length ? ((step + (question && answers[question.idPergunta] ? 1 : 0)) / questions.length) * 100 : 0;

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post('/triage/submit', {
        tipo: isPsychologist ? 'Psicologo' : 'Paciente',
        respostas: Object.entries(answers).map(([idPergunta, idOpcao]) => ({
          idPergunta: Number(idPergunta),
          idOpcao,
        })),
      });
      await refreshProfile();
      toast.success(isPsychologist ? 'Perfil de atendimento salvo.' : 'Pronto! Suas recomendações foram atualizadas.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Não foi possível enviar suas respostas.'));
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => (isLast ? submit() : setStep((s) => s + 1));

  return (
    <>
      <PageHeader
        eyebrow={isPsychologist ? 'Perfil de atendimento' : 'Questionário'}
        title={isPsychologist ? 'Como você atende' : 'Conte um pouco sobre você'}
        subtitle={
          isPsychologist
            ? 'Suas respostas ajudam a indicar você aos pacientes que mais combinam com o seu estilo.'
            : 'Não existe resposta certa. Isso não é um diagnóstico — serve só para entender suas preferências.'
        }
      />

      <section className="card card--lg questionnaire">
        {loading ? (
          <div className="stack gap-4">
            <Skeleton height={4} />
            <Skeleton width="70%" height={26} />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={56} radius={12} />
            ))}
          </div>
        ) : !question ? (
          <EmptyState title="Questionário indisponível" text="Tente novamente em instantes." />
        ) : (
          <>
            <div className="stack gap-2">
              <div className="row between t-footnote t-secondary">
                <span>
                  Pergunta {step + 1} de {questions.length}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress__bar" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <fieldset className="questionnaire__step" key={question.idPergunta}>
              <legend className="t-title-2 t-balance questionnaire__prompt">{question.textoPergunta}</legend>
              <div className="stack gap-2" role="radiogroup">
                {question.opcoes.map((o) => {
                  const checked = answers[question.idPergunta] === o.idOpcao;
                  return (
                    <button
                      key={o.idOpcao}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      className="option"
                      onClick={() => setAnswers((a) => ({ ...a, [question.idPergunta]: o.idOpcao }))}
                    >
                      <span className="option__mark">{checked && <Icon name="check" size={14} strokeWidth={3} />}</span>
                      <span className="option__text">{o.textoOpcao}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="questionnaire__nav">
              <Button variant="gray" icon="chevron-left" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
                Voltar
              </Button>
              <Button
                onClick={next}
                loading={submitting}
                disabled={!answers[question.idPergunta]}
                iconRight={isLast ? 'check' : 'chevron-right'}
              >
                {isLast ? 'Concluir' : 'Continuar'}
              </Button>
            </div>
          </>
        )}
      </section>
    </>
  );
};
