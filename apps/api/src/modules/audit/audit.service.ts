import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditRepository, AuditFilters } from './audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async getLogs(filters?: AuditFilters) {
    return this.repository.findAll(filters);
  }

  async getLogById(id: string) {
    const log = await this.repository.findById(id);
    if (!log) {
      throw new NotFoundException(`Audit log con ID "${id}" no encontrado`);
    }
    return log;
  }
}
