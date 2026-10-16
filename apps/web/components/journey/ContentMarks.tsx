'use client';

/** Marks the member can attach to one action. The server reviews these, not the title. */
export const CONTENT_MARKS = [
  { id: 'PHYSICAL_EXERTION', label: 'Esfuerzo físico' },
  { id: 'DIET', label: 'Dieta' },
  { id: 'SUPPLEMENT', label: 'Suplemento' },
  { id: 'MEDICATION', label: 'Medicación' },
  { id: 'CONFRONTATION', label: 'Confrontación' },
  { id: 'INVESTMENT', label: 'Inversión' },
  { id: 'DEBT', label: 'Deuda' },
] as const;

export function ContentMarks({
  legend,
  selected,
  onChange,
}: {
  legend: string;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset className="mk-marks">
      <legend>{legend}</legend>
      <p>Si no marcas nada, se guarda tal cual.</p>
      {CONTENT_MARKS.map((mark) => (
        <label key={mark.id}>
          <input
            type="checkbox"
            checked={selected.includes(mark.id)}
            onChange={(event) => {
              onChange(
                event.target.checked
                  ? [...selected, mark.id]
                  : selected.filter((id) => id !== mark.id),
              );
            }}
          />
          {mark.label}
        </label>
      ))}
    </fieldset>
  );
}
