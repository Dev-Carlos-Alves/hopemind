import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AddressCard } from '../components/AddressCard';
import { Icon } from '../components/Icon';
import { QuestionnaireForm } from '../components/QuestionnaireForm';
import { PageHeader } from '../components/ui';
import { useAuth } from '../context/AuthContext';

/** Psychologist's "Perfil de atendimento". Patients answer their questionnaire inside Matches. */
export const TriagePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user?.userType !== 'PSYCHOLOGIST') return <Navigate to="/matches?questionario=1" replace />;

  return (
    <>
      <PageHeader
        eyebrow="Perfil de atendimento"
        title="Como você atende"
        subtitle="Suas respostas são comparadas com as preferências dos pacientes para indicar você a quem mais combina com o seu estilo."
      />

      <div style={{ maxWidth: 760 }}>
        <AddressCard
          title="Endereço do consultório"
          footer="Pacientes veem só o bairro e a distância até você — nunca a rua ou o número."
        />
      </div>

      <QuestionnaireForm onSubmitted={() => navigate('/consultas')} />

      <p className="t-footnote t-secondary row gap-2" style={{ alignItems: 'flex-start' }}>
        <Icon name="lock" size={14} className="footnote-icon" />
        Suas respostas são usadas apenas para recomendar você a pacientes compatíveis.
      </p>
    </>
  );
};
