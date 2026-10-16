import { describe, expect, it } from 'vitest';
import { archetypeSlugFromStored } from '@/components/diagnostico/options/ArchetypeOriginPicker';

describe('archetypeSlugFromStored', () => {
  it('accepts slug or label from older free text answers', () => {
    expect(archetypeSlugFromStored('mago')).toBe('mago');
    expect(archetypeSlugFromStored('El Mago')).toBe('mago');
    expect(archetypeSlugFromStored('  ')).toBeNull();
    expect(archetypeSlugFromStored('Otro texto')).toBeNull();
  });
});
