import React, { useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { vi } from 'vitest';
import { CepField } from './CepField';
import * as address from '../services/address';

const GRACAS = { cep: '52050-000', street: 'Rua das Graças', neighborhood: 'Graças', city: 'Recife', state: 'PE', latitude: -8.04, longitude: -34.9, precision: 'bairro' as const };

/** Types and then lets the pending CEP lookup settle inside act(). */
async function type(input: HTMLElement, text: string) {
  await userEvent.type(input, text);
  await act(async () => undefined);
}

function Harness({ onResolved }: { onResolved: (a: unknown) => void }) {
  const [value, setValue] = useState('');
  return <CepField value={value} onChange={setValue} onResolved={onResolved} />;
}

describe('CepField — endereço pelo CEP (US-14)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aplica a máscara e busca o endereço ao completar 8 dígitos', async () => {
    const lookup = vi.spyOn(address, 'lookupCep').mockResolvedValue(GRACAS);
    const onResolved = vi.fn();
    render(<Harness onResolved={onResolved} />);

    const input = screen.getByLabelText('CEP');
    await type(input, '5205000');
    expect(input).toHaveValue('52050-00');
    expect(lookup).not.toHaveBeenCalled();

    await type(input, '0');
    expect(input).toHaveValue('52050-000');
    expect(await screen.findByRole('status')).toHaveTextContent('Rua das Graças · Graças, Recife – PE');
    expect(lookup).toHaveBeenCalledWith('52050000');
    expect(onResolved).toHaveBeenLastCalledWith(GRACAS);
  });

  it('mostra a mensagem da API quando o CEP não existe', async () => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    vi.spyOn(address, 'lookupCep').mockRejectedValue(
      new AxiosError('404', '404', config, {}, { status: 404, data: { message: 'CEP não encontrado.' }, statusText: '', headers: {}, config }),
    );
    const onResolved = vi.fn();
    render(<Harness onResolved={onResolved} />);
    await type(screen.getByLabelText('CEP'), '00000000');
    expect(await screen.findByText('CEP não encontrado.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(onResolved).toHaveBeenLastCalledWith(null);
  });

  it('limpa o endereço quando o CEP fica incompleto', async () => {
    vi.spyOn(address, 'lookupCep').mockResolvedValue(GRACAS);
    render(<Harness onResolved={vi.fn()} />);
    const input = screen.getByLabelText('CEP');
    await type(input, '52050000');
    await screen.findByRole('status');
    await type(input, '{backspace}');
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });
});
