import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { Icon } from '../components/Icon';

interface PsychologistMatch {
  idPsicologo: number;
  nome: string;
  especialidade: string;
  crp: string;
  linkContato: string;
  valorSessao: number;
  biografia: string;
  matchPercentage: number;
  foto: string;
}

export const PatientDashboardPage: React.FC = () => {
  const [matches, setMatches] = useState<PsychologistMatch[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<PsychologistMatch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedPsi, setSelectedPsi] = useState<PsychologistMatch | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user?.patientId) return;
      try {
        const res = await api.get(`/matches/${user.patientId}`);
        setMatches(res.data);
        setFilteredMatches(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [user]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMatches(matches);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredMatches(
        matches.filter(
          (m) =>
            m.nome.toLowerCase().includes(lower) ||
            m.especialidade.toLowerCase().includes(lower),
        ),
      );
    }
  }, [searchTerm, matches]);

  const handleOpenBookingModal = (psi: PsychologistMatch) => {
    setSelectedPsi(psi);
    // Set default tomorrow at 14:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    setAppointmentDate(tomorrow.toISOString().slice(0, 16));
  };

  const handleConfirmBooking = async () => {
    if (!selectedPsi || !user?.patientId || !appointmentDate) return;

    setBookingLoading(true);
    try {
      await api.post('/sessoes/agendar', {
        idPsicologo: selectedPsi.idPsicologo,
        idPaciente: user.patientId,
        dataHora: new Date(appointmentDate).toISOString(),
      });

      alert(`Sessão com ${selectedPsi.nome} agendada com sucesso!`);
      setSelectedPsi(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao agendar sessão.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Header />
      <div className="main-container">
        <Sidebar />
        <main className="content-area">
          <div className="module-header">
            <h1 className="module-header__title">Psicólogos Recomendados & Match</h1>
          </div>

          <div className="filter-bar">
            <span className="filter-bar__label">Filtrar por:</span>
            <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
              <input
                type="text"
                className="input"
                style={{ width: '100%', paddingLeft: '28px' }}
                placeholder="Nome ou especialidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div style={{ position: 'absolute', left: '8px', top: '7px', color: 'var(--text-muted)' }}>
                <Icon name="search" size={14} />
              </div>
            </div>
          </div>

          {loading ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Buscando melhores combinações...</p>
          ) : filteredMatches.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
              <Icon name="brain" size={36} color="var(--text-muted)" />
              <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Nenhum psicólogo encontrado para os filtros selecionados.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {filteredMatches.map((psi) => (
                <div key={psi.idPsicologo} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{psi.nome}</h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{psi.crp}</span>
                      </div>

                      <div
                        style={{
                          backgroundColor: psi.matchPercentage >= 70 ? '#E8F5E9' : '#FEF3C7',
                          color: psi.matchPercentage >= 70 ? 'var(--brand-primary)' : '#D97706',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontWeight: '700',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Icon name="star" size={12} />
                        {psi.matchPercentage}% Match
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <span className="badge badge-info">{psi.especialidade}</span>
                    </div>

                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                      {psi.biografia || 'Psicólogo especializado no atendimento clínico de adultos e jovens.'}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Valor por Sessão</span>
                      <strong style={{ fontSize: '14px', color: 'var(--brand-primary)' }}>
                        R$ {Number(psi.valorSessao || 150).toFixed(2)}
                      </strong>
                    </div>

                    <button
                      onClick={() => handleOpenBookingModal(psi)}
                      className="btn btn-primary"
                    >
                      <Icon name="calendar" size={14} />
                      Agendar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal de Agendamento */}
          {selectedPsi && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Agendar Sessão de Terapia</h3>
                  <button onClick={() => setSelectedPsi(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Profissional: <strong>{selectedPsi.nome}</strong> ({selectedPsi.especialidade})
                </p>

                <div className="form-field">
                  <label className="form-field__label">Escolha a Data e Hora <span className="form-field__required">*</span></label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                  <button onClick={() => setSelectedPsi(null)} className="btn btn-secondary">Cancelar</button>
                  <button onClick={handleConfirmBooking} className="btn btn-primary" disabled={bookingLoading}>
                    {bookingLoading ? 'Confirmando...' : 'Confirmar Agendamento'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
