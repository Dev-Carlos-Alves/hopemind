import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icon';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      {user?.userType === 'PATIENT' && (
        <>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
            }
          >
            <Icon name="heart" size={16} />
            <span>Psicólogos & Match</span>
          </NavLink>

          <NavLink
            to="/triagem"
            className={({ isActive }) =>
              `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
            }
          >
            <Icon name="list" size={16} />
            <span>Refazer Triagem</span>
          </NavLink>

          <NavLink
            to="/consultas"
            className={({ isActive }) =>
              `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
            }
          >
            <Icon name="calendar" size={16} />
            <span>Minhas Sessões</span>
          </NavLink>
        </>
      )}

      {user?.userType === 'PSYCHOLOGIST' && (
        <>
          <NavLink
            to="/consultas"
            className={({ isActive }) =>
              `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
            }
          >
            <Icon name="calendar" size={16} />
            <span>Agenda de Sessões</span>
          </NavLink>
        </>
      )}

      <NavLink
        to="/configuracoes"
        className={({ isActive }) =>
          `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
        }
      >
        <Icon name="settings" size={16} />
        <span>Configurações</span>
      </NavLink>
    </aside>
  );
};
