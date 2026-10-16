type DifficultyPart = { value?: number | null; calculable?: boolean };

const INTERFERENCE_KEYS = ['PR', 'ER', 'PY', 'D'] as const;

export type ShadowDiagnosticPayload = {
  shadowInterferenceTotal: number | null;
  shadowIntegrationTotal: number | null;
  shadowDiagnostic: string | null;
  shadowDiagnosticCoach: string | null;
};

export function shadowTotalsFromParts(parts: Record<string, DifficultyPart>): {
  interference: number | null;
  integration: number | null;
  ready: boolean;
} {
  let interference: number | null = null;
  let integration: number | null = null;
  let ready = true;
  let sum = 0;
  for (const key of INTERFERENCE_KEYS) {
    const part = parts[key];
    if (!part?.calculable || part.value == null) {
      ready = false;
      continue;
    }
    sum += part.value;
  }
  if (INTERFERENCE_KEYS.every((key) => parts[key]?.calculable && parts[key]?.value != null)) {
    interference = sum;
  }
  const inPart = parts.IN;
  if (inPart?.calculable && inPart.value != null) {
    integration = inPart.value;
  } else {
    ready = false;
  }
  return { interference, integration, ready };
}

export function shadowOverallMember(interference: number | null, integration: number | null): string {
  if (interference == null && integration == null) return 'Sin desarrollo';
  const density = interference ?? 0;
  const resources = integration ?? 0;
  if (density + resources === 0) return 'Sin desarrollo';
  if (density + resources <= 12) {
    return 'Perfil libre y enfocado. Operas desde la transparencia y el liderazgo propio, con terreno libre de bloqueos inconscientes para diseñar y ejecutar tu ikigai.';
  }
  if (density >= 13 && resources >= 14) {
    return 'Integración avanzada. Hay focos de sombra activa, y también madurez y herramientas conscientes para usarlos como palanca.';
  }
  if (density >= 36 && resources <= 6) {
    return 'Alerta de autosabotaje. Hay mucha sombra activa y muy pocos recursos de integración. Conviene desactivar esos bloqueos antes del plan.';
  }
  return 'Bloqueo moderado. Hay sombras latentes en áreas concretas, con recursos medios. Conviene un acompañamiento para aclarar el propósito.';
}

/** Wording alineado a la hoja E-PER-000 (celda D181 / F177+G177). Uso interno y admin. */
export function shadowOverallCoach(interference: number | null, integration: number | null): string {
  if (interference == null && integration == null) return 'Sin desarrollo';
  const density = interference ?? 0;
  const resources = integration ?? 0;
  if (density + resources === 0) return 'Sin desarrollo';
  if (density + resources <= 12) {
    return 'PERFIL LIBRE Y ENFOCADO: El cliente opera desde la transparencia y el auto liderazgo. Cuenta con un terreno limpio de bloqueos inconscientes para diseñar y ejecutar su Ikigai de inmediato de forma acelerada.';
  }
  if (density >= 13 && resources >= 14) {
    return 'INTEGRACIÓN AVANZADA: A pesar de registrar focos de sombra activa, el cliente posee una alta madurez y herramientas conscientes. El proceso MK debe usar estas sombras detectadas como combustibles y palancas de crecimiento.';
  }
  if (density >= 36 && resources <= 6) {
    return 'ALERTA DE AUTOSABOTAJE: Alta densidad de Sombra Activa con recursos de integración críticamente bajos. El cliente está atrapado en la parálisis o el boicot inconsciente. Priorizar la desactivación de bloqueos antes de estructurar el plan de acción del Ikigai.';
  }
  return 'BLOQUEO MODERADO: El cliente presenta sombras latentes en áreas específicas que frenan su potencial, acompañadas de recursos medios. Se recomienda un acompañamiento estructurado en el proceso MK para dar claridad a su propósito.';
}

export function shadowDiagnosticFromParts(parts: Record<string, DifficultyPart>): ShadowDiagnosticPayload {
  const { interference, integration, ready } = shadowTotalsFromParts(parts);
  if (!ready) {
    return {
      shadowInterferenceTotal: interference,
      shadowIntegrationTotal: integration,
      shadowDiagnostic: null,
      shadowDiagnosticCoach: null,
    };
  }
  return {
    shadowInterferenceTotal: interference,
    shadowIntegrationTotal: integration,
    shadowDiagnostic: shadowOverallMember(interference, integration),
    shadowDiagnosticCoach: shadowOverallCoach(interference, integration),
  };
}
