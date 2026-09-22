import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icon';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header__brand">
        <img
          src="/images/logo-hopemind-full.png"
          alt="HopeMind"
          style={{ height: '28px', width: 'auto', objectFit: 'contain' }}
        />
        <span style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '0.5px' }}>HopeMind</span>
        <span style={{ fontSize: '10px', color: '#A3E635', opacity: 0.8, textTransform: 'uppercase', paddingLeft: '8px' }}>
          by SafeMindLive
        </span>
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
