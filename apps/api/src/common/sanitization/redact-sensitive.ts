export type JsonPrimitive = string | number | boolean | null | undefined;

export type JsonArray = JsonValue[];

export interface JsonRecord {
  [key: string]: JsonValue;
}

export type JsonValue = JsonPrimitive | JsonArray | JsonRecord;

const SENSITIVE_KEY_PATTERNS: readonly RegExp[] = [
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /access[_-]?key/i,
  /authorization/i,
  /credential/i,
  /private[_-]?key/i,
];

const REDACTED = '[REDACTED]';

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function isJsonRecord(value: JsonValue): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function redactSensitive<T extends JsonValue>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item: JsonValue) => redactSensitive(item)) as T;
  }

  if (isJsonRecord(value)) {
    const redacted: JsonRecord = {};
    for (const [key, entry] of Object.entries(value)) {
      redacted[key] = isSensitiveKey(key) ? REDACTED : redactSensitive(entry);
    }
    return redacted as T;
  }

  return value;
}
