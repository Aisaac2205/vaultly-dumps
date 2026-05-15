export type BackupCategory =
  | 'manual'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'custom';

export type CronFrequency = 'hourly' | 'daily' | 'weekly' | 'custom';

export type BackupTrigger = 'cron' | 'manual';

export const BACKUP_CATEGORIES: readonly BackupCategory[] = [
  'manual',
  'hourly',
  'daily',
  'weekly',
  'custom',
] as const;

export const CRON_FREQUENCIES: readonly CronFrequency[] = [
  'hourly',
  'daily',
  'weekly',
  'custom',
] as const;
