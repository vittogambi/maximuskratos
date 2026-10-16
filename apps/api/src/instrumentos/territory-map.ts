import { PILLARS, TERRITORIES, TERRITORY_LABEL, PILLAR_LABEL, type Pillar, type Territory } from './glossary';

export type CellState = 'CON_INFORMACION' | 'PARCIAL' | 'SIN_INFORMACION';

export type TerritoryEvidence = {
  sourceRef: string;
  role: 'senal' | 'nativo' | 'cualitativo' | 'contexto' | 'limite' | 'eleccion';
  note: string;
};

export type TerritoryCell = {
  pillar: Pillar;
  territory: Territory;
  label: string;
  state: CellState;
  evidence: TerritoryEvidence[];
  /** A figure only when a specific method defines it. The core score is not copied here. */
  figure: null;
};

const HOME: Record<Territory, { pillar: Pillar; refs: string[] }> = {
  MENTALIDAD: {
    pillar: 'MENTE',
    refs: ['formulario-v1:E-AUD-001!R7', 'formulario-v1:E-AUD-001!R26', 'formulario-v1:E-PER-000!R73', 'formulario-v1:E-PER-000!R76'],
  },
  RELACIONES: {
    pillar: 'ESPIRITU',
    refs: ['formulario-v1:E-AUD-001!R46', 'formulario-v1:E-AUD-001!R66', 'formulario-v1:E-AUD-001!R67'],
  },
  FINANZAS: {
    pillar: 'MENTE',
    refs: ['formulario-v1:E-AUD-001!R39', 'formulario-v1:F-RAD-003!R7'],
  },
  SALUD_FISICA: {
    pillar: 'CUERPO',
    refs: ['formulario-v1:E-AUD-001!R17', 'formulario-v1:E-AUD-001!R18', 'formulario-v1:F-RAD-001!R27'],
  },
};

/**
 * Twelve crossings. Evidence can sit in one cell even when the signal also feeds a pillar index.
 * The cell never receives the pillar score.
 */
export function territoryMap(evidence: TerritoryEvidence[]): TerritoryCell[] {
  const cells: TerritoryCell[] = [];
  for (const territory of TERRITORIES) {
    for (const pillar of PILLARS) {
      const home = HOME[territory];
      const rows = pillar === home.pillar
        ? evidence.filter((item) => home.refs.includes(item.sourceRef))
        : [];
      cells.push({
        pillar,
        territory,
        label: `${PILLAR_LABEL[pillar]} en ${TERRITORY_LABEL[territory]}`,
        state: rows.length === 0 ? 'SIN_INFORMACION' : rows.length < 2 ? 'PARCIAL' : 'CON_INFORMACION',
        evidence: rows,
        figure: null,
      });
    }
  }
  return cells;
}

/** The four published territories at their home pillar. Other crossings stay without a figure. */
export function territoryHomes(evidence: TerritoryEvidence[]): TerritoryCell[] {
  const cells = territoryMap(evidence);
  return TERRITORIES.map((territory) => {
    const home = HOME[territory];
    const cell = cells.find((item) => item.territory === territory && item.pillar === home.pillar);
    if (!cell) throw new Error(`Falta la celda de ${territory}.`);
    return cell;
  });
}
