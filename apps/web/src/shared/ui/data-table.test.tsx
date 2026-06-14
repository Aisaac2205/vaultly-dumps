import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable, type Column } from './data-table';

interface SampleRow {
  id: number;
  name: string;
}

const columns: Column<SampleRow>[] = [
  { header: 'ID', accessor: (row) => row.id },
  { header: 'Name', accessor: (row) => row.name },
];

const data: SampleRow[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
];

describe('DataTable', () => {
  it('renders columns and rows', () => {
    render(<DataTable columns={columns} data={data} />);

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows empty message when data is empty', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Sin resultados" />);

    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('renders skeletons when loading', () => {
    render(<DataTable columns={columns} data={[]} loading />);

    // Skeletons are rendered (5 rows of skeleton divs)
    const skeletons = document.querySelectorAll('[class*="h-4 w-full"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders pagination slot when provided', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        pagination={<div>Page 1 of 10</div>}
      />,
    );

    expect(screen.getByText('Page 1 of 10')).toBeInTheDocument();
  });

  it('renders pagination slot in loading state', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        loading
        pagination={<div>Loading pagination</div>}
      />,
    );

    expect(screen.getByText('Loading pagination')).toBeInTheDocument();
  });
});
