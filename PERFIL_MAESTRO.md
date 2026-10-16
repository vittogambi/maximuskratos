# Perfil Maestro

Paquete de la pantalla que muestra la captura «PERFIL MAESTRO / Tu lectura». No es una especificación nueva. El código citado es el del 16 de octubre de 2026.

Ruta visible: `/perfil`.
La página elige una de dos lecturas. Esta captura es la lectura del formulario (`scoringVersion` empieza por `formulario-score`). La otra, `SystemReport`, es el informe de arquetipos y no pinta estas cifras.

## Mapa

| Pieza | Archivo |
|---|---|
| Ruta | `apps/web/app/(member)/perfil/page.tsx` |
| Carga y bifurcación | `apps/web/components/pages/PerfilContent.tsx` |
| Pantalla de la captura | `apps/web/components/profile/ExcelProfile.tsx` |
| Bloque Índices | `apps/web/components/journey/IndexSummary.tsx` |
| Nota de revisión privada | `apps/web/components/app-shell/ReviewVersionNote.tsx` |
| Estilos de la lista | `apps/web/app/globals.css`, clase `.mk-excel-profile` |
| Informe que esta captura no usa | `apps/web/components/profile/SystemReport.tsx` |
| GET del perfil | `GET /api/v1/diagnostic/profile` en `apps/api/src/diagnostic/diagnostic.controller.ts` |
| Cuándo existe el perfil | `DiagnosticService.getProfile` y `completeDiagnostic` |
| Payload de la ficha | `apps/api/src/instrumentos/reading.ts`, `persistFormularioReading` |
| Sumas, identidad, sentido, dificultades, personalidad | `apps/api/src/instrumentos/score.ts` |
| Índice de alineación MK | `apps/api/src/instrumentos/core-definition.ts`, `core-index.ts`, `core-reading.ts` |
| Índice de profundidad | `depthView` en `core-reading.ts`. En esta captura no salió. |
| Alineación declarada | `apps/api/src/instrumentos/iad.ts`, guardada en `purpose_revisions.content.iad` |
| Estado que trae índice y ficha | `GET /api/v1/journey/state`, `JourneyService.state` |
| Cliente | `apiDiagnosticProfile` en `apps/web/lib/api.ts`. `journeyState`, `formatAlignmentValue`, `formatAlignmentDate` en `apps/web/lib/journey-api.ts` |

`excel-score.ts` puntúa el catálogo viejo `formularios-x-paso`. Esta captura no sale de ahí. `completeDiagnostic` igual llama a `persistExcelScore` y, si la versión es `formulario-completo`, después llama a `persistFormularioReading`, que pisa `master_profiles.indices`.

## Cómo se arma la página

`PerfilContent` pide en paralelo:

1. `GET /api/v1/diagnostic/profile`. Si `indices.scoringVersion` empieza por `formulario-score`, monta `ExcelProfile` y le pasa `indices` como `form`.
2. `GET /api/v1/diagnostic/progress`. Solo decide el texto del enlace si el perfil no carga.
3. `GET /api/v1/journey/state`. De ahí salen `alignment` (ficha declarada) e `indexes` (alineación MK y profundidad). Si esa llamada falla, la ficha dice «No se pudo leer la ficha.» Las cifras de arriba igual pueden mostrarse.

`getProfile` devuelve el perfil actual solo si todos los módulos están `COMPLETE` y el outro fue visto. Si no, la página no es esta captura: muestra «Perfil no disponible» o, sin acceso de miembro, «Perfil Maestro próximamente.»

El payload se escribe en `diagnostic_form_results` (`formCode: formulario-completo`) y se copia a `master_profiles.indices`. Arquetipo de esta lectura: `sin-clasificar`. No se recalcula en cada visita. Se vuelve a escribir al cerrar el diagnóstico (`completeDiagnostic`) o si alguien llama `persistFormularioReading` a mano.

## Qué es cada bloque de la captura

Los números de abajo son los de la captura pegada, no constantes del producto.

### Cabeza

- Ceja: `PERFIL MAESTRO`.
- Título: `Tu lectura`.
- Nota fija. La frase de la identidad se agrega solo si `identityNote` viene en el payload. En esta captura viene, por eso aparece «La identidad muestra su total. La categoría formal sigue en definición.»

