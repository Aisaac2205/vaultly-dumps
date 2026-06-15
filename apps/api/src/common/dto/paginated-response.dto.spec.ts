import { PaginatedResponseDto } from './paginated-response.dto';

interface TestItem {
  id: string;
  name: string;
}

interface AnotherItem {
  timestamp: number;
  value: string;
}

describe('PaginatedResponseDto', () => {
  it('constructs with TestItem type', () => {
    const items: TestItem[] = [
      { id: '1', name: 'alpha' },
      { id: '2', name: 'beta' },
    ];
    const dto = new PaginatedResponseDto<TestItem>(items, 42, 2, 10);

    expect(dto.data).toEqual(items);
    expect(dto.total).toBe(42);
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(10);
  });

  it('constructs with AnotherItem type (different shape)', () => {
    const items: AnotherItem[] = [
      { timestamp: 1700000000, value: 'x' },
    ];
    const dto = new PaginatedResponseDto<AnotherItem>(items, 1, 1, 25);

    expect(dto.data).toEqual(items);
    expect(dto.total).toBe(1);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(25);
  });

  it('handles empty data array', () => {
    const dto = new PaginatedResponseDto<string>([], 0, 1, 25);

    expect(dto.data).toEqual([]);
    expect(dto.total).toBe(0);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(25);
  });
});
