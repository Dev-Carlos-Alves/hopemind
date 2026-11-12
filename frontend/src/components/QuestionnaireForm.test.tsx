import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { QuestionnaireForm } from './QuestionnaireForm';
import { api } from '../services/api';
import { Questionnaire } from '../services/questionnaire';

const toast = { success: vi.fn(), error: vi.fn() };
vi.mock('../context/ToastContext', () => ({ useToast: () => toast }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { userType: 'PATIENT' }, refreshProfile: vi.fn().mockResolvedValue(undefined) }) }));

const QUESTIONNAIRE: Questionnaire = {
  audience: 'PATIENT',
  version: 'test-1',
  sections: [
    {
      id: 'formato',
      title: 'Formato',
      questions: [{ code: 'P20', type: 'single', prompt: 'Como prefere ser atendido?', required: true, usage: 'filtro', options: [{ value: 'online', label: 'Online' }, { value: 'presencial', label: 'Presencial' }] }],
    },
    {
      id: 'seguranca',
      title: 'Segurança',
      questions: [{ code: 'P26', type: 'single', prompt: 'Pensou em se machucar?', required: true, usage: 'seguranca', options: [{ value: 'nao', label: 'Não' }, { value: 'sim', label: 'Sim' }] }],
    },
  ],
};

describe('QuestionnaireForm — triagem em etapas (US-04)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    toast.success.mockReset();
    toast.error.mockReset();
    vi.spyOn(api, 'get').mockImplementation(async (url: string) => ({ data: url === '/triage/questionnaire' ? QUESTIONNAIRE : null }) as never);
  });

  it('valida a etapa, preserva as respostas ao voltar e envia tudo em JSON', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { safety: { level: 'NONE', resources: [] } } } as never);
    const onSubmitted = vi.fn();
    render(<QuestionnaireForm onSubmitted={onSubmitted} />);

    expect(await screen.findByText('Etapa 1 de 2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('Responda esta pergunta para continuar.');

    await userEvent.click(screen.getByRole('radio', { name: 'Online' }));
    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(screen.getByText('Etapa 2 de 2')).toBeInTheDocument();
    expect(screen.getByText(/atende 24 horas pelo/)).toBeInTheDocument(); // aviso do CVV na etapa de segurança

    await userEvent.click(screen.getByRole('button', { name: /Voltar/ }));
    expect(screen.getByRole('radio', { name: 'Online' })).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    await userEvent.click(screen.getByRole('radio', { name: 'Não' }));
    await userEvent.click(screen.getByRole('button', { name: /Enviar respostas/ }));
    await act(async () => undefined); // deixa o envio terminar (refreshProfile + estado de carregamento)

    expect(post).toHaveBeenCalledWith('/triage/submissions', { answers: { P20: 'online', P26: 'nao' } });
    expect(onSubmitted).toHaveBeenCalledWith({ level: 'NONE', resources: [] });
    expect(toast.success).toHaveBeenCalled();
  });

  it('em caso de risco não mostra o toast de sucesso e repassa o nível de segurança', async () => {
    const safety = { level: 'IMMEDIATE', resources: [{ name: 'CVV', detail: '188', href: 'tel:188' }] };
    vi.spyOn(api, 'post').mockResolvedValue({ data: { safety } } as never);
    const onSubmitted = vi.fn();
    render(<QuestionnaireForm onSubmitted={onSubmitted} />);
    await userEvent.click(await screen.findByRole('radio', { name: 'Online' }));
    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    await userEvent.click(screen.getByRole('radio', { name: 'Sim' }));
    await userEvent.click(screen.getByRole('button', { name: /Enviar respostas/ }));
    await act(async () => undefined); // deixa o envio terminar (refreshProfile + estado de carregamento)
    expect(onSubmitted).toHaveBeenCalledWith(safety);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('retoma as respostas já enviadas', async () => {
    vi.spyOn(api, 'get').mockImplementation(async (url: string) => ({ data: url === '/triage/questionnaire' ? QUESTIONNAIRE : { answers: { P20: 'presencial' } } }) as never);
    render(<QuestionnaireForm onSubmitted={vi.fn()} />);
    expect(await screen.findByRole('radio', { name: 'Presencial' })).toHaveAttribute('aria-checked', 'true');
  });

  it('avisa quando o questionário não carrega', async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new Error('offline'));
    render(<QuestionnaireForm onSubmitted={vi.fn()} />);
    expect(await screen.findByText('Questionário indisponível')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalled();
  });
});
