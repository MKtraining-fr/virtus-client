import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from './Input';

describe('Input', () => {
  it('devrait afficher le label', () => {
    render(<Input label="Email" id="email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it("devrait associer le label à l'input", () => {
    render(<Input label="Email" id="email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'email');
  });

  it('devrait permettre la saisie de texte', async () => {
    const user = userEvent.setup();
    render(<Input label="Email" id="email" />);

    const input = screen.getByLabelText('Email');
    await user.type(input, 'test@example.com');

    expect(input).toHaveValue('test@example.com');
  });

  it('devrait appeler onChange quand le texte change', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Input label="Email" id="email" onChange={handleChange} />);
    const input = screen.getByLabelText('Email');

    await user.type(input, 'a');

    expect(handleChange).toHaveBeenCalled();
  });

  it("devrait afficher le message d'erreur", () => {
    render(<Input label="Email" id="email" error="Email invalide" />);
    expect(screen.getByText('Email invalide')).toBeInTheDocument();
  });

  it('devrait avoir une bordure rouge quand error est fourni', () => {
    render(<Input label="Email" id="email" error="Email invalide" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveClass('border-red-500');
  });

  it('devrait être désactivé quand disabled est true', () => {
    render(<Input label="Email" id="email" disabled />);
    expect(screen.getByLabelText('Email')).toBeDisabled();
  });

  it('devrait avoir un placeholder', () => {
    render(<Input label="Email" id="email" placeholder="Entrez votre email" />);
    expect(screen.getByPlaceholderText('Entrez votre email')).toBeInTheDocument();
  });
});
