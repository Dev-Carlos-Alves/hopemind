import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { Icon } from '../components/Icon';
import { Button, PasswordField, TextField } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { api, getErrorMessage } from '../services/api';
import { resetFormError } from '../services/password';

/**
 * Esqueci minha senha (igual ao app):
 *  1. a pessoa informa o e-mail ou CPF e a API manda um código de 6 dígitos para o e-mail da conta;
 *  2. ela digita o código e a nova senha aqui mesmo.
 */
export const ForgotPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [login, setLogin] = useState(params.get('login') ?? '');
  const [codeSent, setCodeSent] = useState(false);
  const [info, setInfo] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ message: string }>('/auth/forgot-password', { login: login.trim() });
      setInfo(res.data.message);
      setCodeSent(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível enviar o código.'));
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    const local = resetFormError(code, password, confirm);
    if (local) {
      setError(local);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { login: login.trim(), code: code.replace(/\D/g, ''), password });
      toast.success('Senha redefinida. Entre com a nova senha.');
      navigate('/login');
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível redefinir a senha.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form className="auth__form" onSubmit={codeSent ? reset : requestCode} noValidate>
        <div>
          <h2 className="auth__title">Redefinir senha</h2>
          <p className="auth__subtitle">
            {codeSent
              ? 'Digite o código que chegou no seu e-mail e escolha uma nova senha.'
              : 'Informe o e-mail ou CPF da sua conta. Vamos enviar um código de 6 dígitos para o e-mail cadastrado.'}
          </p>
        </div>

        {error && (
          <div className="banner banner--danger" role="alert">
            <Icon name="alert" size={18} />
            {error}
          </div>
        )}

        {!codeSent ? (
          <>
            <TextField label="E-mail ou CPF" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} autoFocus />
            <Button type="submit" size="lg" block loading={loading} disabled={!login.trim()}>
              Enviar código
            </Button>
          </>
        ) : (
          <>
            {info && (
              <div className="banner banner--tint" role="status">
                <Icon name="mail" size={18} />
                {info}
              </div>
            )}
            <TextField
              label="Código de 6 dígitos"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
            />
            <PasswordField label="Nova senha" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint="Pelo menos 8 caracteres." />
            <PasswordField label="Confirme a nova senha" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <Button type="submit" size="lg" block loading={loading} disabled={code.length !== 6 || !password || !confirm}>
              Redefinir senha
            </Button>
            <button type="button" className="auth__link auth__resend" onClick={() => requestCode()} disabled={loading}>
              Não recebeu? Enviar outro código
            </button>
          </>
        )}

        <p className="auth__switch">
          Lembrou a senha? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </AuthLayout>
  );
};
