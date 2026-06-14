import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './card';

describe('Card', () => {
  it('renders elevated variant with shadow', () => {
    render(<Card variant="elevated">Content</Card>);
    const card = screen.getByText('Content');
    expect(card.className).toContain('shadow-md');
    expect(card.className).not.toContain('border');
  });

  it('renders outlined variant with border', () => {
    render(<Card variant="outlined">Content</Card>);
    const card = screen.getByText('Content');
    expect(card.className).toContain('border');
  });

  it('renders subtle variant with muted background', () => {
    render(<Card variant="subtle">Content</Card>);
    const card = screen.getByText('Content');
    expect(card.className).toContain('bg-muted');
    expect(card.className).not.toContain('shadow-md');
  });

  it('renders default variant without shadow or border', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content');
    expect(card.className).not.toContain('shadow-md');
    expect(card.className).not.toContain('shadow-sm');
    expect(card.className).not.toContain('border');
  });
});
