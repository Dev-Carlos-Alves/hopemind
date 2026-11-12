import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { vi } from 'vitest';
import { ProfessionalProfileSheet } from './ProfessionalProfileSheet';
import { api } from '../services/api';

const toast = { success: vi.fn(), error: vi.fn() };
vi.mock('../context/ToastContext', () => ({ useToast: () => toast }));

const PROFILE = {
  crp: 'CRP 02/12345',
  specialty: 'Psicologia clínica',
  therapeuticApproach: 'TCC',
  biography: 'Atendo adultos.',
  sessionFee: '150.00',
  contactLink: null,
};

describe('ProfessionalProfileSheet — edição do perfil profissional (US-11)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    toast.success.mockReset();
  });

  it('vem preenchido e envia as alterações para PATCH /api/auth/me/profile', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { ...PROFILE, sessionFee: 180, contactLink: 'https://wa.me/55819' } } as never);
    const onSaved = vi.fn();
    const onClose = vi.fn();
    render(<ProfessionalProfileSheet open profile={PROFILE} onClose={onClose} onSaved={onSaved} />);

    expect(screen.getByLabelText('Especialidade')).toHaveValue('Psicologia clínica');
    expect(screen.getByLabelText('Valor da sessão (R$)')).toHaveValue('150');

    const fee = screen.getByLabelText('Valor da sessão (R$)');
    await userEvent.clear(fee);
    await userEvent.type(fee, '180,00');
    await userEvent.type(screen.getByLabelText('Link de contato'), 'https://wa.me/55819');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await act(async () => undefined);

    expect(patch).toHaveBeenCalledWith('/auth/me/profile', {
      specialty: 'Psicologia clínica',
      therapeuticApproach: 'TCC',
      biography: 'Atendo adultos.',
      sessionFee: '180.00',
      contactLink: 'https://wa.me/55819',
    });
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ sessionFee: 180 }));
    expect(onClose).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it('mostra a mensagem da API quando a validação falha e não fecha', async () => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    vi.spyOn(api, 'patch').mockRejectedValue(
      new AxiosError('400', '400', config, {}, { status: 400, data: { message: ['Informe um link começando com http:// ou https://.'] }, statusText: '', headers: {}, config }),
    );
    const onClose = vi.fn();
    render(<ProfessionalProfileSheet open profile={PROFILE} onClose={onClose} onSaved={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Link de contato'), 'wa.me/123');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Informe um link começando com http:// ou https://.');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('conta os caracteres da biografia', async () => {
    render(<ProfessionalProfileSheet open profile={PROFILE} onClose={vi.fn()} onSaved={vi.fn()} />);
    expect(screen.getByText(/15\/2000/)).toBeInTheDocument();
  });
});