### Auditoría: 76 de 115

23 ítems de `E-AUD-001`, secciones s1 a s5. Filas 6 a 10, 16 a 20, 26 a 30, 37 a 40 y 46 a 49. Cada uno vale de 1 a 5. El total existe solo con las 23. Si falta alguna, el valor es nulo y la pantalla dice «Pendiente» más la cobertura. No se publica una suma parcial como si fuera el total.

La segunda línea no es una banda inventada en la UI. Es `auditNote`, el texto de `auditCategory`:

| Total | Texto |
|---|---|
| menor de 46 | Categoría del formulario: por debajo de 46. |
| 46 a 68 | Categoría del formulario: de 46 a 68. |
| 69 a 91 | Categoría del formulario: de 69 a 91. |
| 92 a 115 | Categoría del formulario: de 92 a 115. |

76 cae en 69 a 91. `auditBand` se guarda en nulo a propósito. El corte viejo de `excel-score.ts` (`CRÍTICO`, `INESTABLE`, `SÓLIDO`, `DOMINANTE`) no se usa en esta ficha.

La sección 6 del mismo formulario no entra en los 115. El código deja escrito que el resumen Excel D15 promedia porcentajes de secciones de distinto tamaño y no es este total.

### Relaciones: 34 de 60, Calibración

12 escalas de relaciones, de `f-rad-002-s1` a `s4`, tres por ámbito. La puerta `mk:f-rad-002-pareja-puerta` no suma.

Cortes del total, guardados en `relationBand` y traducidos en la pantalla:

| Total | Guardado | Se ve |
|---|---|---|
| hasta 28 | `DETRIMENTO` | Detrimento |
| 29 a 48 | `ALERTA` | Calibración |
| 49 a 60 | `PROPULSOR` | Propulsor |

34 es `ALERTA`, por eso dice Calibración. Esos cortes no son los de finanzas ni los de cada ámbito de la hoja de ruta (allí un bloque de 15 usa Reestructuración, Calibración y Fluido).

Si la puerta es «No tengo ni he tenido pareja», `relationTotal` queda nulo, no se calcula el 60 y la segunda línea es «Sin pareja. El círculo íntimo queda fuera. El total de 60 no se calcula.» Si faltan escalas y sí hay pareja, la cifra es el guion de vacío y la banda dice «Banda pendiente». No se rellena con ceros.

### Finanzas: 40 de 60, Calibración

12 escalas con instrumento `finance`, máximo 60. El total existe solo con las 12.

| Total | Guardado | Se ve |
|---|---|---|
| hasta 24 | `CRÍTICO` | Crítico |
| 25 a 44 | `ALERTA` | Calibración |
| 45 a 60 | `ÓPTIMO` | Óptimo |

40 es `ALERTA`. La palabra Calibración es la misma etiqueta visual que en relaciones, con otros cortes.

### Identidad: 22 de 40

Diez ítems de `E-PER-000`, filas 73, 74, 76, 77, 79, 80, 82, 83, 85 y 86. Escala de las opciones, total de 10 a 40. Solo con las diez.

La segunda línea es fija: «Total de identidad de 10 a 40. La categoría formal está en definición.» El perfil no muestra Difusa, Inestable, En construcción ni Encarnada. Esas bandas viven en la hoja de ruta (D88) y aquí están detenidas a propósito. 22 en la hoja sería Inestable. En esta página no se dice.

### Desarrollo y sentido: 30 de 50

Diez ítems de la sección 6 de `E-AUD-001`: filas 56, 57, 59, 60, 62, 63, 65, 66, 67 y 68. La 58 es título, no ítem. Máximo 50. No entran en la auditoría. No tienen banda. La segunda línea está escrita en el componente: «Lectura aparte de la auditoría». El bloque solo se pinta si `senseTotal` no es nulo.

### Dificultades y recursos

Cinco grupos, nueve ítems cada uno. Sí = 2, Más o menos = 1, No = 0. Máximo 18 por grupo. No hay un total de los cinco. El código rechaza la suma Excel F181 (hasta 90) y el máximo 40 del resumen.

