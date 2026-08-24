const REDACTED_TOKEN = '[REDACTED]';
const MAX_MESSAGE_LENGTH = 500;

const CONNECTION_URI_PATTERN = /\b(?:postgresql|postgres|mysql):\/\/\S+/gi;
const CREDENTIAL_FIELD_PATTERN = /\b(?:username|user|dbname|database)\s*[:=]\s*\S+/gi;
const HOST_PORT_FIELD_PATTERN = /\b(?:host|port)\s*[:=]\s*\S+/gi;
const HOST_PORT_TARGET_PATTERN = /\b(?:(?:\d{1,3}\.){3}\d{1,3}|[a-zA-Z][\w.-]*):\d{2,5}\b/g;
const IPV4_PATTERN = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const WINDOWS_PATH_PATTERN = /\b[A-Za-z]:[\\/][^\s]*/g;
const POSIX_PATH_PATTERN = /\B\/(?:[\w.-]+\/)+[\w.-]+\b/g;

export function sanitizeMessage(message: string): string {
  const firstLine = message.split('\n')[0];

  return firstLine
    .replace(/password\s*[:=]\s*\S+/gi, 'password=***')
    .replace(/PGPASSWORD\s*[:=]\s*\S+/gi, 'PGPASSWORD=***')
    .replace(/MYSQL_PWD\s*[:=]\s*\S+/gi, 'MYSQL_PWD=***')
    .replace(CONNECTION_URI_PATTERN, REDACTED_TOKEN)
    .replace(CREDENTIAL_FIELD_PATTERN, REDACTED_TOKEN)
    .replace(HOST_PORT_FIELD_PATTERN, REDACTED_TOKEN)
    .replace(HOST_PORT_TARGET_PATTERN, REDACTED_TOKEN)
    .replace(IPV4_PATTERN, REDACTED_TOKEN)
    .replace(WINDOWS_PATH_PATTERN, REDACTED_TOKEN)
    .replace(POSIX_PATH_PATTERN, REDACTED_TOKEN)
    .slice(0, MAX_MESSAGE_LENGTH);
}
