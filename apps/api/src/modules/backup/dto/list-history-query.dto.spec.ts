import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ListHistoryQueryDto } from './list-history-query.dto';
import { Environment } from '../../../database/enums/environment.enum';
import { JobStatus } from '../../../database/enums/job-status.enum';

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

  it('passes validation with all filter params', async () => {
    const dto = plainToInstance(ListHistoryQueryDto, {
      connectionId: 'conn-1',
      environment: 'prod',
      status: 'completed',
      from: '2026-06-16T22:38:15Z',
      to: '2026-06-17T22:38:15Z',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.connectionId).toBe('conn-1');
    expect(dto.environment).toBe(Environment.PROD);
    expect(dto.status).toBe(JobStatus.COMPLETED);
  });

  it('fails validation with invalid environment', async () => {
    const dto = plainToInstance(ListHistoryQueryDto, { environment: 'invalid-env' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('environment');
  });

  it('fails validation with invalid status', async () => {
    const dto = plainToInstance(ListHistoryQueryDto, { status: 'invalid-status' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('status');
  });

  it('fails validation with invalid date string', async () => {
    const dto = plainToInstance(ListHistoryQueryDto, { from: 'not-a-date' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('from');
  });
});