La pantalla imprime la clave y «N de 18», o «Pendiente» si el grupo no está completo. No imprime el descriptor. El orden es el de las claves del JSON guardado. En Postgres `jsonb` ese orden queda alfabético: D, ER, IN, PR, PY. Eso coincide con la captura (10, 10, 9, 8, 10).

Las claves salen del prefijo del enunciado (`PR`, `ER`, `PY`, `IN`, `D`), no del slug del módulo. IN se describe en el motor como recursos de integración. Los otros cuatro, como interferencia. La pantalla no muestra esa diferencia.

Esto no es el diagnóstico sombra de la hoja de ruta. Allí las familias A a D se leen en prosa después de completar cada familia. Aquí solo están estas cinco sumas.

### Índices

`IndexSummary` pinta la tarjeta `indexes.alignment` y, si existe, `indexes.depth`.

La línea de la captura sale de `ia-mk-cuest@0.1`:

`Índice de alineación MK: 52,16. Espíritu 56,94, mente 46,76, cuerpo 52,78. Cobertura 20 de 20. 16 oct 2026. ia-mk-cuest@0.1.`

El número se muestra con coma decimal y dos decimales como máximo (`formatAlignmentValue`). La fecha es el día civil de `computedAt` en `America/Santiago`.

Método, no fórmula Excel:

1. Veinte señales de `CORE_SIGNALS`. Cada una se normaliza a 0–100: `100 * (respuesta - mínimo) / (máximo - mínimo)`.
2. Un grupo (NUC-E1 … NUC-C3) es el promedio de sus señales. Si falta una señal elegible, el grupo queda nulo. No se pone cero.
3. Espíritu, Mente y Cuerpo son el promedio de sus tres grupos.
4. El general es el promedio de los tres pilares, solo si los tres existen.
5. Entra una respuesta solo si el catálogo de esa captura está etiquetado (`captureQuality` = `ETIQUETADA`). Revisión 6 o posterior lo está. Una etiqueta vieja no se vuelve válida porque el player se haya corregido después.
6. La lectura inicial se materializa una vez, al cerrar una sesión `formulario-completo` en estado `COMPLETED`. Si ya existe `commandKey` `initial:{sessionId}:ia-mk-cuest@0.1`, no se reescribe.

La segunda frase, «Índice de alineación MK. Lectura inicial del cuestionario. Método en revisión.», es `explanation` cuando el kind no es remedición ni reconstrucción y el general existe.

Cobertura 20 de 20 significa las veinte señales elegibles, no veinte módulos.

El índice de profundidad (`profundidad-mk@0.1`) iría en el párrafo siguiente. Mide trabajo documentado de la hoja, no profundidad psicológica. `depthView` devuelve nulo si no hay una sesión `formulario-completo` en `COMPLETED`. En la captura no aparece, así que esa llamada no devolvió tarjeta. El componente igual deja un párrafo vacío cuando la tarjeta es nula.

Señales y pilar:

