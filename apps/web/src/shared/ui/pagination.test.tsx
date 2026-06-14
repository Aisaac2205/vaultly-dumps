import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from './pagination';

describe('Pagination', () => {
  it('renders page numbers with correct aria labels', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink isActive>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    expect(screen.getByLabelText('Ir a la página anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Ir a la página siguiente')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('marks active page with aria-current', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink isActive>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>2</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    const activeLink = screen.getByText('1');
    expect(activeLink).toHaveAttribute('aria-current', 'page');

    const inactiveLink = screen.getByText('2');
    expect(inactiveLink).not.toHaveAttribute('aria-current');
  });

  it('calls onClick when page link is clicked', () => {
    const handler: Mock<(...args: never[]) => void> = vi.fn();

    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink onClick={handler}>5</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    fireEvent.click(screen.getByText('5'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('disables previous button when specified', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious disabled />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    const prevButton = screen.getByLabelText('Ir a la página anterior');
    expect(prevButton).toBeDisabled();
  });

  it('renders ellipsis', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>10</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    // Ellipsis renders the MoreHorizontal icon (hidden from screen readers)
  });

  it('renders with custom labels', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious label="Prev" />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext label="Next" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    expect(screen.getByText('Prev')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });
});
