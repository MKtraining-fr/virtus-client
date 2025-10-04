import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('devrait afficher le texte du bouton', () => {
    render(<Button>Cliquez-moi</Button>);
    expect(screen.getByText('Cliquez-moi')).toBeInTheDocument();
  });

  it('devrait appeler onClick quand cliqué', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Cliquez-moi</Button>);
    await user.click(screen.getByText('Cliquez-moi'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('devrait être désactivé quand disabled est true', () => {
    render(<Button disabled>Cliquez-moi</Button>);
    expect(screen.getByText('Cliquez-moi')).toBeDisabled();
  });

  it('devrait afficher le spinner quand isLoading est true', () => {
    render(<Button isLoading>Cliquez-moi</Button>);
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
    expect(screen.queryByText('Cliquez-moi')).not.toBeInTheDocument();
  });

  it('devrait être désactivé quand isLoading est true', () => {
    render(<Button isLoading>Cliquez-moi</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('devrait avoir aria-label quand fourni', () => {
    render(<Button ariaLabel="Supprimer l'élément">X</Button>);
    expect(screen.getByLabelText('Supprimer l\'élément')).toBeInTheDocument();
  });

  it('devrait avoir aria-busy=true quand isLoading est true', () => {
    render(<Button isLoading>Cliquez-moi</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('devrait appliquer la classe variant primary par défaut', () => {
    render(<Button>Cliquez-moi</Button>);
    const button = screen.getByText('Cliquez-moi');
    expect(button).toHaveClass('bg-primary');
  });

  it('devrait appliquer la classe variant secondary', () => {
    render(<Button variant="secondary">Cliquez-moi</Button>);
    const button = screen.getByText('Cliquez-moi');
    expect(button).toHaveClass('bg-white');
  });

  it('devrait appliquer la classe variant danger', () => {
    render(<Button variant="danger">Supprimer</Button>);
    const button = screen.getByText('Supprimer');
    expect(button).toHaveClass('bg-red-600');
  });
});
