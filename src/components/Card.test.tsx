import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  it('devrait afficher le contenu', () => {
    render(<Card>Contenu de la carte</Card>);
    expect(screen.getByText('Contenu de la carte')).toBeInTheDocument();
  });

  it('devrait avoir les classes de base', () => {
    const { container } = render(<Card>Contenu</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('shadow-md');
  });

  it('devrait appliquer les classes personnalisées', () => {
    const { container } = render(<Card className="custom-class">Contenu</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
  });

  it('devrait être cliquable quand onClick est fourni', () => {
    const { container } = render(<Card onClick={() => {}}>Contenu</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('cursor-pointer');
  });
});