| Id | Grupo | Pilar | sourceRef | Escala |
|---|---|---|---|---|
| E62 | NUC-E1 Sentido y contribución | Espíritu | `formulario-v1:E-AUD-001!R62` | 1 a 5 |
| E63 | NUC-E1 | Espíritu | `formulario-v1:E-AUD-001!R63` | 1 a 5 |
| I73 | NUC-E2 Identidad y dirección vividas | Espíritu | `formulario-v1:E-PER-000!R73` | 1 a 4 |
| I74 | NUC-E2 | Espíritu | `formulario-v1:E-PER-000!R74` | 1 a 4 |
| E60 | NUC-E3 Coherencia con valores | Espíritu | `formulario-v1:E-AUD-001!R60` | 1 a 5 |
| I77 | NUC-E3 | Espíritu | `formulario-v1:E-PER-000!R77` | 1 a 4 |
| E7 | NUC-M1 Autorregulación | Mente | `formulario-v1:E-AUD-001!R7` | 1 a 5 |
| E8 | NUC-M1 | Mente | `formulario-v1:E-AUD-001!R8` | 1 a 5. En el enunciado, 5 es rara vez. |
| E19 | NUC-M1 | Mente | `formulario-v1:E-AUD-001!R19` | 1 a 5. En el enunciado, 5 es casi nunca. |
| E26 | NUC-M2 Planificación y entorno | Mente | `formulario-v1:E-AUD-001!R26` | 1 a 5 |
| E27 | NUC-M2 | Mente | `formulario-v1:E-AUD-001!R27` | 1 a 5 |
| E29 | NUC-M3 Corrección y aprendizaje | Mente | `formulario-v1:E-AUD-001!R29` | 1 a 5 |
| I80 | NUC-M3 | Mente | `formulario-v1:E-PER-000!R80` | 1 a 4 |
| IN7 | NUC-M3 | Mente | `formulario-v1:E-PER-000!R154` | 0 a 2. Recurso de integración, no interferencia. |
| I76 | NUC-C1 Conducta coherente | Cuerpo | `formulario-v1:E-PER-000!R76` | 1 a 4 |
| I86 | NUC-C1 | Cuerpo | `formulario-v1:E-PER-000!R86` | 1 a 4. Pregunta hipotética de 30 días. |
| E17 | NUC-C2 Cuidado cotidiano | Cuerpo | `formulario-v1:E-AUD-001!R17` | 1 a 5 |
| E20 | NUC-C2 | Cuerpo | `formulario-v1:E-AUD-001!R20` | 1 a 5 |
| E18 | NUC-C3 Recuperación | Cuerpo | `formulario-v1:E-AUD-001!R18` | 1 a 5 |
| E57 | NUC-C3 | Cuerpo | `formulario-v1:E-AUD-001!R57` | 1 a 5 |

E8 y E19 se normalizan igual que el resto: un 5 guardado cuenta como el extremo alto de la escala, aunque el enunciado describa ese 5 como poca frecuencia. El método lo deja anotado en la señal. No invierte el valor.

### Alineación declarada

No es el índice de arriba. Es la ficha IAD guardada en la revisión de propósito (`content.iad`). Nueve respuestas, tres por pilar, de 1 a 5. Cada una se normaliza con `25 * (respuesta - 1)`. El pilar es el promedio de sus tres. El total es el promedio de los tres pilares y solo existe con las nueve. «Sin información» no vale cero.

En la captura el estado es `none`: no hay ficha, o no hay ninguna respuesta conocida. El párrafo largo está fijo en `ExcelProfile`. Si hay algunas respuestas, el estado es `partial` y no hay total. Si hay nueve y total, el estado es `saved` y se muestran el total, la fecha, la revisión y los tres pilares.

El método de esa ficha está marcado en revisión. No bloquea el plan ni la hoja. Parte de sus preguntas mira los últimos 14 días. Una cuenta nueva no inventa ese recorrido.

La ficha no se edita en esta página. El guardado vive en el flujo de propósito (`PurposeScreen` y `POST` de alineación). Esta pantalla solo la lee.

### Personalidad

Quince ítems con instrumento `personality`, en el orden de la pregunta. Cinco factores de tres. El ítem del medio de cada trío se invierte: 6 menos la respuesta. El factor es el promedio. Cortes: 4 o más alta, 2,4 o menos baja, el resto intermedia.

La pantalla imprime `descriptor`, no el promedio:

- Apertura, Responsabilidad, Extraversión y Amabilidad: «lectura alta del factor», «lectura baja del factor» o «lectura intermedia».
- Sensibilidad emocional: «alta: más reactividad ante imprevistos», «baja: más calma bajo presión» o «Sensibilidad emocional intermedia.»

La captura está toda en intermedia. No hay promedio global. El promedio Excel D206, que no invierte el ítem del medio, no se usa.

Los textos de personalidad de la hoja de ruta son otros (los descriptores del formulario). Esta lista no los copia.

### Cierre

El botón «Continuar a la hoja de ruta» apunta a `/proposito`. Esa ruta hoy es `ComingSoon`. La hoja que sí está armada se ve en `/diagnostico/resultado`.

`ReviewVersionNote` solo aparece en cuentas de la lista de revisión privada. No forma parte del texto pegado.

