import { describe, it, expect } from 'vitest';
import { isValidSlug, getSlugValidationError } from '../slugValidation';

describe('slug validation', () => {
  it('accepts valid slugs', () => {
    const valid = [
      'macacao',
      'roupas-infantis',
      'a1-b2-c3',
      'abc123',
    ];
    valid.forEach((s) => expect(isValidSlug(s)).toBe(true));
  });

  it('rejects invalid slugs', () => {
    const invalid = [
      'Macacao',
      'maça',
      'roupas$',
      '-inicio',
      'fim-',
      'dois--hifens',
      'com espaço',
      '',
      '---',
    ];
    invalid.forEach((s) => expect(isValidSlug(s)).toBe(false));
  });

  it('returns helpful error messages', () => {
    expect(getSlugValidationError('')).toBeTruthy();
    expect(getSlugValidationError('roupas-infantis')).toBeNull();
    expect(getSlugValidationError('Fim-')).toBeTruthy();
  });
});