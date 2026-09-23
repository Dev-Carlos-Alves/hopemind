import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { Icon } from '../components/Icon';

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
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get('/triage/questions', {
          params: { tipo: user?.userType },
        });
        setQuestions(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [user]);

  const handleSelectOption = (questionId: number, optionId: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payloadAnswers = Object.entries(selectedAnswers).map(([pId, oId]) => ({
      idPergunta: Number(pId),
      idOpcao: Number(oId),
    }));

    try {
      await api.post('/triage/submit', {
        tipo: user?.userType === 'PSYCHOLOGIST' ? 'Psicologo' : 'Paciente',
        respostas: payloadAnswers,
      });

      await refreshProfile();
      alert('Triagem concluída com sucesso! Calculando suas melhores recomendações...');
      navigate('/dashboard');
    } catch (err) {
      alert(getErrorMessage(err, 'Não foi possível enviar a triagem.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <Header />
      <div className="main-container">
        <Sidebar />
        <main className="content-area">
          <div className="module-header">
            <h1 className="module-header__title">Triagem Inteligente de Perfil</h1>
          </div>

          <div className="card">
            <div className="card__header">
              <span>Questionário de Avaliação e Preferências</span>
              <span className="badge badge-info">Passo Obrigatório</span>
            </div>

            {loading ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Carregando perguntas...</p>
            ) : (
              <form onSubmit={handleSubmit}>
                {questions.map((q, idx) => (
                  <div
                    key={q.idPergunta}
                    style={{
                      marginBottom: '20px',
                      paddingBottom: '16px',
                      borderBottom: idx < questions.length - 1 ? '1px solid var(--border-color)' : 'none',
                    }}
                  >
                    <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '10px' }}>
                      {idx + 1}. {q.textoPergunta}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.opcoes.map((o) => {
                        const isSelected = selectedAnswers[q.idPergunta] === o.idOpcao;
                        return (
                          <div
                            key={o.idOpcao}
                            onClick={() => handleSelectOption(q.idPergunta, o.idOpcao)}
                            style={{
                              padding: '10px 14px',
                              borderRadius: '4px',
                              border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
                              backgroundColor: isSelected ? '#E8F5E9' : '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '13px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>{o.textoOpcao}</span>
                            {isSelected && <Icon name="check" size={16} color="var(--brand-primary)" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || Object.keys(selectedAnswers).length < questions.length}
                  style={{ marginTop: '16px', minWidth: '160px' }}
                >
                  {submitting ? 'Enviando...' : 'Concluir Triagem'}
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
