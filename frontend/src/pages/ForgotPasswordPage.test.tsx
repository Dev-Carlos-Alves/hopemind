import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { api } from '../services/api';

const toast = { success: vi.fn(), error: vi.fn() };
vi.mock('../context/ToastContext', () => ({ useToast: () => toast }));

const renderPage = (url = '/esqueci-senha?login=529.982.247-25') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/login" element={<p>Tela de login</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('Esqueci minha senha (web)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('pede o código pelo e-mail ou CPF e redefine a senha com ele', async () => {
    const post = vi.spyOn(api, 'post').mockImplementation(async (url: string) =>
      ({ data: { message: url.endsWith('forgot-password') ? 'Se houver uma conta com esses dados, enviamos um código.' : 'Senha redefinida.' } }) as never,
    );
    renderPage();
    expect(screen.getByLabelText('E-mail ou CPF')).toHaveValue('529.982.247-25');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar código' }));
    expect(post).toHaveBeenCalledWith('/auth/forgot-password', { login: '529.982.247-25' });
    expect(await screen.findByText(/enviamos um código/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Código de 6 dígitos'), '12a3456');
    await userEvent.type(screen.getByLabelText('Nova senha'), 'NovaSenha2026');
    await userEvent.type(screen.getByLabelText('Confirme a nova senha'), 'NovaSenha2026');
    await userEvent.click(screen.getByRole('button', { name: 'Redefinir senha' }));
    await act(async () => undefined);

    expect(post).toHaveBeenLastCalledWith('/auth/reset-password', { login: '529.982.247-25', code: '123456', password: 'NovaSenha2026' });
    expect(toast.success).toHaveBeenCalled();
    expect(screen.getByText('Tela de login')).toBeInTheDocument();
  });

  it('não envia quando as senhas não batem', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { message: 'ok' } } as never);
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Enviar código' }));
    await userEvent.type(await screen.findByLabelText('Código de 6 dígitos'), '123456');
    await userEvent.type(screen.getByLabelText('Nova senha'), 'NovaSenha2026');
    await userEvent.type(screen.getByLabelText('Confirme a nova senha'), 'OutraSenha2026');
    await userEvent.click(screen.getByRole('button', { name: 'Redefinir senha' }));
    expect(screen.getByRole('alert')).toHaveTextContent('As senhas não são iguais.');
    expect(post).toHaveBeenCalledTimes(1);
  });
});