## Qué no mezcla esta página

- No calcula el contrato de la hoja de ruta ni sus bandas por ámbito.
- No muestra el diagnóstico sombra por familias A a E.
- No clasifica la identidad con D88.
- No muestra arquetipo, radar ni los índices viejos de presentación (`alineacion`, `profundidad`, `ejecucion`, `estabilidad` de `SystemReport`).
- El índice MK no alimenta la auditoría, ni al revés. Comparten algunas filas y las leen distinto.
- Reabrir un módulo no borra el `core_reading` ya materializado. La ficha de cifras tampoco se refresca sola hasta que vuelva a correr `persistFormularioReading`.

## Pruebas que tocan esta superficie

- `apps/web/test/journey-followup.test.tsx`: ficha pendiente, parcial, guardada y error de lectura.
- `apps/api/test/instrumentos-score.test.ts`: auditoría, sentido, identidad, dificultades, personalidad.
- `apps/api/test/relation-score.test.ts`: la puerta de pareja no puntúa y «nunca» saca el círculo íntimo del 60.
- `apps/api/test/core-index.test.ts`: normalización, grupos, general y cobertura.
- `apps/api/test/iad-invariants.test.ts`: la ficha declarada.
- `apps/api/test/excel-score.test.ts`: el otro catálogo. No explica los 76 de 115 de esta captura.

## `apps/web/components/profile/ExcelProfile.tsx`

