import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon, IconName } from './Icon';
import { Avatar } from './ui';

interface NavEntry {
  to: string;
  label: string;
  short: string;
  icon: IconName;
}

const PATIENT_NAV: NavEntry[] = [
  { to: '/inicio', label: 'Home', short: 'Home', icon: 'home' },
  { to: '/consultas', label: 'Minhas sessões', short: 'Sessões', icon: 'calendar' },
  { to: '/matches', label: 'Matches', short: 'Matches', icon: 'sparkles' },
  { to: '/configuracoes', label: 'Ajustes', short: 'Ajustes', icon: 'settings' },
];

const PSYCHOLOGIST_NAV: NavEntry[] = [
  { to: '/inicio', label: 'Home', short: 'Home', icon: 'home' },
  { to: '/consultas', label: 'Agenda', short: 'Agenda', icon: 'calendar' },
  { to: '/triagem', label: 'Perfil de atendimento', short: 'Perfil', icon: 'clipboard' },
  { to: '/configuracoes', label: 'Ajustes', short: 'Ajustes', icon: 'settings' },
];

export const Wordmark: React.FC = () => (
  <>
    Hope<span>Mind</span>
  </>
);

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const nav = user?.userType === 'PSYCHOLOGIST' ? PSYCHOLOGIST_NAV : PATIENT_NAV;
  const role = user?.userType === 'PSYCHOLOGIST' ? 'Psicólogo(a)' : 'Paciente';

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Navegação principal">
        <Link to="/inicio" className="sidebar__brand">
          <img src="/images/emblema.png" alt="" />
          <span className="sidebar__wordmark">
            <Wordmark />
          </span>
        </Link>

        <nav className="sidebar__nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
            >
              <Icon name={item.icon} size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="sidebar__account">
            <Avatar name={user.name} size="sm" />
            <div className="grow">
              <p className="sidebar__account-name">{user.name}</p>
              <p className="sidebar__account-role">{role}</p>
            </div>
            <button type="button" className="btn btn--plain btn--icon btn--sm" onClick={logout} aria-label="Sair da conta" title="Sair">
              <Icon name="logout" size={18} />
            </button>
          </div>
        )}
      </aside>

      <header className="topbar">
        <Link to="/inicio" className="topbar__brand">
          <img src="/images/emblema.png" alt="" />
          <span className="sidebar__wordmark">
            <Wordmark />
          </span>
        </Link>
        {user && (
          <Link to="/configuracoes" aria-label="Ajustes da conta">
            <Avatar name={user.name} size="sm" />
          </Link>
        )}
      </header>

      <main className="main" id="conteudo">
        {/* Keyed by path so every screen gets its entrance animation. */}
        <div className="main__inner" key={pathname}>
          <Outlet />
        </div>
      </main>

      <nav className="tabbar" aria-label="Navegação principal">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `tab${isActive ? ' tab--active' : ''}`}>
            <Icon name={item.icon} size={24} strokeWidth={1.7} />
            {item.short}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
