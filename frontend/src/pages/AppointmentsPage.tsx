import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { Icon } from '../components/Icon';

interface AppointmentItem {
  id: number;
  dataHora: string;
  status: string;
  psicologoNome: string;
  pacienteNome: string;
  especialidade: string;
  crp: string;
}

export const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get('/sessoes');
        setAppointments(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <div className="app-shell">
      <Header />
      <div className="main-container">
        <Sidebar />
        <main className="content-area">
          <div className="module-header">
            <h1 className="module-header__title">Minhas Sessões & Agendamentos</h1>
          </div>

          <div className="card">
            <div className="card__header">
              <span>Lista de Consultas Marcadas</span>
              <span className="badge badge-success">{appointments.length} Ativas</span>
            </div>

            {loading ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Carregando agendamentos...</p>
            ) : appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                <Icon name="calendar" size={32} color="var(--text-muted)" />
                <p style={{ marginTop: '8px', fontSize: '13px' }}>Você ainda não possui nenhuma sessão agendada.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data & Hora</th>
                    <th>Psicólogo(a)</th>
                    <th>Paciente</th>
                    <th>Especialidade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '600' }}>
                        {new Date(item.dataHora).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td>{item.psicologoNome}</td>
                      <td>{item.pacienteNome}</td>
                      <td>{item.especialidade}</td>
                      <td>
                        <span className="badge badge-success">{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
