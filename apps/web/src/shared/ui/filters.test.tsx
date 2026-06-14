import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Filters } from './filters';

describe('Filters', () => {
  it('renders trigger with filter count when filters are active', () => {
    render(
      <Filters.Root filters={{ search: 'test' }} onFiltersChange={vi.fn()}>
        <Filters.Trigger />
        <Filters.Popover>
          <Filters.Search filterKey="search" label="Buscar" />
        </Filters.Popover>
      </Filters.Root>,
    );

    // Trigger button should show count badge
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows no badge when no filters are active', () => {
    render(
      <Filters.Root filters={{}} onFiltersChange={vi.fn()}>
        <Filters.Trigger />
        <Filters.Popover>
          <Filters.Search filterKey="search" label="Buscar" />
        </Filters.Popover>
      </Filters.Root>,
    );

    // Trigger button should not show a count badge
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    // The trigger renders "Filtros" text
    expect(screen.getByText('Filtros')).toBeInTheDocument();
  });

  it('renders active chips for applied filters', () => {
    render(
      <Filters.Root filters={{ search: 'test', status: 'active' }} onFiltersChange={vi.fn()}>
        <Filters.Trigger />
        <Filters.ActiveChips />
        <Filters.Popover>
          <Filters.Search filterKey="search" label="Buscar" />
        </Filters.Popover>
      </Filters.Root>,
    );

    expect(screen.getByText(/test/)).toBeInTheDocument();
  });

  it('calls onFiltersChange when removing a chip', () => {
    const onChange: (filters: Record<string, string>) => void = vi.fn();

    render(
      <Filters.Root filters={{ search: 'test' }} onFiltersChange={onChange}>
        <Filters.Trigger />
        <Filters.ActiveChips />
        <Filters.Popover>
          <Filters.Search filterKey="search" label="Buscar" />
        </Filters.Popover>
      </Filters.Root>,
    );

    // Find the remove button on the chip and click it
    const removeBtn = screen.getByLabelText(/Eliminar filtro/);
    fireEvent.click(removeBtn);

    expect(onChange).toHaveBeenCalled();
  });

  it('renders select options inside popover', async () => {
    const user = userEvent.setup();

    render(
      <Filters.Root filters={{}} onFiltersChange={vi.fn()}>
        <Filters.Trigger />
        <Filters.Popover>
          <Filters.Select
            filterKey="status"
            label="Estado"
            options={[
              { value: 'active', label: 'Activo' },
              { value: 'inactive', label: 'Inactivo' },
            ]}
          />
        </Filters.Popover>
      </Filters.Root>,
    );

    // Open the popover
    await user.click(screen.getByText('Filtros'));

    // The select trigger should be visible inside the popover
    expect(screen.getByText('Estado')).toBeInTheDocument();
  });
});
