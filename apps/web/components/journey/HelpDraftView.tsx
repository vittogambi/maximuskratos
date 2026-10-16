type LegacyHelp = {
  evidence: string[];
  action: string | null;
  occasion: string | null;
  criterion: string | null;
  forbids: string[];
};

type Field = { key: string; label: string; value: string | null; pending: boolean };

export type HelpDraftViewModel = LegacyHelp | {
  cycleResult: { text: string; from: string };
  reasons: { text: string; refs: string[] }[];
  missing: { key: string; question: string }[];
  mode: { value: string | null; status: string; territory: string | null; pillar: string | null };
  action: string | null;
  artifact: { kind: string; fields: Field[] } | null;
  occasion: { text: string } | null;
  doneWhen: string | null;
  minimumVersion: string | null;
  alternative: { text: string; requiresApproval: boolean } | null;
  learning: { question: string; expectedEvidence: string } | null;
  futureEffect: string;
  forbids: string[];
  urgency: { text: string } | null;
};

function isNext(help: HelpDraftViewModel): help is Exclude<HelpDraftViewModel, LegacyHelp> {
  return 'cycleResult' in help;
}

/** Renders the help the server proposed. It does not invent a second plan. */
export function HelpDraftView({ help }: { help: HelpDraftViewModel }) {
  if (!isNext(help)) {
    return (
      <section aria-label="Ayuda propuesta">
        <h2>Ayuda propuesta</h2>
        {help.evidence.map((line) => <p key={line}>{line}</p>)}
        {help.action ? <p>{help.action}</p> : <p>Sin acción obligatoria.</p>}
        {help.occasion ? <p>{help.occasion}</p> : null}
        {help.criterion ? <p>{help.criterion}</p> : null}
        {help.forbids.length ? <p>No incluye: {help.forbids.join(', ')}.</p> : null}
      </section>
    );
  }
  return (
    <section aria-label="Ayuda propuesta">
      <h2>Ayuda propuesta</h2>
      <p>{help.mode.value ?? 'Modo no determinado'}. {help.mode.status}.</p>
      <p>{help.cycleResult.text}</p>
      {help.reasons.map((line) => <p key={line.text}>{line.text}</p>)}
      {help.missing.map((line) => <p key={line.key}>{line.question}</p>)}
      {help.urgency ? <p>{help.urgency.text}</p> : null}
      {help.action ? <p>{help.action}</p> : <p>Sin acción obligatoria.</p>}
      {help.artifact?.fields.map((field) => (
        <p key={field.key}>{field.label}: {field.pending ? 'Pendiente' : field.value}</p>
      ))}
      {help.occasion ? <p>{help.occasion.text}</p> : null}
      {help.doneWhen ? <p>{help.doneWhen}</p> : null}
      {help.minimumVersion ? <p>Versión mínima: {help.minimumVersion}</p> : null}
      {help.alternative ? <p>Alternativa: {help.alternative.text}</p> : null}
      {help.learning ? <p>{help.learning.question}</p> : null}
      <p>{help.futureEffect}</p>
      {help.forbids.length ? <p>No incluye: {help.forbids.join(', ')}.</p> : null}
    </section>
  );
}