```tsx
'use client';

import Link from 'next/link';
import { formatAlignmentDate, formatAlignmentValue, type AlignmentReading, type IndexCard } from '@/lib/journey-api';
import { IndexSummary } from '@/components/journey/IndexSummary';

type Form = {
  auditTotal?: number;
  auditMax?: number;
  auditBand?: string | null;
  relationTotal?: number | null;
  relationBand?: string | null;
  relationBandPending?: boolean;
  relationNote?: string | null;
  financeTotal?: number | null;
  financeBand?: string | null;
  identityTotal?: number | null;
  identityMax?: number;
  identityNote?: string | null;
  auditNote?: string | null;
  auditCoverage?: { answered: number; required: number };
  senseTotal?: number | null;
  difficulties?: Record<string, { value?: number | null; descriptor?: string | null; calculable?: boolean }>;
  personality?: Record<string, { value?: number | null; descriptor?: string | null; calculable?: boolean }>;
};

function bandLabel(band: string | null | undefined): string {
  if (!band) return 'Sin banda';
  const known: Record<string, string> = {
    SOLIDO: 'Sólido',
    SÓLIDO: 'Sólido',
    DOMINANTE: 'Dominante',
    INESTABLE: 'Inestable',
    CRITICO: 'Crítico',
    CRÍTICO: 'Crítico',
    ALERTA: 'Calibración',
    OPTIMO: 'Óptimo',
    ÓPTIMO: 'Óptimo',
    DETRIMENTO: 'Detrimento',
    PROPULSOR: 'Propulsor',
  };
  return known[band] ?? band.charAt(0) + band.slice(1).toLowerCase();
}

export function ExcelProfile({ form, alignment, alignmentError, indexes }: { form: Form; alignment?: AlignmentReading | null; alignmentError?: boolean; indexes?: { alignment: IndexCard | null; depth: IndexCard | null } | null }) {
  const relationsPending = Boolean(form.relationBandPending);
  return (
    <div className="mk-excel-profile">
      <p className="mk-section-eyebrow">PERFIL MAESTRO</p>
      <h1 className="sys-header__title">Tu lectura</h1>
      <p className="mk-excel-profile__note">
        Estas cifras son la lectura nativa del cuestionario. El Índice de alineación MK sale del núcleo de veinte señales. La ficha de alineación declarada sigue aparte.
        {form.identityNote ? ' La identidad muestra su total. La categoría formal sigue en definición.' : ''}
      </p>
      <dl className="mk-excel-profile__list">
        <div>
          <dt>Auditoría</dt>
          <dd>
            <span className="mk-excel-profile__score">
              {form.auditTotal == null
                ? `Pendiente${form.auditCoverage ? `. ${form.auditCoverage.answered} de ${form.auditCoverage.required}` : ''}`
                : `${form.auditTotal} de ${form.auditMax ?? 115}`}
            </span>
            <span className="mk-excel-profile__band">{form.auditNote ?? bandLabel(form.auditBand)}</span>
          </dd>
        </div>
        <div>
          <dt>Relaciones</dt>
          <dd>
            <span className="mk-excel-profile__score">
              {relationsPending || form.relationTotal == null ? '—' : `${form.relationTotal} de 60`}
            </span>
            <span className="mk-excel-profile__band">
              {form.relationNote && form.relationTotal == null
                ? form.relationNote
                : relationsPending
                  ? 'Banda pendiente'
                  : bandLabel(form.relationBand)}
            </span>
          </dd>
        </div>
        <div>
          <dt>Finanzas</dt>
          <dd>
            <span className="mk-excel-profile__score">
              {form.financeTotal == null ? '—' : `${form.financeTotal} de 60`}
            </span>
            <span className="mk-excel-profile__band">{bandLabel(form.financeBand)}</span>
          </dd>
        </div>
        {form.identityTotal != null ? (
          <div>
            <dt>Identidad</dt>
            <dd>
              <span className="mk-excel-profile__score">{form.identityTotal} de {form.identityMax ?? 40}</span>
              <span className="mk-excel-profile__band">{form.identityNote}</span>
            </dd>
          </div>
        ) : null}
        {form.senseTotal != null ? (
          <div>
            <dt>Desarrollo y sentido</dt>
            <dd>
              <span className="mk-excel-profile__score">{form.senseTotal} de 50</span>
              <span className="mk-excel-profile__band">Lectura aparte de la auditoría</span>
            </dd>
          </div>
        ) : null}
      </dl>
      {form.difficulties ? (
        <section>
          <h2>Dificultades y recursos</h2>
          <ul>
            {Object.entries(form.difficulties).map(([name, part]) => (
              <li key={name}>{name}: {part.calculable && part.value != null ? `${part.value} de 18` : 'Pendiente'}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <IndexSummary alignment={indexes?.alignment} depth={indexes?.depth} />
      <section>
        <h2>Alineación declarada</h2>
        {alignmentError ? <p>No se pudo leer la ficha.</p> : null}
        {!alignmentError && (!alignment || alignment.status === 'none') ? (
          <>
            <p>Ficha pendiente. Espíritu, Mente y Cuerpo usan nueve respuestas, tres por pilar. El total aparece solo con las nueve. Una respuesta sin información no vale cero. Parte de las preguntas mira los últimos 14 días. Una cuenta nueva deja eso pendiente, sin inventar un recorrido. El método está en revisión. Seguir a la hoja de ruta no pide esta ficha, y el plan no queda bloqueado.</p>
          </>
        ) : null}
        {!alignmentError && alignment?.status === 'partial' ? (
          <p>
            Ficha parcial, {alignment.coverage.answered} de {alignment.coverage.required}. Sin total.
            {alignment.pillars.E != null ? ` Espíritu ${formatAlignmentValue(alignment.pillars.E)}.` : ''}
            {alignment.pillars.M != null ? ` Mente ${formatAlignmentValue(alignment.pillars.M)}.` : ''}
            {alignment.pillars.C != null ? ` Cuerpo ${formatAlignmentValue(alignment.pillars.C)}.` : ''}
            {alignment.revision != null ? ` Revisión ${alignment.revision}.` : ''}
            Método en revisión. El plan no queda bloqueado.
          </p>
        ) : null}
        {!alignmentError && alignment?.status === 'saved' ? (
          <p>
            {formatAlignmentValue(alignment.total)}. Método en revisión.
            {alignment.savedAt ? ` ${formatAlignmentDate(alignment.savedAt)}.` : ''}
            {alignment.revision != null ? ` Revisión ${alignment.revision}.` : ''}
            {alignment.pillars.E != null ? ` Espíritu ${formatAlignmentValue(alignment.pillars.E)}, mente ${formatAlignmentValue(alignment.pillars.M)}, cuerpo ${formatAlignmentValue(alignment.pillars.C)}.` : ''}
          </p>
        ) : null}
      </section>
      {form.personality ? (
        <section>
          <h2>Personalidad</h2>
          <ul>
            {Object.entries(form.personality).map(([name, part]) => (
              <li key={name}>{part.descriptor ?? `${name}: pendiente`}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <Link href="/proposito" className="mk-btn-primary">Continuar a la hoja de ruta</Link>
    </div>
  );
}
```

