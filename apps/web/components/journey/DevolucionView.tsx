type PathOffer = {
  id: string;
  title: string;
  personalized: boolean;
  firstStep: string;
};

/** Shows the paths after the questionnaire. Choosing one does not create a plan. */
export function DevolucionView({
  paths,
  chosen,
  onChoose,
}: {
  paths: PathOffer[];
  chosen?: string;
  onChoose?: (id: string) => void;
}) {
  if (!paths.length) return null;
  return (
    <section aria-label="Devolución">
      <h2>Después del cuestionario</h2>
      {paths.map((path) => (
        <article key={path.id}>
          <h3>{path.title}</h3>
          {path.id === 'EXPLORAR' && !path.personalized ? <p>Exploración general. No es una lectura personalizada.</p> : null}
          <p>{path.firstStep}</p>
          {onChoose ? (
            <button type="button" aria-pressed={chosen === path.id} onClick={() => onChoose(path.id)}>
              {chosen === path.id ? 'Elegido' : 'Elegir este camino'}
            </button>
          ) : null}
        </article>
      ))}
    </section>
  );
}
