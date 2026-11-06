'use client';

/** The server asked for one dated answer. The buttons resubmit the same draft. */
export function ContentClarification({
  scope,
  onChoose,
}: {
  scope: 'HEALTH' | 'CONVERSATION';
  onChoose: (value: string) => void;
}) {
  const choices = scope === 'HEALTH'
    ? [
        { value: 'NO_CURRENT_LIMIT', label: 'No limita lo que voy a hacer' },
        { value: 'CURRENT_LIMIT', label: 'Hay un límite vigente' },
      ]
    : [
        { value: 'VIABLE', label: 'Puedo tener esta conversación de forma segura' },
        { value: 'UNSAFE', label: 'No es seguro tener esta conversación' },
      ];
  return (
    <div className="mk-form__actions">
      {choices.map((choice) => (
        <button key={choice.value} type="button" className="mk-member-btn" onClick={() => onChoose(choice.value)}>
          {choice.label}
        </button>
      ))}
    </div>
  );
}
