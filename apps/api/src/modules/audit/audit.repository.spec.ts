import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditRepository, AuditFilters } from './audit.repository';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { Environment } from '../../database/enums/environment.enum';

type MockRepo = Partial<Record<keyof Repository<AuditLogEntity>, jest.Mock>>;

describe('AuditRepository', () => {
  let auditRepo: AuditRepository;
  let mockRepo: MockRepo;

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditRepository,
        {
          provide: getRepositoryToken(AuditLogEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    auditRepo = module.get<AuditRepository>(AuditRepository);
  });

  describe('findAll — paginated with filters', () => {
    it('uses findAndCount with where clause and pagination', async () => {
      const filters: AuditFilters = { environment: Environment.PROD };
      const logs = [{ id: '1' }] as AuditLogEntity[];
      mockRepo.findAndCount!.mockResolvedValue([logs, 5]);

      const result = await auditRepo.findAll(filters, { page: 1, pageSize: 10 });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith({
        where: { environment: Environment.PROD },
        order: { createdAt: 'DESC' },
        take: 10,
        skip: 0,
      });
      expect(result).toEqual({ data: logs, total: 5 });
    });

    it('handles date range filters with pagination', async () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-12-31');
      const filters: AuditFilters = { from, to };
      mockRepo.findAndCount!.mockResolvedValue([[], 0]);

      await auditRepo.findAll(filters, { page: 1, pageSize: 25 });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdAt: Between(from, to) },
          take: 25,
          skip: 0,
        }),
      );
    });

    it('computes skip for page > 1', async () => {
      mockRepo.findAndCount!.mockResolvedValue([[], 0]);

      await auditRepo.findAll({}, { page: 3, pageSize: 25 });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 50, take: 25 }),
      );
    });

    it('returns empty data with zero total', async () => {
      mockRepo.findAndCount!.mockResolvedValue([[], 0]);

      const result = await auditRepo.findAll({}, { page: 1, pageSize: 25 });

      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe('findAll — unpaginated (backward compat)', () => {
    it('returns all rows when pagination is omitted', async () => {
      const logs = [{ id: 'a' }, { id: 'b' }] as AuditLogEntity[];
      mockRepo.find!.mockResolvedValue(logs);

      const result = await auditRepo.findAll({ userId: 'user-1' });

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
      expect(mockRepo.findAndCount).not.toHaveBeenCalled();
      expect(result).toEqual({ data: logs, total: 2 });
    });

    it('returns all rows with no filters and no pagination', async () => {
      const logs = Array.from({ length: 150 }, (_, i) => ({ id: String(i) })) as AuditLogEntity[];
      mockRepo.find!.mockResolvedValue(logs);

      const result = await auditRepo.findAll();

      expect(result.data).toHaveLength(150);
      expect(result.total).toBe(150);
    });
  });
});
