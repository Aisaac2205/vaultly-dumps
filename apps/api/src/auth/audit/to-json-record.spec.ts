import { toJsonRecord } from './to-json-record';

describe('toJsonRecord', () => {
  it('passes a plain request body through unchanged', () => {
    expect(toJsonRecord({ email: 'someone@example.com' })).toEqual({
      email: 'someone@example.com',
    });
  });

  it('falls back to an empty record when the endpoint carries no body', () => {
    expect(toJsonRecord(undefined)).toEqual({});
  });

  it('refuses a non-object body rather than letting it reach the trail', () => {
    expect(toJsonRecord('sign-in')).toEqual({});
    expect(toJsonRecord(['a', 'b'])).toEqual({});
    expect(toJsonRecord(null)).toEqual({});
  });
});
