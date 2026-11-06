import type { Template } from './engine';
import { PACK as FINANZAS } from './finanzas';
import { bindPack } from './engine';
import { PACK as MENTALIDAD } from './mentalidad';
import { PACK as RELACIONES } from './relaciones';
import { PACK as SALUD } from './salud';

const PACKS = {
  MENTALIDAD,
  FINANZAS,
  RELACIONES,
  SALUD_FISICA: SALUD,
} as const;

export type InterventionTerritory = keyof typeof PACKS;

export function packByTerritory(territory: string) {
  const key = territory.toUpperCase();
  if (key in PACKS) return PACKS[key as InterventionTerritory];
  return null;
}

export function templateById(id: string | null | undefined): Template | null {
  if (!id) return null;
  for (const pack of Object.values(PACKS)) {
    const found = pack.templates.find((row) => row.id === id);
    if (found) return found;
  }
  return null;
}

export const BOUND = {
  MENTALIDAD: bindPack(MENTALIDAD),
  FINANZAS: bindPack(FINANZAS),
  RELACIONES: bindPack(RELACIONES),
  SALUD_FISICA: bindPack(SALUD),
};
