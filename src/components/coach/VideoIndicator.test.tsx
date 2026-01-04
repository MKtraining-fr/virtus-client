import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoIndicator from './VideoIndicator';

describe('VideoIndicator', () => {
  it('ne devrait rien afficher si videoCount est 0', () => {
    const { container } = render(
      <VideoIndicator videoCount={0} unviewedCount={0} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('devrait afficher l\'icône vidéo pour 1 vidéo', () => {
    render(<VideoIndicator videoCount={1} unviewedCount={0} />);

    expect(screen.getByText('📹')).toBeInTheDocument();
  });

  it('devrait afficher le compteur pour plusieurs vidéos', () => {
    render(<VideoIndicator videoCount={3} unviewedCount={0} />);

    expect(screen.getByText('📹')).toBeInTheDocument();
    expect(screen.getByText('×3')).toBeInTheDocument();
  });

  it('devrait afficher la pastille rouge pour vidéos non vues', () => {
    render(<VideoIndicator videoCount={5} unviewedCount={2} />);

    const badge = screen.getByText('2');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-500');
  });

  it('devrait appeler onClick quand cliqué', () => {
    const handleClick = vi.fn();
    render(
      <VideoIndicator 
        videoCount={1} 
        unviewedCount={0} 
        onClick={handleClick} 
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('devrait afficher le tooltip avec les bonnes informations', () => {
    render(<VideoIndicator videoCount={3} unviewedCount={1} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', '3 vidéos disponibles (1 non vue)');
  });

  it('devrait gérer les différentes tailles', () => {
    const { rerender } = render(
      <VideoIndicator videoCount={1} unviewedCount={0} size="sm" />
    );
    expect(screen.getByText('📹').parentElement).toHaveClass('text-sm');

    rerender(<VideoIndicator videoCount={1} unviewedCount={0} size="md" />);
    expect(screen.getByText('📹').parentElement).toHaveClass('text-base');

    rerender(<VideoIndicator videoCount={1} unviewedCount={0} size="lg" />);
    expect(screen.getByText('📹').parentElement).toHaveClass('text-lg');
  });

  it('devrait afficher la pastille pour toutes les vidéos non vues', () => {
    render(<VideoIndicator videoCount={5} unviewedCount={5} />);

    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
  });

  it('ne devrait pas afficher de pastille si toutes les vidéos sont vues', () => {
    render(<VideoIndicator videoCount={3} unviewedCount={0} />);

    expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
  });
});
