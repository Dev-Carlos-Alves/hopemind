import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icon';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header__brand">
        <Icon name="brain" size={22} color="#4CAF50" />
        <span>HopeMind</span>
      </div>

      {user && (
        <div className="header__user">
          <Icon name="user" size={16} />
          <span>{user.name} ({user.userType === 'PSYCHOLOGIST' ? 'Psicólogo' : 'Paciente'})</span>
          <button
            onClick={logout}
            className="btn btn-outline"
            style={{ height: '26px', padding: '0 8px', fontSize: '11px', borderColor: 'rgba(255,255,255,0.3)', color: '#FFF' }}
          >
            <Icon name="logout" size={12} />
            Sair
          </button>
        </div>
      )}
    </header>
  );
};
