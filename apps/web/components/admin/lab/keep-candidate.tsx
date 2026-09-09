export function KeepCandidateButton({
  blocked,
  worsensWithoutVerdict,
  onKeep,
}: {
  blocked: boolean;
  worsensWithoutVerdict: number;
  onKeep: () => void;
}) {
  return (
    <span>
      {blocked ? <span>Hay {worsensWithoutVerdict} casos que empeoran sin veredicto.</span> : null}
      <button type="button" className="lab-btn" disabled={blocked} onClick={onKeep}>
        Sí, mantener este cambio
      </button>
    </span>
  );
}
