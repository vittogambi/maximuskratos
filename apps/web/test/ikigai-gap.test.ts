import { describe, expect, it } from 'vitest';
import { gapCopy } from '@/components/ikigai/relate-step';

describe('gapCopy', () => {
  it('states the reason when ideas are chosen and the phrase is empty', () => {
    expect(gapCopy('', 2)).toBe('Faltan 12 caracteres.');
    expect(gapCopy('   ', 1)).toBe('Faltan 12 caracteres.');
  });

  it('asks for an idea before counting characters', () => {
    expect(gapCopy('una frase larga de sobra', 0)).toBe('Elige al menos una idea.');
  });

  it('returns null when the possibility can be saved', () => {
    expect(gapCopy('Ayudar a personas que empiezan.', 1)).toBeNull();
  });
});
