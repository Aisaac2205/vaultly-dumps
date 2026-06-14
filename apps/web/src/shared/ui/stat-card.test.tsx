import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  it('renders with positive trend using BadgeDot', () => {
    render(
      <StatCard label="Total" value="42" trend={{ value: 12, positive: true }} />,
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();

    const trendEl = screen.getByText(/↑ 12%/);
    expect(trendEl).toBeInTheDocument();
    // Should NOT use the old tinted-pill class
    expect(trendEl.className).not.toContain('bg-success-bg');
  });

  it('renders with negative trend using BadgeDot', () => {
    render(
      <StatCard label="Errors" value="3" trend={{ value: 5, positive: false }} />,
    );

    const trendEl = screen.getByText(/↓ 5%/);
    expect(trendEl).toBeInTheDocument();
    expect(trendEl.className).not.toContain('bg-error-bg');
  });

  it('renders loading skeleton', () => {
    render(<StatCard label="Loading" value="--" loading />);

    // Skeleton elements should be present (they don't have accessible text,
    // but the card wrapper should still exist)
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  });
});
