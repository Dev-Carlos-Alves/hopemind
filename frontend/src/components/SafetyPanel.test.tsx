import React from 'react';
import { render, screen } from '@testing-library/react';
import { SafetyPanel } from './SafetyPanel';

const RESOURCES = [
  { name: 'CVV — Centro de Valorização da Vida', detail: 'Ligue 188', href: 'tel:188' },
  { name: 'SAMU', detail: 'Ligue 192', href: 'tel:192' },
  { name: 'Pronto-socorro / UPA', detail: 'Procure a urgência mais próxima.' },
];

describe('SafetyPanel — protocolo de segurança (US-15 / RN-008)', () => {
  it('não aparece quando não há risco', () => {
    const { container } = render(<SafetyPanel safety={{ level: 'NONE', resources: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('em risco imediato mostra os canais de ajuda com links de ligação', () => {
    render(<SafetyPanel safety={{ level: 'IMMEDIATE', resources: RESOURCES }} />);
    expect(screen.getByRole('heading')).toHaveTextContent('Você não precisa passar por isso sozinho(a)');
    expect(screen.getByRole('link', { name: /CVV/ })).toHaveAttribute('href', 'tel:188');
    expect(screen.getByRole('link', { name: /SAMU/ })).toHaveAttribute('href', 'tel:192');
    expect(screen.getByText('Pronto-socorro / UPA').closest('a')).toBeNull();
  });

  it('usa um texto acolhedor para quem só quer conversar', () => {
    render(<SafetyPanel safety={{ level: 'WANTS_TALK', resources: RESOURCES }} />);
    expect(screen.getByRole('heading')).toHaveTextContent('Você pode falar sobre isso com um profissional');
  });
});
