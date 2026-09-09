import { createHash } from 'node:crypto';
import type { ExperienceDefinition } from './types';

export function experienceSha256(definition: Omit<ExperienceDefinition, 'sha256'> & { sha256?: string }): string {
  const copy = { ...definition };
  delete copy.sha256;
  return createHash('sha256').update(JSON.stringify(copy)).digest('hex');
}
