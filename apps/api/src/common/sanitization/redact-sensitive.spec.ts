import { redactSensitive } from './redact-sensitive';

describe('redactSensitive', () => {
  it('redacts a top-level password field', () => {
    const result = redactSensitive({ password: 'hunter2', username: 'joe' });

    expect(result).toEqual({ password: '[REDACTED]', username: 'joe' });
  });

  it('redacts fields matching secret, token, apiKey, accessKey, authorization, credential, and privateKey', () => {
    const result = redactSensitive({
      secret: 'a',
      token: 'b',
      apiKey: 'c',
      api_key: 'd',
      accessKey: 'e',
      access_key: 'f',
      authorization: 'g',
      credential: 'h',
      privateKey: 'i',
      private_key: 'j',
    });

    expect(result).toEqual({
      secret: '[REDACTED]',
      token: '[REDACTED]',
      apiKey: '[REDACTED]',
      api_key: '[REDACTED]',
      accessKey: '[REDACTED]',
      access_key: '[REDACTED]',
      authorization: '[REDACTED]',
      credential: '[REDACTED]',
      privateKey: '[REDACTED]',
      private_key: '[REDACTED]',
    });
  });

  it('matches sensitive keys case-insensitively', () => {
    const result = redactSensitive({ PASSWORD: 'hunter2', Token: 'xyz' });

    expect(result).toEqual({ PASSWORD: '[REDACTED]', Token: '[REDACTED]' });
  });

  it('redacts sensitive keys nested arbitrarily deep', () => {
    const result = redactSensitive({
      level1: {
        level2: {
          level3: {
            password: 'deep-secret',
            safe: 'kept',
          },
        },
      },
    });

    expect(result).toEqual({
      level1: {
        level2: {
          level3: {
            password: '[REDACTED]',
            safe: 'kept',
          },
        },
      },
    });
  });

  it('redacts sensitive keys inside arrays of objects', () => {
    const result = redactSensitive({
      connections: [
        { name: 'a', password: 'p1' },
        { name: 'b', password: 'p2' },
      ],
    });

    expect(result).toEqual({
      connections: [
        { name: 'a', password: '[REDACTED]' },
        { name: 'b', password: '[REDACTED]' },
      ],
    });
  });

  it('redacts sensitive keys inside objects nested within arrays nested within objects', () => {
    const result = redactSensitive({
      items: [{ nested: { secret: 'x', keep: 'y' } }],
    });

    expect(result).toEqual({
      items: [{ nested: { secret: '[REDACTED]', keep: 'y' } }],
    });
  });

  it('leaves non-sensitive keys and primitive values untouched', () => {
    const input = { name: 'connection-1', port: 5432, active: true, tag: null };

    expect(redactSensitive(input)).toEqual(input);
  });

  it('returns null and undefined unchanged', () => {
    expect(redactSensitive(null)).toBeNull();
    expect(redactSensitive(undefined)).toBeUndefined();
  });

  it('returns an empty object unchanged', () => {
    expect(redactSensitive({})).toEqual({});
  });

  it('returns an empty array unchanged', () => {
    expect(redactSensitive([])).toEqual([]);
  });

  it('handles top-level primitives without throwing', () => {
    expect(redactSensitive('plain-string')).toBe('plain-string');
    expect(redactSensitive(42)).toBe(42);
    expect(redactSensitive(true)).toBe(true);
  });

  it('handles top-level arrays of primitives unchanged', () => {
    expect(redactSensitive([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('is idempotent — redacting an already-redacted value yields the same result', () => {
    const input = { password: 'hunter2', nested: { token: 'abc', safe: 'v' } };

    const once = redactSensitive(input);
    const twice = redactSensitive(once);

    expect(twice).toEqual(once);
  });

  it('does not mutate the input object', () => {
    const input = { password: 'hunter2', safe: 'v' };
    const inputCopy = { ...input };

    redactSensitive(input);

    expect(input).toEqual(inputCopy);
  });
});
