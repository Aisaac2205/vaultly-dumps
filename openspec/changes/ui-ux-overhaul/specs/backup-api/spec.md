# Spec: backup-api (delta)

## Purpose

Backup API list endpoints. This delta adds server-side pagination to the history endpoint, introduces a pagination query DTO, and updates the repository to support paginated queries.

## MODIFIED Requirements

### Requirement: Paginated History Endpoint

`GET /backups/history` MUST accept `page` and `pageSize` query parameters and return a paginated response.

- Query params are validated via `ListHistoryQueryDto`.
- Response shape is `{ data: BackupHistoryItem[], total: number, page: number, pageSize: number }`.

(Previously: `GET /backups/history` returned `BackupHistoryItem[]` with no pagination)

#### Scenario: Paginated history request
- **WHEN** a request is made to `GET /backups/history?page=1&pageSize=25`
- **THEN** the response contains a wrapped paginated result with 25 items

#### Scenario: Default pagination
- **WHEN** a request is made to `GET /backups/history` without query params
- **THEN** the response uses `page=1` and `pageSize=25`

#### Scenario: Invalid page size
- **WHEN** a request is made with `pageSize=200`
- **THEN** the backend returns `400 Bad Request`

#### Scenario: Empty history
- **WHEN** a request is made and no history exists
- **THEN** the response contains `data: []`, `total: 0`, `page: 1`, `pageSize: 25`

### Requirement: Paginated Repository

`BackupRepository.findAll` MUST support pagination via `skip` and `take` options.

- The method accepts optional `page` and `pageSize` parameters.
- When pagination is provided, it uses `skip: (page - 1) * pageSize` and `take: pageSize`.
- When pagination is omitted, it returns all rows (backward compatibility for non-list endpoints).

(Previously: `findAll()` returned all rows unconditionally via `this.repository.find({ order: { createdAt: 'DESC' } })`)

#### Scenario: Paginated repository query
- **WHEN** `findAll({ page: 2, pageSize: 10 })` is called
- **THEN** the repository queries with `skip: 10`, `take: 10`, and `order: { createdAt: 'DESC' }`

#### Scenario: Unpaginated repository query
- **WHEN** `findAll()` is called without arguments
- **THEN** the repository returns all rows (for backward compatibility)

## ADDED Requirements

### Requirement: ListHistoryQueryDto

A `ListHistoryQueryDto` class MUST be created in `apps/api/src/modules/backup/dto/`.

- Properties: `page` (number, optional, default 1, min 1) and `pageSize` (number, optional, default 25, min 1, max 100).
- Validated with `@IsInt`, `@Min`, `@Max`, `@IsOptional`, `@Type(() => Number)`.

#### Scenario: Valid DTO
- **WHEN** a request with `page=2&pageSize=50` is received
- **THEN** the DTO passes validation and the controller receives `{ page: 2, pageSize: 50 }`

#### Scenario: Invalid DTO
- **WHEN** a request with `page=0&pageSize=200` is received
- **THEN** the DTO fails validation and a `400 Bad Request` is returned

## REMOVED Requirements

### Requirement: Implicit Return All Rows

(Reason: The history endpoint now requires pagination; `findAll` with no args is retained for backward compatibility on other endpoints)

The `GET /backups/history` endpoint no longer returns all rows implicitly. It MUST use `take` and `skip`.

#### Scenario: No implicit full return on history
- **WHEN** the history endpoint is called
- **THEN** it always uses `take` and `skip` in the repository query
