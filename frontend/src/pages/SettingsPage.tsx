import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { Icon } from '../components/Icon';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <Header />
      <div className="main-container">
        <Sidebar />
        <main className="content-area">
          <div className="module-header">
            <h1 className="module-header__title">Configurações do Perfil</h1>
          </div>

          <div className="card" style={{ maxWidth: '600px' }}>
            <div className="card__header">
              <span>Dados Cadastrais</span>
              <Icon name="user" size={18} color="var(--brand-primary)" />
            </div>

            <div className="form-field">
              <label className="form-field__label">Nome Completo</label>
              <input type="text" className="input" value={user?.name || ''} readOnly />
            </div>

            <div className="form-field">
              <label className="form-field__label">E-mail</label>
              <input type="email" className="input" value={user?.email || ''} readOnly />
            </div>

            <div className="form-field">
              <label className="form-field__label">Tipo de Perfil</label>
              <input
                type="text"
                className="input"
                value={user?.userType === 'PSYCHOLOGIST' ? 'Psicólogo (Profissional)' : 'Paciente'}
                readOnly
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
