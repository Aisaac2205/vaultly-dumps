import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './sheet';

describe('Sheet', () => {
  it('renders content when trigger is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Test Sheet</SheetTitle>
            <SheetDescription>Sheet description</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.queryByText('Test Sheet')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open Sheet' }));

    expect(screen.getByText('Test Sheet')).toBeInTheDocument();
    expect(screen.getByText('Sheet description')).toBeInTheDocument();
  });

  it('renders close button by default', async () => {
    const user = userEvent.setup();

    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>Content</SheetContent>
      </Sheet>,
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));

    const closeButton = screen.getByRole('button', { name: 'Close' });
    expect(closeButton).toBeInTheDocument();
  });

  it('hides close button when showCloseButton is false', async () => {
    const user = userEvent.setup();

    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent showCloseButton={false}>Content</SheetContent>
      </Sheet>,
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('renders with specified side prop', async () => {
    const user = userEvent.setup();

    render(
      <Sheet>
        <SheetTrigger>Open Left</SheetTrigger>
        <SheetContent side="left">Left content</SheetContent>
      </Sheet>,
    );

    await user.click(screen.getByRole('button', { name: 'Open Left' }));

    expect(screen.getByText('Left content')).toBeInTheDocument();
  });
});
