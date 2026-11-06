/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DirectionUnknownWelcome } from '@/components/member/DirectionUnknownWelcome';

describe('DirectionUnknownWelcome', () => {
  it('compact variant shows exploration copy and single CTA', () => {
    const onPrimary = vi.fn();
    render(<DirectionUnknownWelcome variant="compact" onPrimary={onPrimary} />);

    expect(screen.getByText('Exploración')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Explora lo que es importante para ti' })).toBeTruthy();
    expect(screen.getByText(/Empecemos por experiencias/)).toBeTruthy();
    expect(screen.queryByText('Elegir otra forma de empezar')).toBeNull();
    expect(screen.queryByText(/cuestionario/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Empezar a explorar/ }));
    expect(onPrimary).toHaveBeenCalledOnce();
  });

  it('wizard variant can offer secondary exit', () => {
    const onSecondary = vi.fn();
    render(
      <DirectionUnknownWelcome variant="wizard" onPrimary={vi.fn()} onSecondary={onSecondary} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Elegir otra forma de empezar' }));
    expect(onSecondary).toHaveBeenCalledOnce();
  });
});
