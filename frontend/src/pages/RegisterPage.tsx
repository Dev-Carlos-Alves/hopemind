import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { CepField } from '../components/CepField';
import { Icon } from '../components/Icon';
import { Button, PasswordField, Segmented, SelectField, TextField } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { maskCpf, maskPhone, onlyDigits } from '../services/format';

type UserType = 'PATIENT' | 'PSYCHOLOGIST';

const GENDERS = [
  { value: 'Feminino', label: 'Feminino' },
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Não binário', label: 'Não binário' },
  { value: 'Prefiro não informar', label: 'Prefiro não informar' },
];

export const RegisterPage: React.FC = () => {
  const [userType, setUserType] = useState<UserType>('PATIENT');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    phone: '',
    birthDate: '',
    gender: 'Prefiro não informar',
    crp: '',
    specialty: '',
    sessionFee: '',
    cep: '',
    addressNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { registerUser, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const isPsychologist = userType === 'PSYCHOLOGIST';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerUser({
        userType,
        name: form.name,
        email: form.email,
        password: form.password,
        cpf: onlyDigits(form.cpf),
        phone: onlyDigits(form.phone),
        birthDate: form.birthDate,
        gender: form.gender,
        ...(form.cep && { cep: onlyDigits(form.cep), addressNumber: form.addressNumber || undefined }),
        ...(isPsychologist && {
          crp: form.crp,
          specialty: form.specialty,
          sessionFee: form.sessionFee || undefined,
        }),
      });
      const user = await login(form.email, form.password);
      toast.success('Conta criada! Vamos montar o seu perfil.');
      navigate(user.hasTriage ? '/inicio' : isPsychologist ? '/triagem' : '/matches');
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível concluir o cadastro.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form className="auth__form auth__form--wide" onSubmit={handleSubmit} noValidate>
        <div>
          <h2 className="auth__title">Criar sua conta</h2>
          <p className="auth__subtitle">Leva menos de um minuto. Depois você responde o questionário de perfil.</p>
        </div>

        <Segmented<UserType>
          label="Tipo de conta"
          size="lg"
          value={userType}
          onChange={setUserType}
          options={[
            { value: 'PATIENT', label: 'Busco atendimento' },
            { value: 'PSYCHOLOGIST', label: 'Sou psicólogo(a)' },
          ]}
        />

        {error && (
          <div className="banner banner--danger" role="alert">
            <Icon name="alert" size={18} />
            {error}
          </div>
        )}

        <TextField label="Nome completo" autoComplete="name" value={form.name} onChange={set('name')} required />
        <TextField label="E-mail" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set('email')} required />

        <div className="field-grid">
          <TextField
            label="CPF"
            inputMode="numeric"
            value={form.cpf}
            onChange={(e) => setForm((f) => ({ ...f, cpf: maskCpf(e.target.value) }))}
            required
          />
          <TextField
            label="Celular"
            type="tel"
            autoComplete="tel-national"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: maskPhone(e.target.value) }))}
            required
          />
        </div>

        <div className="field-grid">
          <TextField label="Data de nascimento" type="date" autoComplete="bday" value={form.birthDate} onChange={set('birthDate')} required />
          <SelectField label="Gênero" value={form.gender} onChange={set('gender')} options={GENDERS} />
        </div>

        <div className="field-grid">
          <CepField
            label={isPsychologist ? 'CEP do consultório' : 'CEP'}
            value={form.cep}
            onChange={(cep) => setForm((f) => ({ ...f, cep }))}
            hint={isPsychologist ? 'Pacientes veem só o bairro e a distância.' : 'Para calcular a distância até cada consultório.'}
          />
          <TextField label="Número (opcional)" value={form.addressNumber} onChange={set('addressNumber')} maxLength={20} />
        </div>

        {isPsychologist && (
          <div className="stack gap-3 animate-rise">
            <p className="group__header" style={{ padding: '8px 4px 0' }}>
              Registro profissional
            </p>
            <div className="field-grid">
              <TextField label="CRP" value={form.crp} onChange={set('crp')} hint="Ex.: CRP 02/123456" required />
              <TextField
                label="Valor da sessão (R$)"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={form.sessionFee}
                onChange={set('sessionFee')}
              />
            </div>
            <TextField label="Especialidade principal" value={form.specialty} onChange={set('specialty')} hint="Ex.: Terapia Cognitivo-Comportamental" required />
          </div>
        )}

        <PasswordField
          label="Crie uma senha"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          hint="Pelo menos 8 caracteres."
          required
        />

        <Button type="submit" size="lg" block loading={loading}>
          Criar conta
        </Button>

        <p className="auth__switch">
          Já tem uma conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </AuthLayout>
  );
};
