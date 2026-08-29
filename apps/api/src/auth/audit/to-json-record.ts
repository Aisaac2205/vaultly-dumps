import { JsonRecord, JsonValue } from '../../common/sanitization/redact-sensitive';

/**
 * Better Auth types an endpoint body as a loose value because every route
 * declares its own shape. Narrowing it here keeps the cast in one place
 * instead of spreading it across the audit pipeline.
 */
export function toJsonRecord(value: JsonValue | undefined): JsonRecord {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value;
}
