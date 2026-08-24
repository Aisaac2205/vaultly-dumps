import { sanitizeMessage } from './sanitize-message';

describe('sanitizeMessage', () => {
  it('keeps only the first line of a multi-line message', () => {
    const result = sanitizeMessage('first line\nsecond line\nthird line');

    expect(result).toBe('first line');
  });

  it('truncates the message to 500 characters', () => {
    const result = sanitizeMessage('a'.repeat(600));

    expect(result).toHaveLength(500);
  });

  it('masks a password= key-value pair', () => {
    const result = sanitizeMessage('connection failed: password=hunter2 invalid');

    expect(result).toBe('connection failed: password=*** invalid');
  });

  it('masks a PGPASSWORD= key-value pair', () => {
    const result = sanitizeMessage('env dump: PGPASSWORD=hunter2 set');

    expect(result).toBe('env dump: PGPASSWORD=*** set');
  });

  it('masks a MYSQL_PWD= key-value pair', () => {
    const result = sanitizeMessage('env dump: MYSQL_PWD=hunter2 set');

    expect(result).toBe('env dump: MYSQL_PWD=*** set');
  });

  it('masks a postgres:// connection URI with embedded credentials', () => {
    const result = sanitizeMessage(
      'could not connect using postgres://admin:hunter2@10.0.0.5:5432/prod',
    );

    expect(result).toBe('could not connect using [REDACTED]');
  });

  it('masks a postgresql:// connection URI', () => {
    const result = sanitizeMessage('failed: postgresql://db.internal:5432/app');

    expect(result).toBe('failed: [REDACTED]');
  });

  it('masks a mysql:// connection URI with embedded credentials', () => {
    const result = sanitizeMessage('failed: mysql://root:hunter2@127.0.0.1:3306/app');

    expect(result).toBe('failed: [REDACTED]');
  });

  it('masks a user= key-value pair', () => {
    const result = sanitizeMessage('libpq: user=admin connection refused');

    expect(result).toBe('libpq: [REDACTED] connection refused');
  });

  it('masks a username= key-value pair', () => {
    const result = sanitizeMessage('libpq: username=admin connection refused');

    expect(result).toBe('libpq: [REDACTED] connection refused');
  });

  it('masks a dbname= key-value pair', () => {
    const result = sanitizeMessage('libpq: dbname=prod_orders connection refused');

    expect(result).toBe('libpq: [REDACTED] connection refused');
  });

  it('masks a database= key-value pair', () => {
    const result = sanitizeMessage('target database=prod_orders unreachable');

    expect(result).toBe('target [REDACTED] unreachable');
  });

  it('masks a host= key-value pair', () => {
    const result = sanitizeMessage('libpq: host=10.0.0.5 connection refused');

    expect(result).toBe('libpq: [REDACTED] connection refused');
  });

  it('masks a port= key-value pair', () => {
    const result = sanitizeMessage('libpq: port=5432 connection refused');

    expect(result).toBe('libpq: [REDACTED] connection refused');
  });

  it('masks a bare hostname:port target', () => {
    const result = sanitizeMessage("Can't connect to MySQL server on 'db.internal:3306'");

    expect(result).toBe("Can't connect to MySQL server on '[REDACTED]'");
  });

  it('masks a bare IPv4:port target', () => {
    const result = sanitizeMessage("Can't connect to MySQL server on '127.0.0.1:3306'");

    expect(result).toBe("Can't connect to MySQL server on '[REDACTED]'");
  });

  it('masks a standalone IPv4 literal', () => {
    const result = sanitizeMessage('no route to host 192.168.1.42 from worker');

    expect(result).toBe('no route to host [REDACTED] from worker');
  });

  it('masks an absolute POSIX filesystem path', () => {
    const result = sanitizeMessage(
      'could not open large object /var/lib/postgresql/data/base/16384/2609',
    );

    expect(result).toBe('could not open large object [REDACTED]');
  });

  it('masks an absolute Windows filesystem path with backslashes', () => {
    const result = sanitizeMessage(
      'could not read file C:\\Users\\svc-backup\\dumps\\prod.dump',
    );

    expect(result).toBe('could not read file [REDACTED]');
  });

  it('masks an absolute Windows filesystem path with forward slashes', () => {
    const result = sanitizeMessage('could not read file C:/Users/svc-backup/prod.dump');

    expect(result).toBe('could not read file [REDACTED]');
  });

  it('is idempotent — sanitizing twice equals sanitizing once', () => {
    const raw =
      'postgres://admin:hunter2@10.0.0.5:5432/prod failed, password=hunter2, path /var/lib/data';

    const once = sanitizeMessage(raw);
    const twice = sanitizeMessage(once);

    expect(twice).toBe(once);
  });

  it('does not alter a plain error message with no sensitive content', () => {
    const message = 'restore produced no tables — dump may be empty or corrupt';

    expect(sanitizeMessage(message)).toBe(message);
  });

  it('does not mask a database name mentioned without a key-value separator', () => {
    const message = 'FATAL: database "prod_orders" does not exist';

    expect(sanitizeMessage(message)).toBe(message);
  });

  it('does not mask a schema-qualified table name', () => {
    const message = 'constraint violation on public.orders';

    expect(sanitizeMessage(message)).toBe(message);
  });

  it('does not mask a plain fraction that happens to contain a slash', () => {
    const message = 'progress reduced by 1/2 after retry';

    expect(sanitizeMessage(message)).toBe(message);
  });

  it('does not mask a UUID', () => {
    const message = 'job 00000000-0000-0000-0000-000000000001 failed';

    expect(sanitizeMessage(message)).toBe(message);
  });

  it('does not mask a bare numeric timestamp with no letter-based host', () => {
    const message = 'elapsed time 12:30:45 before timeout';

    expect(sanitizeMessage(message)).toBe(message);
  });

  it('does not mask the word "user" used in plain prose without a separator', () => {
    const message = 'operation failed: user cancelled the request';

    expect(sanitizeMessage(message)).toBe(message);
  });

  it('handles an empty string without throwing', () => {
    expect(sanitizeMessage('')).toBe('');
  });
});
