import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadLegacyCatalogDiffFromRepo, type LegacyCatalogRow } from '@mk/matrix-engine';

function repoRoot(): string | null {
  const candidates = [process.cwd(), join(process.cwd(), '../..'), join(__dirname, '../../../../')];
  return candidates.find((dir) => existsSync(join(dir, 'MATRIZ_MAESTRA_MK_v2_FOCO.xlsx'))) ?? null;
}

export function loadLabLegacyCatalogs(): LegacyCatalogRow[] {
  const root = repoRoot();
  if (!root) return [];
  return loadLegacyCatalogDiffFromRepo(root);
}
