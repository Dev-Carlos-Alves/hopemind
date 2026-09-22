import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const u = await login(email, password);
      if (u.userType === 'PATIENT' && !u.hasTriage) {
        navigate('/triagem');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--page-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/images/logo-hopemind-full.png"
            alt="HopeMind Logo"
            style={{ maxHeight: '60px', width: 'auto', marginBottom: '12px', objectFit: 'contain' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--brand-primary)', marginBottom: '4px' }}>
            HopeMind
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Plataforma de Saúde Mental & Triagem Inteligente
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              color: '#B91C1C',
              padding: '10px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              marginBottom: '16px',
              border: '1px solid #FCA5A5',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-field__label">
              E-mail <span className="form-field__required">*</span>
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: paciente@hopemind.local"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-field__label">
              Senha <span className="form-field__required">*</span>
            </label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '14px', height: '36px', fontSize: '14px' }}
          >
            {loading ? 'Entrando...' : 'Entrar na Plataforma'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
          Ainda não possui uma conta?{' '}
          <Link to="/registro" style={{ color: 'var(--brand-primary)', fontWeight: '600', textDecoration: 'none' }}>
            Cadastre-se aqui
          </Link>
        </div>
      </div>

      {/* SafeMindLive Branding Footer */}
      <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.85 }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Desenvolvido por</span>
        <img
          src="/images/safe-mind-live-logo.png"
          alt="SafeMindLive Logo"
          style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
};
