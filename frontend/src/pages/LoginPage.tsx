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
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Erro ao realizar login. Verifique suas credenciais.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
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
        padding: '32px 20px',
      }}
    >
      {/* Big HopeMind Logo OUTSIDE the Card */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <img
          src="/images/logo-hopemind-full.png"
          alt="HopeMind Logo"
          style={{
            maxHeight: '130px',
            maxWidth: '380px',
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.06))',
          }}
        />
      </div>

      {/* Login Card Block */}
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '32px', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Acesse sua Conta
          </h2>
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
            style={{ width: '100%', marginTop: '16px', height: '38px', fontSize: '14px', fontWeight: '600' }}
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

      {/* SafeMindLive Branding Footer (Below Card) */}
      <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
          Desenvolvido por
        </span>
        <img
          src="/images/safe-mind-live-logo.png"
          alt="SafeMindLive Logo"
          style={{ height: '52px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.04))' }}
        />
      </div>
    </div>
  );
};
