import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { Icon } from '../components/Icon';
import { Button, PasswordField, TextField } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

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
      navigate(u.hasTriage ? '/dashboard' : '/triagem');
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível entrar. Verifique suas credenciais.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        <div>
          <h2 className="auth__title">Bem-vindo de volta</h2>
          <p className="auth__subtitle">Entre com o e-mail e a senha da sua conta.</p>
        </div>

        {error && (
          <div className="banner banner--danger" role="alert">
            <Icon name="alert" size={18} />
            {error}
          </div>
        )}

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <PasswordField
          label="Senha"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" size="lg" block loading={loading} disabled={!email || !password}>
          Entrar
        </Button>

        <p className="auth__switch">
          Novo por aqui? <Link to="/registro">Criar uma conta</Link>
        </p>

        {import.meta.env.DEV && (
          <>
            <hr className="divider" />
            <div className="auth__demo">
          <span>Contas de demonstração:</span>
          <button
            type="button"
            className="pill pill--tint"
            onClick={() => {
              setEmail('paciente@hopemind.local');
              setPassword('hopemind123');
            }}
          >
            Paciente
          </button>
          <button
            type="button"
            className="pill pill--sand"
            onClick={() => {
              setEmail('rafael@hopemind.local');
              setPassword('hopemind123');
            }}
          >
            Psicólogo
          </button>
            </div>
          </>
        )}
      </form>
    </AuthLayout>
  );
};
