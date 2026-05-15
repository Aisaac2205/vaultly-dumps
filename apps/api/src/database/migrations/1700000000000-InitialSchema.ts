import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
    name = 'InitialSchema1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // uuid-ossp provee uuid_generate_v4() para los PRIMARY KEY uuid de cada tabla.
        // IF NOT EXISTS hace este statement idempotente para entornos que ya la tenían
        // instalada (ej. prod legacy donde synchronize: true la activó en su momento).
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TYPE "public"."restore_jobs_targetenvironment_enum" AS ENUM('prod', 'dev', 'sqa')`);
        await queryRunner.query(`CREATE TYPE "public"."restore_jobs_status_enum" AS ENUM('pending', 'running', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "restore_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sourceBackupId" character varying, "r2Key" character varying, "targetConnectionId" character varying NOT NULL, "targetEnvironment" "public"."restore_jobs_targetenvironment_enum" NOT NULL, "status" "public"."restore_jobs_status_enum" NOT NULL DEFAULT 'pending', "isDryRun" boolean NOT NULL DEFAULT false, "startedAt" TIMESTAMP NOT NULL, "completedAt" TIMESTAMP, "errorMessage" text, "triggeredBy" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c315e48b7f0d319fc3ca3c8336c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."cronjobs_frequency_enum" AS ENUM('hourly', 'daily', 'weekly', 'custom')`);
        await queryRunner.query(`CREATE TYPE "public"."cronjobs_laststatus_enum" AS ENUM('pending', 'running', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "cronjobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "connectionId" character varying NOT NULL, "cronExpression" character varying NOT NULL, "frequency" "public"."cronjobs_frequency_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "lastRunAt" TIMESTAMP, "nextRunAt" TIMESTAMP, "lastStatus" "public"."cronjobs_laststatus_enum", "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b74e9d94eba10e8375cd33ed454" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."backup_jobs_environment_enum" AS ENUM('prod', 'dev', 'sqa')`);
        await queryRunner.query(`CREATE TYPE "public"."backup_jobs_dbtype_enum" AS ENUM('postgres', 'mysql')`);
        await queryRunner.query(`CREATE TYPE "public"."backup_jobs_status_enum" AS ENUM('pending', 'running', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TYPE "public"."backup_jobs_category_enum" AS ENUM('manual', 'hourly', 'daily', 'weekly', 'custom')`);
        await queryRunner.query(`CREATE TABLE "backup_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "connectionId" character varying NOT NULL, "environment" "public"."backup_jobs_environment_enum" NOT NULL, "dbType" "public"."backup_jobs_dbtype_enum", "status" "public"."backup_jobs_status_enum" NOT NULL DEFAULT 'pending', "fileKey" character varying, "storageKeyVersion" integer NOT NULL DEFAULT '1', "category" "public"."backup_jobs_category_enum", "fileSizeMb" double precision, "startedAt" TIMESTAMP, "completedAt" TIMESTAMP, "errorMessage" text, "triggeredBy" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d63aa10bc561df545b6532201c6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_environment_enum" AS ENUM('prod', 'dev', 'sqa')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying NOT NULL, "userId" character varying NOT NULL, "username" character varying NOT NULL, "resourceType" character varying NOT NULL, "resourceId" character varying NOT NULL, "metadata" jsonb, "environment" "public"."audit_logs_environment_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."connections_environment_enum" AS ENUM('prod', 'dev', 'sqa')`);
        await queryRunner.query(`CREATE TYPE "public"."connections_dbtype_enum" AS ENUM('postgres', 'mysql')`);
        await queryRunner.query(`CREATE TABLE "connections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying(120) NOT NULL, "environment" "public"."connections_environment_enum" NOT NULL, "dbType" "public"."connections_dbtype_enum" NOT NULL DEFAULT 'postgres', "host" character varying NOT NULL, "port" integer NOT NULL, "database" character varying NOT NULL, "username" character varying NOT NULL, "password" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0a1f844af3122354cbd487a8d03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_connections_slug_unique" ON "connections" ("slug") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_connections_slug_unique"`);
        await queryRunner.query(`DROP TABLE "connections"`);
        await queryRunner.query(`DROP TYPE "public"."connections_dbtype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."connections_environment_enum"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_environment_enum"`);
        await queryRunner.query(`DROP TABLE "backup_jobs"`);
        await queryRunner.query(`DROP TYPE "public"."backup_jobs_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."backup_jobs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."backup_jobs_dbtype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."backup_jobs_environment_enum"`);
        await queryRunner.query(`DROP TABLE "cronjobs"`);
        await queryRunner.query(`DROP TYPE "public"."cronjobs_laststatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cronjobs_frequency_enum"`);
        await queryRunner.query(`DROP TABLE "restore_jobs"`);
        await queryRunner.query(`DROP TYPE "public"."restore_jobs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."restore_jobs_targetenvironment_enum"`);
    }

}
