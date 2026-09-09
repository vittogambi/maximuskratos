import { experienceSha256 } from './hash';
import {
  EXPERIENCE_ID_V0,
  EXPERIENCE_REF_V0,
  PRODUCT_HYPOTHESIS,
  type ExperienceDefinition,
  type ExperienceHypothesis,
} from './types';

function hypothesis(id: string, statement: string): ExperienceHypothesis {
  return { id, status: PRODUCT_HYPOTHESIS, statement };
}

export function buildExperienceV01(): ExperienceDefinition {
  const draft: Omit<ExperienceDefinition, 'sha256'> = {
    experience_id: EXPERIENCE_ID_V0,
    revision: 1,
    experience_ref: EXPERIENCE_REF_V0,
    status: 'PUBLISHED',
    purpose_role: hypothesis(
      'PH-01',
      'Propósito es horizonte. Matrix no produce stage ni Purpose Score.',
    ),
    direction_model: hypothesis(
      'PH-02',
      'Dirección es norte operativo versionado. Puede estar vacía. No bloquea el preview.',
    ),
    focus_resolution: hypothesis(
      'PH-FOCUS-01',
      'selected_focus empieza nulo. Matrix candidate no se copia.',
    ),
    route_model: hypothesis(
      'PH-06',
      'Ruta de dominio con plan Matrix se etiqueta MATRIX/CATALOG. Ruta Purpose es PRODUCT ROUTE.',
    ),
    cycle_projection: hypothesis(
      'PH-CYCLE-01',
      'CYCLE es el período mensual de suscripción, no 28 días fijos. Trimestral no alarga el primer ciclo.',
    ),
    objective_selection: hypothesis(
      'PH-OBJ-01',
      'El objetivo se elige a mano. Si la ruta Purpose no tiene catálogo, NEEDS_HUMAN_CURATION.',
    ),
    action_model: hypothesis(
      'PH-ACT-01',
      'La acción semanal la escribe la persona. Matrix no selecciona una de las 96.',
    ),
    hypotheses: [
      hypothesis('PH-01', 'Propósito trascendental es horizonte, no score.'),
      hypothesis('PH-02', 'Dirección puede faltar.'),
      hypothesis('PH-03', 'Ikigai es instrumento, no onboarding.'),
      hypothesis('PH-04', 'La hoja de ruta puede estar incompleta.'),
      hypothesis('PH-05', 'El perfil es foto, no mecánica diaria.'),
      hypothesis('PH-06', 'La ruta MK es capa de ejecución.'),
      hypothesis(
        'PH-CYCLE-01',
        'CYCLE = MONTHLY SUBSCRIPTION PERIOD. Ejemplo 25 agosto a 24 septiembre. duration_text de Matrix no se reescribe.',
      ),
    ],
  };
  return { ...draft, sha256: experienceSha256(draft) };
}
