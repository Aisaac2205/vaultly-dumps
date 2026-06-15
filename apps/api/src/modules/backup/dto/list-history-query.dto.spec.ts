import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ListHistoryQueryDto } from './list-history-query.dto';

describe('ListHistoryQueryDto', () => {
  it('passes validation with valid default params', async () => {
    const dto = plainToInstance(ListHistoryQueryDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes validation with custom page and pageSize', async () => {
    const dto = plainToInstance(ListHistoryQueryDto, { page: '2', pageSize: '50' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(50);
  });

  it('applies default values when fields are missing', async () => {
    const dto = plainToInstance(ListHistoryQueryDto, {});
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(25);
  });

  it('fails validation when page is less than 1', async () => {
    const dto = plainToInstance(ListHistoryQueryDto, { page: '0' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
  });

  it('fails validation when pageSize exceeds 100', async () => {
    const dto = plainToInstance(ListHistoryQueryDto, { pageSize: '200' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('pageSize');
  });
});
