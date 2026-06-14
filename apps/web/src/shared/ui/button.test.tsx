import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders correctly with given text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handler: Mock<(...args: never[]) => void> = vi.fn();
    render(<Button onClick={handler}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button', { name: 'Click me' }));
    
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('has press feedback classes for active state', () => {
    render(<Button>Press me</Button>);
    const button = screen.getByRole('button', { name: 'Press me' });

    expect(button.className).toContain('active:scale-[0.97]');
    expect(button.className).toContain('transition-[transform,color,background-color,border-color]');
  });
});