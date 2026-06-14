# Spec: audit-api (delta)

## Purpose

Audit API list endpoints. This delta adds server-side pagination, introduces a pagination query DTO (audit has no DTOs yet), and updates the repository to support paginated queries.

## MODIFIED Requirements

### Requirement: Paginated Audit Logs Endpoint

`GET /audit` MUST accept `page` and `pageSize` query parameters and return a paginated response.

- Query params are validated via `ListAuditLogsQueryDto`.
- Response shape is `{ data: AuditLogEntity[], total: number, page: number, pageSize: number }`.
- Existing `AuditFilters` (userId, username, environment, resourceType, from, to) remain supported and are combined with pagination.

(Previously: `GET /audit` returned `AuditLogEntity[]` directly with no pagination; `AuditFilters` were the only query params)

#### Scenario: Paginated audit request
- **WHEN** a request is made to `GET /audit?page=1&pageSize=25`
- **THEN** the response contains a wrapped paginated result with 25 items

#### Scenario: Paginated audit with filters
- **WHEN** a request is made to `GET /audit?page=2&pageSize=10&environment=PROD`
- **THEN** the response is filtered by `environment=PROD` and paginated to page 2, size 10

#### Scenario: Default pagination
- **WHEN** a request is made to `GET /audit` without query params
- **THEN** the response uses `page=1` and `pageSize=25` with no additional filters

#### Scenario: Invalid page size
- **WHEN** a request is made with `pageSize=200`
- **THEN** the backend returns `400 Bad Request`

#### Scenario: Empty audit logs
- **WHEN** a request is made and no audit logs exist
- **THEN** the response contains `data: []`, `total: 0`, `page: 1`, `pageSize: 25`

### Requirement: Paginated Audit Repository

`AuditRepository.findAll` MUST support pagination via `skip` and `take` options.

- The method signature changes to accept `pagination` (optional) alongside existing `filters`.
- When pagination is provided, it uses `skip: (page - 1) * pageSize` and `take: pageSize`.
- When pagination is omitted, it returns all rows (backward compatibility).

(Previously: `findAll(filters?: AuditFilters)` returned all rows unconditionally via `this.repository.find({ where, order: { createdAt: 'DESC' } })`)

#### Scenario: Paginated repository query
- **WHEN** `findAll(filters, { page: 2, pageSize: 10 })` is called
- **THEN** the repository queries with `skip: 10`, `take: 10`, `where` from filters, and `order: { createdAt: 'DESC' }`

#### Scenario: Unpaginated repository query
- **WHEN** `findAll(filters)` is called without pagination
- **THEN** the repository returns all filtered rows (backward compatibility)

## ADDED Requirements

### Requirement: ListAuditLogsQueryDto

A `ListAuditLogsQueryDto` class MUST be created in `apps/api/src/modules/audit/dto/`.

- Properties: `page` (number, optional, default 1, min 1), `pageSize` (number, optional, default 25, min 1, max 100).
- Existing filter fields (`userId`, `username`, `environment`, `resourceType`, `from`, `to`) are either included in this DTO or composed alongside it.
- Validated with `@IsInt`, `@Min`, `@Max`, `@IsOptional`, `@Type(() => Number)`.

#### Scenario: Valid DTO with pagination
- **WHEN** a request with `page=1&pageSize=50` is received
- **THEN** the DTO passes validation and the controller receives `{ page: 1, pageSize: 50 }`

#### Scenario: Valid DTO with filters and pagination
- **WHEN** a request with `page=1&pageSize=25&environment=PROD` is received
- **THEN** the DTO passes validation and the controller receives `{ page: 1, pageSize: 25, environment: 'PROD' }`

#### Scenario: Invalid DTO
- **WHEN** a request with `page=0&pageSize=200` is received
- **THEN** the DTO fails validation and a `400 Bad Request` is returned

### Requirement: Pagination Query DTO in Audit Module

The audit module, which currently has no DTO files, MUST add a `dto/` directory with `list-audit-logs.query.dto.ts` (or equivalent naming) and a re-export barrel.

#### Scenario: DTO file exists
- **WHEN** the audit module is inspected
- **THEN** `apps/api/src/modules/audit/dto/` contains the pagination query DTO

## REMOVED Requirements

### Requirement: Implicit Return All Audit Rows

(Reason: The audit list endpoint now requires pagination; `findAll` with no pagination is retained for backward compatibility on other endpoints)

The `GET /audit` endpoint no longer returns all rows implicitly. It MUST use `take` and `skip`.

#### Scenario: No implicit full return on audit
- **WHEN** the audit endpoint is called
- **THEN** it always uses `take` and `skip` in the repository query
