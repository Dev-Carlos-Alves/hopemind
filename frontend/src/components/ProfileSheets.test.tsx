import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { PatientProfileSheet, PsychologistProfileSheet } from './ProfileSheets';
import { resetFormError } from '../services/password';

const PSY = {
  id: 7,
  name: 'Rafael Moura',
  crp: 'CRP 02/12345',
  specialty: 'Psicologia clínica',
  approaches: ['Terapia Cognitivo-Comportamental'],
  biography: 'Atendo adultos com ansiedade.',
  sessionFee: '150.00',
  contactLink: 'https://wa.me/5581988887777',
  modalities: ['online', 'presencial'],
  neighborhood: 'Espinheiro',
  experience: '5 a 10 anos',
  audiences: ['Adultos'],
  demands: ['Ansiedade', 'Sono'],
  experiencedWith: ['Mais reservado'],
};

describe('perfis detalhados (paridade com o app)', () => {
  it('perfil do psicólogo mostra tudo o que ele contou, com contato e horários', () => {
    const onBook = vi.fn();
    render(<PsychologistProfileSheet psychologist={PSY} distanceKm={1.1} onBook={onBook} onClose={vi.fn()} />);
    expect(screen.getByText('Atendo adultos com ansiedade.')).toBeInTheDocument();
    expect(screen.getByText('5 a 10 anos')).toBeInTheDocument();
    expect(screen.getByText('Mais reservado')).toBeInTheDocument();
    expect(screen.getByText(/Espinheiro · 1,1 km/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Falar com Rafael Moura' })).toHaveAttribute('href', 'https://wa.me/5581988887777');
    screen.getByRole('button', { name: /Ver horários/ }).click();
    expect(onBook).toHaveBeenCalled();
  });

  it('perfil do paciente mostra o "Sobre mim" ou um aviso quando ele não escreveu nada', () => {
    const patient = { nome: 'Ana Souza', idade: 28, genero: 'Feminino', sobre: 'Ando ansiosa com o trabalho.', prioridades: ['Ansiedade'], outrosTemas: [], modalidade: 'Online', bairro: 'Graças', cidade: 'Recife' };
    const { rerender } = render(<PatientProfileSheet patient={patient} onClose={vi.fn()} />);
    expect(screen.getByText('Ando ansiosa com o trabalho.')).toBeInTheDocument();
    expect(screen.getByText('28 anos · Feminino')).toBeInTheDocument();
    rerender(<PatientProfileSheet patient={{ ...patient, sobre: null }} onClose={vi.fn()} />);
    expect(screen.getByText('O paciente não escreveu uma descrição no cadastro.')).toBeInTheDocument();
  });

  it('não renderiza nada sem uma pessoa selecionada', () => {
    render(<PatientProfileSheet patient={null} onClose={vi.fn()} />);
    expect(screen.queryByText('Sobre mim')).not.toBeInTheDocument();
  });
});

describe('formulário de nova senha', () => {
  it.each([
    ['123', 'SenhaForte1', 'SenhaForte1', 'O código tem 6 dígitos.'],
    ['123456', 'curta', 'curta', 'A senha precisa ter pelo menos 8 caracteres.'],
    ['123456', 'SenhaForte1', 'SenhaForte2', 'As senhas não são iguais.'],
    ['123 456', 'SenhaForte1', 'SenhaForte1', ''],
  ])('código %s → "%s"', (code, password, confirm, expected) => {
    expect(resetFormError(code, password, confirm)).toBe(expected);
  });
});
