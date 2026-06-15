import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ListAuditLogsQueryDto } from './list-audit-logs-query.dto';
import { Environment } from '../../../database/enums/environment.enum';

describe('ListAuditLogsQueryDto', () => {
  it('passes validation with default params', async () => {
    const dto = plainToInstance(ListAuditLogsQueryDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes validation with custom page and pageSize', async () => {
    const dto = plainToInstance(ListAuditLogsQueryDto, {
      page: '2',
      pageSize: '50',
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(50);
  });

  it('passes validation with filters and pagination', async () => {
    const dto = plainToInstance(ListAuditLogsQueryDto, {
      page: '1',
      pageSize: '25',
      environment: 'prod',
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.environment).toBe(Environment.PROD);
  });

  it('passes validation with date strings', async () => {
    const dto = plainToInstance(ListAuditLogsQueryDto, {
      from: '2024-01-01',
      to: '2024-12-31',
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('fails validation when pageSize exceeds 100', async () => {
    const dto = plainToInstance(ListAuditLogsQueryDto, { pageSize: '200' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('pageSize');
  });

  it('fails validation when page is less than 1', async () => {
    const dto = plainToInstance(ListAuditLogsQueryDto, { page: '0' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
  });

  it('fails validation with invalid environment enum', async () => {
    const dto = plainToInstance(ListAuditLogsQueryDto, {
      environment: 'invalid_env',
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('environment');
  });

  it('fails validation with malformed date string', async () => {
    const dto = plainToInstance(ListAuditLogsQueryDto, { from: 'not-a-date' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('from');
  });
});
