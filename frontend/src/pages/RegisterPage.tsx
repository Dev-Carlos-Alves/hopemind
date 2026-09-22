import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/Icon';

export const RegisterPage: React.FC = () => {
  const [userType, setUserType] = useState<'PATIENT' | 'PSYCHOLOGIST'>('PATIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('Masculino');

  // Specific Psychologist fields
  const [crp, setCrp] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [sessionFee, setSessionFee] = useState('150.00');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerUser({
        name,
        email,
        password,
        cpf,
        phone,
        birthDate,
        gender,
        userType,
        crp: userType === 'PSYCHOLOGIST' ? crp : undefined,
        specialty: userType === 'PSYCHOLOGIST' ? specialty : undefined,
        sessionFee: userType === 'PSYCHOLOGIST' ? sessionFee : undefined,
      });

      alert('Cadastro realizado com sucesso! Faça login para acessar sua conta.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao realizar cadastro.');
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '540px', padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <Icon name="brain" size={28} color="#2E7D32" />
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--brand-primary)' }}>Criar Conta HopeMind</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Preencha seus dados para acessar a plataforma</p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              color: '#B91C1C',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-field__label">Perfil de Usuário</label>
            <select
              className="select"
              value={userType}
              onChange={(e) => setUserType(e.target.value as any)}
            >
              <option value="PATIENT">Paciente (Busco atendimento psicológico)</option>
              <option value="PSYCHOLOGIST">Psicólogo(a) (Quero atender pacientes)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-field">
              <label className="form-field__label">Nome Completo <span className="form-field__required">*</span></label>
              <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="form-field">
              <label className="form-field__label">E-mail <span className="form-field__required">*</span></label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-field">
              <label className="form-field__label">CPF <span className="form-field__required">*</span></label>
              <input type="text" className="input" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" required />
            </div>

            <div className="form-field">
              <label className="form-field__label">Telefone <span className="form-field__required">*</span></label>
              <input type="text" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 90000-0000" required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-field">
              <label className="form-field__label">Data de Nascimento</label>
              <input type="date" className="input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
            </div>

            <div className="form-field">
              <label className="form-field__label">Gênero</label>
              <select className="select" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          {userType === 'PSYCHOLOGIST' && (
            <div style={{ backgroundColor: '#F0FDF4', padding: '12px', borderRadius: '4px', marginBottom: '12px', border: '1px solid #BBF7D0' }}>
              <div className="form-field">
                <label className="form-field__label">Registro CRP <span className="form-field__required">*</span></label>
                <input type="text" className="input" value={crp} onChange={(e) => setCrp(e.target.value)} placeholder="CRP 06/123456" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-field">
                  <label className="form-field__label">Especialidade Principal</label>
                  <input type="text" className="input" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="ex: Terapia Cognitivo-Comportamental" required />
                </div>

                <div className="form-field">
                  <label className="form-field__label">Valor por Sessão (R$)</label>
                  <input type="number" step="0.01" className="input" value={sessionFee} onChange={(e) => setSessionFee(e.target.value)} required />
                </div>
              </div>
            </div>
          )}

          <div className="form-field">
            <label className="form-field__label">Senha de Acesso <span className="form-field__required">*</span></label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '12px' }}>
            {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
          Já possui conta?{' '}
          <Link to="/login" style={{ color: 'var(--brand-primary)', fontWeight: '600', textDecoration: 'none' }}>
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
};