## Bifurcación en `PerfilContent`

Si `indices.scoringVersion` empieza por `formulario-score`, se monta `ExcelProfile`. Si no, `SystemReport`. Un total de auditoría ausente no cambia de layout.

```tsx
  const isFormularioReading = typeof rawIndices.scoringVersion === 'string' && rawIndices.scoringVersion.startsWith('formulario-score');
  if (isFormularioReading) {
    return (
      <div className="mk-dashboard">
        <ExcelProfile form={indices as never} alignment={alignment} alignmentError={alignmentError} indexes={indexes} />
        <ReviewVersionNote />
      </div>
    );
  }
```

La carga está en el `useEffect` del mismo archivo: `apiDiagnosticProfile`, `apiDiagnosticProgress` y `journeyState`.

## Payload que escribe `persistFormularioReading`

```ts
  const payload = {
    auditTotal: audit.value,
    auditMax: 115,
    auditBand: null,
    auditNote: audit.descriptor,
    auditCoverage: audit.coverage,
    senseTotal: sense.value,
    senseMax: 50,
    relationTotal: partnerNever ? null : relations.value,
    relationBand: partnerNever || relations.value == null ? null : relations.value <= 28 ? 'DETRIMENTO' : relations.value <= 48 ? 'ALERTA' : 'PROPULSOR',
    relationBandPending: !partnerNever && relations.value == null,
    relationNote: partnerNever ? 'Sin pareja. El círculo íntimo queda fuera. El total de 60 no se calcula.' : null,
    financeTotal: finance.value,
    financeBand: finance.value == null ? null : finance.value <= 24 ? 'CRÍTICO' : finance.value <= 44 ? 'ALERTA' : 'ÓPTIMO',
    identityTotal: identity.value,
    identityMax: 40,
    identityNote: identity.descriptor,
    difficulties: difficulties.parts,
    personality: personality.parts,
    alertCount: signals.length,
    pillarsPending: true,
    scoringVersion: 'formulario-score@1',
  };
```

Relaciones: se excluye la puerta y, si la respuesta es «No tengo ni he tenido pareja», también el módulo `f-rad-002-s1`. El denominador pedido a `scoreBlock` pasa a ser la cantidad de ítems que quedan. El máximo que muestra la pantalla sigue siendo 60, pero en ese caso el total no se publica.

Dificultades: cualquier respuesta cuyo texto empiece por `PR`, `ER`, `PY`, `IN` o `D` más un número entra al grupo. Personalidad: las preguntas con instrumento `personality`, ordenadas por `order`.

## Dónde viven las fórmulas

- Sumas y textos de categoría: `apps/api/src/instrumentos/score.ts`. `scoreAudit`, `auditCategory`, `scoreSense`, `scoreIdentity`, `scoreDifficulties`, `scorePersonality`, `scoreBlock`.
- Armado del payload y puerta de pareja: `apps/api/src/instrumentos/reading.ts`.
- Índice: `normalizeSignal` y `scoreAlignment` en `apps/api/src/instrumentos/core-index.ts`. Las veinte señales, en `CORE_SIGNALS` de `core-definition.ts`.
- Tarjeta que ve la página: `cardFromAlignment` y `alignmentViews` en `core-reading.ts`. `materializeInitialAlignment` no corre si la sesión no está `COMPLETED`, y no pisa una lectura inicial ya creada.
- Ficha declarada: `scoreIad` y `alignmentReading` en `apps/api/src/instrumentos/iad.ts`. `JourneyService.state` la lee con `alignmentReading(purpose.content, purpose.revision)` y no la recalcula.
- Estilos de la lista: `.mk-excel-profile` en `apps/web/app/globals.css`, alrededor de la línea 16103. Columna, máximo 36rem, cifra editorial a la derecha, banda secundaria debajo.
