import { familyById } from './families';
import type { AccompanimentInput, AccompanimentProposal } from './rules';
import { variantCopy } from './rules';

export type HelpField = {
  key: string;
  label: string;
  value: string | null;
  pending: boolean;
  source: 'USER_GOAL' | 'DECLARED' | 'PENDING';
};

export type HelpDraftV2 = {
  source: 'SYSTEM_GENERATED';
  rulesVersion: string;
  catalogVersion: string;
  familyId: string | null;
  templateVersion: string | null;
  cycleResult: { text: string; from: 'USER_GOAL' | 'SYSTEM' };
  reasons: { text: string; refs: string[] }[];
  missing: { key: string; question: string }[];
  mode: { value: string | null; status: string; territory: string | null; pillar: string | null };
  links: { pillar: string; territory: string; note: string }[];
  action: string | null;
  artifact: { kind: string; fields: HelpField[] } | null;
  occasion: {
    occasions: number | null;
    minutesPerOccasion: number | null;
    weeklyMinutes: number | null;
    maintenanceMinutes: number;
    reviewMinutes: number;
    reviewIsEstimate: boolean;
    fits: boolean | null;
    text: string;
  } | null;
  doneWhen: string | null;
  minimumVersion: string | null;
  alternative: { barrier: string | null; text: string; familyId: string | null; requiresApproval: boolean } | null;
  learning: { question: string; expectedEvidence: string } | null;
  stopIf: string[];
  futureEffect: string;
  forbids: string[];
  urgency: AccompanimentProposal['urgency'];
  adopted: boolean;
};

function fieldsOf(familyFields: { key: string; label: string }[], known: Record<string, string | null | undefined>): HelpField[] {
  return familyFields.map((field) => {
    const value = known[field.key]?.trim() || null;
    return {
      key: field.key,
      label: field.label,
      value,
      pending: !value,
      source: value ? 'DECLARED' : 'PENDING',
    };
  });
}

export function draftAccompanimentHelp(proposal: AccompanimentProposal, input: AccompanimentInput & { knownFields?: Record<string, string | null> }): HelpDraftV2 {
  const family = familyById(proposal.familyId);
  const variant = variantCopy(proposal.familyId, proposal.barrierRecognized);
  const goal = input.goalText?.trim() || '';
  const adopted = !proposal.incompatible && !proposal.urgency;
  const action = proposal.urgency || proposal.incompatible ? null : variant?.action ?? (proposal.requiresAction ? family?.action ?? null : family?.id === 'X-PAUSE' ? null : family?.action ?? null);
  const pause = proposal.situation === 'PAUSE' || family?.id === 'X-PAUSE';
  const load = proposal.load;
  const occasionText = pause
    ? 'Sin ocasión nueva.'
    : load.occasions != null && load.minutesPerOccasion != null
      ? `${load.occasions} ocasiones de ${load.minutesPerOccasion} minutos. Revisión ${load.reviewMinutes} minutos${load.reviewIsEstimate ? ', es una estimación' : ''}${load.adaptedReview ? ' y se acortó para que todo quepa' : ''}. ${input.flexible || input.weekday == null ? 'Sin día ni hora inventados.' : 'El día es el que elegiste.'}`
      : 'Faltan ocasiones o minutos. No invento un horario.';
  const known = { ...(input.knownFields ?? {}) };
  if (goal && !known.entregable) known.entregable = goal;
  return {
    source: 'SYSTEM_GENERATED',
    rulesVersion: proposal.rulesVersion,
    catalogVersion: proposal.catalogVersion,
    familyId: proposal.familyId,
    templateVersion: proposal.templateVersion,
    cycleResult: {
      text: goal || family?.doneWhen || 'Una aclaración que cambie el paso.',
      from: goal ? 'USER_GOAL' : 'SYSTEM',
    },
    reasons: proposal.reasons,
    missing: proposal.missing,
    mode: {
      value: proposal.mode,
      status: proposal.modeStatus,
      territory: proposal.territory,
      pillar: proposal.pillar,
    },
    links: proposal.links,
    action: pause ? null : action,
    artifact: family
      ? { kind: family.artifactKind, fields: fieldsOf(family.fields, known) }
      : null,
    occasion: pause ? null : {
      occasions: load.occasions,
      minutesPerOccasion: load.minutesPerOccasion,
      weeklyMinutes: input.weeklyMinutes,
      maintenanceMinutes: load.maintenanceMinutes,
      reviewMinutes: load.reviewMinutes,
      reviewIsEstimate: load.reviewIsEstimate,
      fits: load.fits,
      text: occasionText,
    },
    doneWhen: pause ? family?.doneWhen ?? 'No aparece una tarea nueva.' : proposal.criterionNote ?? variant?.doneWhen ?? family?.doneWhen ?? null,
    minimumVersion: family?.minimumVersion ?? null,
    alternative: proposal.alternative
      ? { barrier: proposal.barrierRecognized, text: proposal.alternative.text, familyId: proposal.alternative.familyId, requiresApproval: true }
      : family
        ? { barrier: proposal.barrierRecognized, text: variant?.alternativeText ?? family.alternativeText, familyId: null, requiresApproval: false }
        : null,
    learning: family ? { question: family.learningQuestion, expectedEvidence: family.expectedEvidence } : null,
    stopIf: family?.stopIf ?? [],
    futureEffect: proposal.situation === 'RETURN'
      ? 'Confirmar reorganiza solo el futuro, desde la fecha de la confirmación. Los días anteriores no se regeneran.'
      : proposal.situation === 'PAUSE'
        ? 'Confirmar deja el plan en pausa, sin acciones nuevas y sin fecha de regreso.'
        : proposal.urgency
          ? 'No se agenda una tarea semanal como respuesta a la urgencia.'
          : 'Confirmar escribe el paso en el futuro del plan. La historia y el índice no se reescriben.',
    forbids: family?.forbids ?? [],
    urgency: proposal.urgency,
    adopted,
  };
}
