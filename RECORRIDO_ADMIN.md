# Recorrido de admin, estado para editar

Documento de la superficie actual. Sirve para corregir presentación sin rehacer permisos, cálculos ni persistencia.

`ADMIN_RECORRIDO.md` es la nota del primer armado. Este archivo está más adelante: cinco vistas, índice por hoja de Excel, lector de respuestas y perfil. Si chocan, manda este.

La pantalla es consulta. No escribe respuestas, no firma, no cambia catálogo, índices ni alertas guardadas.

## Entrada

Cuenta local de admin: `admin@maximus-kratos.local`. La clave es la del seed, `ChangeMeAdmin123!`. Con rol `ADMIN`, `/login` abre `/admin`.

En Usuarios, cada fila tiene «Ver recorrido». El menú del shell tiene «Alertas».

| Ruta | Archivo | Qué es |
|---|---|---|
| `/admin/users` | `apps/web/app/admin/users/page.tsx` | Lista de cuentas. El enlace al recorrido se agregó ahí. |
| `/admin/users/[userId]/recorrido` | `apps/web/app/admin/users/[userId]/recorrido/page.tsx` | Página del recorrido. `force-dynamic`, `noindex`. Monta `RecorridoScreen`. |
| `/admin/alertas` | `apps/web/app/admin/alertas/page.tsx` | Bandeja global. No es una vista del recorrido. |

Shell: `apps/web/components/admin-shell.tsx`. El ítem Alertas usa el icono `shield`.

## Qué no hay que tocar

No cambiar Matrix v2, puntajes, estados, cobertura, seguridad, prioridad ni la ruta del diagnóstico. No cambiar fórmulas de auditoría, relaciones, finanzas, identidad, personalidad, dificultades ni el índice de alineación. No reescribir textos firmados. No aplicar la migración `20261016190000_admin_journey_alerts` a la base `maximuskratos` salvo que se pida. Esa migración no está aplicada en local. Por eso la bandeja `/admin/alertas` responde error: la tabla `questionnaire_alerts` no existe.

## Piezas

| Pieza | Rol |
|---|---|
| `apps/web/components/admin/recorrido-screen.tsx` | Cliente. Lee la URL, pide journey, respuestas y alertas, cancela respuestas tardías. |
| `apps/web/components/admin/recorrido-view.tsx` | Las cinco vistas. Casi toda la presentación está en este archivo. |
| `apps/web/components/admin/recorrido-reading.ts` | Texto: estados, hojas Excel, enunciado, respuesta, IKIGAI, hoja firmada. Sin JSX. |
| `apps/web/components/admin/recorrido.module.css` | Estilos solo de esta superficie. Hanken vía `var(--font-body)`. Carbón vía tokens de `globals.css`. |
| `apps/web/lib/api.ts` | `apiAdminJourney`, `apiAdminResponses`, `apiAdminAlerts` y los tipos `AdminJourney`, `AdminResponsePage`, `AdminAlertPage`. `cache: no-store`. |
| `apps/api/src/admin/member-journey.controller.ts` | Rutas. `JwtAuthGuard` + `AdminActorGuard`. `NoStoreInterceptor`. |
| `apps/api/src/admin/member-journey.service.ts` | Consultas. Resumen, página de respuestas, reglas leídas, actividades IKIGAI, alertas persistidas, reconstrucción. |
| `apps/api/src/admin/admin-actor.guard.ts` | El rol se lee de `users` en cada petición. Un token viejo no alcanza. |
| `apps/web/lib/scale-prompts.ts` | Enunciados y anclajes ya separados, por `sourceRef`. El lector los usa solo si el texto guardado empieza por ese enunciado. |
| `apps/web/test/admin-recorrido.test.tsx` | Vistas, hoja firmada, actividades, alertas, búsqueda, página tardía, escalas. |
| `apps/api/test/admin-alerts.test.ts` | Dominio de disparo y de `withoutInternalAlerts`. |
| `apps/api/test/admin-journey.http.test.ts` | HTTP en base aislada `mk_journey_it`. No corre contra `maximuskratos`. |

Prueba web, desde `apps/web`, con Node 22:

`npx vitest run test/admin-recorrido.test.tsx`

## URL

`recorrido-screen.tsx` lee y escribe la query con `router.replace` y `scroll: false`.

| Parámetro | Valores | Efecto |
|---|---|---|
| `vista` | `resumen`, `respuestas`, `perfil`, `proposito`, `alertas` | Vista abierta. Si falta, resumen. |
| `apartado` | `direccion`, `actividades`, `cruce`, `hoja` | Solo dentro de Propósito y hoja. |
| `sessionId` | id de sesión | Si falta, el API elige la de `lastActivityAt` más reciente, no la de más respuestas. Cambiar sesión borra `modulo` y `pagina`. |
| `modulo` | slug | Módulo del lector. Cambiarlo pone `pagina` en 1. |
| `pagina` | número | Página de preguntas. Tamaño real: 30, constante `PAGE` del servicio. |

`patchRecorridoQuery` está en `recorrido-reading.ts`.

Al cambiar `userId` o `sessionId`, la pantalla vacía journey, respuestas y alertas antes de pintar lo nuevo. Una página de otro módulo no se muestra: `Answers` exige `responses.module.slug === modulo`.

## API

Prefijo `/api/v1/admin`. Sin token, 401. Rol distinto de `ADMIN` en la tabla, 403. Una sesión que no es de esa cuenta, 404, sin texto de la otra cuenta.

| Método | Ruta | Uso en pantalla |
|---|---|---|
| GET | `users/:userId/journey?sessionId` | Resumen de la cuenta y de la sesión. |
| GET | `users/:userId/sessions/:sessionId/responses?module&page` | Preguntas de un módulo. |
| GET | `users/:userId/alerts` | La vista Alertas del recorrido ya no pinta esta lista. El screen igual la pide. |
| GET | `alerts` | Bandeja `/admin/alertas`. |
| POST | `alerts/reconstruct` | Preview o escritura de alertas históricas. No se ha corrido sobre `maximuskratos`. |

Cada lectura deja una fila en `admin_access_logs` (actor, cuenta, recurso, id, request). No guarda el texto de la respuesta ni el token. Si la tabla no existe, el log se traga el error `P2021` y la lectura sigue.

### Qué devuelve el journey

`member-journey.service.ts`, método `summary`.

- `account`: id, email, role, onboardingStep.
- `sessions`: orden `lastActivityAt` descendente, luego id.
- `selectedSessionId`.
- `modules`: slug, phase, sheet (`dimensionKey`, el código de hoja), title, intro, answered, total. Orden del catálogo.
- `profile`: payload crudo de `diagnostic_form_results` del formulario `lucas-completo`. El admin ve `alertCount`. El miembro no: `withoutInternalAlerts` lo saca del perfil y del estado del journey.
- `alertState`: `PENDING`, `NONE`, `HISTORY_UNAVAILABLE`, `READY` o `ERROR`. `ERROR` en local es la tabla ausente.
- `alignment`: filas de `core_readings`. `output` tal cual. No se calcula profundidad.
- `declared`: ficha IAD de la revisión de propósito más nueva. No es el índice.
- `direction`: revisión de propósito más nueva. Nombre, estado, enunciado.
- `signed`: última revisión con `confirmedAt`. Contrato y `contractView` guardados. No se reconstruye en vivo.
- `draftIsLater`: hay firma y la revisión más nueva es otra.
- `rules`: evaluación de lectura de las 23 de auditoría. No escribe filas.
- `ikigai.activities`: módulo `e-per-ikigai`. Campo por contexto o por fila, no por posición en el array.
- `ikigai.synthesis`: objeto guardado.
- `ikigai.experiments`: última revisión de cada experimento.

`rules` sale de `ruleReview`: respuestas cuyo `sourceRef` está en `AUDIT_IDS`, pasadas por `auditSignals` y `answersForAlerts`. Se quedan `FIRED` y `NOT_FIRED`. El valor mostrado es el `textEs` de la opción. Excepciones no entran. No se inventa cero.

## Las cinco vistas

Están en `RecorridoView`. El chrome común es el enlace «Volver a usuarios», el nombre (dirección o firma, si no «Sin nombre»), el correo, rol, onboarding, estado de sesión, catálogo y el selector de sesión. Las pestañas se ven desde 768 px. Debajo de eso, un selector «Vista del recorrido».

Onboarding conocido: Términos pendientes, Bienvenida del cuestionario, Cuestionario en curso, Perfil completo, Recorrido listo. Otro valor se muestra en minúsculas, con espacios en vez de guiones bajos.

### Resumen

Cobertura de la sesión (respondidas de total de preguntas). Cinco cifras del payload: auditoría, relaciones, finanzas, identidad, desarrollo y sentido. Si `relationTotal` es nulo, «No disponible», y si hay `relationNote` se imprime debajo. Índice de la sesión elegida, en una línea. Dirección y firma. Conteo de reglas que dispararon. Enlace a la vista Alertas.

Un cero numérico se muestra. Un nulo es «No disponible».

### Respuestas

Archivo de presentación: `Answers` en `recorrido-view.tsx`. Formato de cada pregunta: `presentReading` en `recorrido-reading.ts`.

Escritorio, desde 768 px: columna de 280 px y lector flexible, separación 24 px. Móvil: la columna no se pinta. Hay un `select` con `optgroup` por hoja. El buscador «Buscar módulo» solo filtra el índice ya cargado (título y encabezado de hoja). No cambia `modulo` ni la página de respuestas.

Encabezados de grupo: `sheetHeading`. El código es `modules[].sheet` (`dimensionKey`). Si falta, se infiere del slug.

| Código | Nombre en pantalla | Módulos |
|---|---|---|
| E-AUD-001 | Auditoría inicial | Mentalidad e identidad, Hábitos y acciones, Toma de decisiones y entorno, Soberanía financiera, Calidad de relaciones, Desarrollo y sentido |
| F-RAD-001 | Radiografía física | Condiciones físicas, Antecedentes de salud, Alimentación, Actividad física, Sueño y estrés, Percepción corporal, Optimización física |
| F-RAD-002 | Radiografía relacional | Pareja o núcleo íntimo, Familia, Amistades, Entorno laboral |
| F-RAD-003 | Radiografía financiera | Suficiencia y flujo, Ahorro, Inversión, Deudas, Construcción y proyección |
| E-PER-000 | Perfil | Origen y linaje, Visión, Valores, Estándares, Identidad, Dificultades, Personalidad, IKIGAI, Huella |

El mapa está en `SHEETS`, dentro de `recorrido-reading.ts`. Una hoja nueva cae como código pelado o «Sin hoja». `phase` sigue viniendo (`FASE1`, `FASE2`, `FASE3`) pero el índice ya no agrupa por fase: en el catálogo vivo todo es Fase 1.

Cada fila: nombre a la izquierda, cobertura `5/5` a la derecha. La fila activa tiene fondo tenue y una marca a la izquierda, no un bloque rojo. Hay «Módulo anterior» y «Módulo siguiente» en el orden del catálogo.

Cabecera del lector: hoja, nombre del módulo a 24 px, objetivo del módulo, y «5 preguntas» o «Preguntas 31 a 40 de 40» si hay más de una página.

Cada pregunta es un artículo:

1. «Pregunta N. Escala. Respondida» (o el estado real).
2. Enunciado. Si el texto guardado empieza por el `stem` de `scalePromptFor(sourceRef)`, se muestra solo el enunciado y el texto completo queda en «Texto de captura». Si no empieza así, el texto íntegro va en peso normal y el detalle dice que esta captura no separa los anclajes. No hay un corte genérico por `1 =` ni por `1:`.
3. Respuesta, sin caja interna. Escala: «Respuesta guardada: 3 de 5» con el largo real de las opciones, más la etiqueta guardada si no es el mismo número. No se inventa «A veces». Marcas `1` … `5` con «3, elegida». Anclajes de más de 42 caracteres van a «Ver escala completa». Opción única y múltiple: etiquetas. Texto: párrafo con saltos. JSON de actividad reconocido: respuesta, ámbito y opción. JSON no reconocido: el texto original y una limitación. Excepción: «Estado: No lo sé» (también No aplica, Prefiero no responder, Pendiente, No respondida, Omitida). Un 0 respondido se muestra.
4. «Detalles de captura»: instrumento legible, versión del catálogo, fila (`!R12` pasa a «Fila 12»), fecha, revisión, texto original y limitación. El `sourceRef` crudo no se imprime.

Instrumentos con nombre: audit, sense, body, relations, finance, finance-projection, origin, vision, values, standards, identity, difficulties, personality, ikigai, footprint. Otro código no se muestra.

### Perfil e índices

`Profile` y `ReadingCard` en `recorrido-view.tsx`. `profileReadings`, `personalityText`, `bandLabel`, `Difficulty`.

Orden:

1. Índice de alineación MK. Cifra con `formatAlignmentValue` (coma, dos decimales como máximo). Filas Espíritu, Mente, Cuerpo. Cobertura. «Detalle de la lectura» guarda la versión (`ia-mk-cuest@0.1`) y el valor sin redondear, con coma (`52,1605`). No se muestra `52.1605` al lado de `52,16`.
2. Lecturas del cuestionario, del mismo payload: auditoría, relaciones, finanzas, identidad, desarrollo y sentido. Sin pareja y con `relationNote`, la cifra es «No se calcula» y se muestra la nota. Bandas conocidas pasan por `bandLabel` (ALERTA se lee Calibración). Identidad usa `identityNote` si viene.
3. Interferencias PR, ER, PY, D, de 0 a 18. Recursos IN aparte. Desconocidos al final, con la clave cruda.
4. Personalidad. Si el descriptor es `Nombre: resto`, se muestra el resto con mayúscula inicial. Si no lleva dos puntos, se muestra entero. Así «Sensibilidad emocional intermedia.» no queda en «intermedia.». Si hay promedio calculable, va «3,1 de 5» y la frase debajo.
5. Alineación declarada. Si `declared.status` es `none` o no hay ficha: «No hay ficha declarada. El índice de arriba no la reemplaza.»

El resumen y esta vista repiten las cinco cifras. El resumen no aplica la regla de «No se calcula» de la pareja. Esta vista sí.

### Propósito y hoja

`Purpose`, `Cruce`, `Sheet`, `Contract`. Apartados en pestañas desde 768 px y en un selector en móvil.

- Dirección: estado, revisión, enunciado. Si `draftIsLater`, avisa que el borrador no reemplaza lo firmado.
- Actividades: agrupadas por Pasión, Vocación, Misión, Profesión. Campo no identificado si no hay campo. Ámbito y opción solo si existen. El parseo no evalúa texto arbitrario.
- Cruce: `synthesis.combinations` y experimentos. Valoración y postura tienen etiquetas en `valuationLabel` y `stanceLabel`.
- Hoja: revisión firmada vía `presentSheetItem`. Si el texto guardado ya contiene categoría, descriptor y compromiso, no se repiten. Si el descriptor está duplicado dentro del texto, se deja el texto y la nota «El texto guardado repite una frase.». Sin `contractView`, se muestra `contract` entero.

### Alertas de la cuenta

`Alerts` y `RuleCard`. Fuente: `journey.rules`, no la tabla.

Sin reglas: «No hay alertas.» y «No hay respuestas de auditoría evaluadas en esta sesión.»

Con reglas: «Dispararon (n)» y «Podían gatillar y no lo hicieron (n)». Cada tarjeta usa `questionStem` (el mismo corte seguro del enunciado) y `pointLabel`. `pointLabel` sí puede poner una etiqueta del libro de trabajo aunque la opción guardada sea solo el número. Eso no lo hace el lector de Respuestas. `onRetry` sigue en la firma y no se usa: el error de la tabla no se pinta en esta vista.

La bandeja `/admin/alertas` sigue dependiendo de la tabla. En local muestra el error y el botón Reintentar. No muestra la tabla vacía.

## Estilos

Todo en `recorrido.module.css`. La página no añade margen horizontal: `.admin-main` ya tiene padding.

Tokens: `--font-body`, `--color-text`, `--color-text-secondary`, `--color-surface` (`#141414`), `--color-surface-raised` (`#1c1c1c`).

| Clase | Uso |
|---|---|
| `.page` | Ancho máximo 1440. |
| `.context`, `.panel` | Superficie, radio 16, borde blanco al 9 por ciento. |
| `.tabs`, `.tab`, `.subTab` | Pestañas. Ocultas bajo 768 px. Área táctil 44 px. |
| `.viewSelect`, `.moduleSelect` | Selectores móviles. Ocultos desde 768 px. |
| `.reader` | Desde 768 px: `280px` y `minmax(0, 1fr)`, gap 24 px. |
| `.moduleNav` | Índice. Oculto bajo 768 px. Sin scroll propio. |
| `.moduleRow` | Fila de módulo. Activa: `aria-current`, borde izquierdo claro, fondo al 5 por ciento. |
| `.stageName`, `.stage` | Hoja de Excel. |
| `.moduleTitle` | 24 px. |
| `.objective` | 15 px, interlineado 1,5, máximo 72 ch. |
| `.question` | Una superficie por pregunta. Padding 18 px, radio 12, gap 12. |
| `.prompt` | Enunciado separado. 19 px, peso 600, interlineado 1,45, máximo 72 ch. |
| `.plainPrompt` | Texto íntegro cuando no se pudo separar. Peso 400. |
| `.savedLine` | Cifra de la respuesta. 22 px. |
| `.metaLine` | 13 px. |
| `.meter` | Posiciones de la escala. No son botones. La elegida lleva la palabra «elegida». |
| `.scale` | `details`. El summary mide al menos 44 px. |
| `.scoreLine` | Nombre a la izquierda, cifra a la derecha. |
| `.figure` | Índice, 32 px. |

Quedan clases de intentos anteriores que esta vista ya no usa o usa poco: `.choice`, `.choiceRow`, `.sheetName`, `.moduleList`, `.moduleButton`, `.anchors`. Borrarlas solo después de comprobar que ningún JSX las referencia.

Foco visible: outline de 2 px, offset 3 px, en pestañas, filas, selects, reintentar y el enlace de vuelta.

El admin de escritorio del shell aparece a 960 px (`.admin-mobile-bar` se esconde). La columna de módulos aparece a 768 px, todavía con la barra móvil del admin. En 768 px el lector queda estrecho. Si se mueve el corte, hay que mirar 768 y 960 juntos.

## Dónde corregir cada cosa

| Si se ve mal | Abrir |
|---|---|
| Lista de módulos, búsqueda, hoja, paginación, pregunta | `Answers`, `questionCount`, `endpointNote` en `recorrido-view.tsx` |
| Cómo se parte el enunciado o cómo se lee la respuesta | `presentStem`, `presentReading` en `recorrido-reading.ts` |
| Nombre de una hoja Excel | `SHEETS` y `sheetCode` |
| Columna, fila activa, tarjeta de pregunta, escala | `recorrido.module.css` |
| Que no llegue `sheet` o `instrument` | `moduleCounts` y el mapeo de `responses` en el servicio, y el tipo en `api.ts` |
| Cifras del perfil, personalidad, ficha | `Profile`, `ReadingCard`, `profileReadings`, `personalityText` |
| Hoja firmada repetida | `presentSheetItem` |
| Actividades IKIGAI | `activities` y `readActivityText` en el servicio, `presentActivity` en reading, `activityGroups` en la vista |
| Alertas de la cuenta | `ruleReview` y `Alerts` |
| Bandeja global | `apps/web/app/admin/alertas/page.tsx` |
| Sesión por defecto, firma contra borrador | `summary` en el servicio |
| Query de la URL | `recorrido-screen.tsx` y `patchRecorridoQuery` |

## Huecos conocidos

No son decisiones nuevas. Están así.

- La bandeja global no puede listar alertas hasta que exista la tabla. La vista de la cuenta no depende de esa tabla.
- `pointLabel` en Alertas puede mostrar una etiqueta del libro que la opción guardada no trae. Respuestas no lo hace.
- El resumen trata relación nula como «No disponible» aunque haya nota de pareja. Perfil dice «No se calcula».
- Las cinco lecturas están en Resumen y otra vez en Perfil.
- `declared` sale de la revisión de propósito más nueva, no de la firmada. Si la más nueva es un borrador sin ficha, la pantalla dice que no hay ficha aunque una firma anterior la tuviera. Conviene mirarlo antes de cambiar la frase.
- Profundidad no está. No hay que llamar a `depthView` para rellenarla.
- No hay verificación en navegador de 320, 390, 768 y 1440. Los tests son de comportamiento en jsdom, no de layout.
- El CSS arrastra clases viejas. El JSX de Respuestas ya no usa la columna de tarjetas ni el grupo «Fase 1».


## Estilos de cada pieza

Las clases viven en `apps/web/components/admin/recorrido.module.css`. El JSX usa `styles.nombre`. Abajo está el archivo entero. Esta tabla dice qué clase pinta cada cosa.

### Chrome de la cuenta

Clases: `.page`, `.back`, `.context`, `.title`, `.quiet`, `.metaRow`, `.label`, `.field`, `.select`, `.tabs`, `.tab`, `.viewSelect`.

Desde 768 px el título pasa a 30 px, las pestañas se muestran y `.viewSelect` se esconde. El foco está en el bloque `:focus-visible` de `.tab`, `.select` y `.back`.

### Resumen

Clases: `.panel`, `.viewTitle`, `.note`, `.copy`, `.pairs`, `.pair`, `.subTitle`, `.linkish`.

`.pair dd` es la cifra, 20 px, tabular. Desde 768 px `.pairs` queda en dos columnas.

### Respuestas, índice

Clases: `.reader`, `.moduleNav`, `.navTitle`, `.stageName`, `.moduleRow`, `.moduleName`, `.coverage`, `.moduleSelect`.

`.moduleNav` está en `display: none` hasta 768 px. Ahí el lector pasa a `grid-template-columns: 280px minmax(0, 1fr)` y `gap: 24px`. `.moduleSelect` se esconde desde 768 px. La fila activa es `.moduleRow[aria-current='true']`.

### Respuestas, lector y pregunta

Clases: `.reading`, `.readingHead`, `.stage`, `.moduleTitle`, `.objective`, `.count`, `.stack`, `.question`, `.metaLine`, `.prompt`, `.plainPrompt`, `.savedLine`, `.answerText`, `.note`, `.meter`, `.scale`, `.pager`, `.retry`.

`.prompt` es el enunciado separado. `.plainPrompt` es el texto íntegro. `.savedLine` es la cifra. `.meter span[data-chosen='true']` marca la posición elegida. `.scale` es el `details`.

### Perfil e índices

Clases: `.panel`, `.viewTitle`, `.subTitle`, `.metaLine`, `.figure`, `.scoreList`, `.scoreLine`, `.note`, `.copy`, `.scale`.

`.figure` es el índice, 32 px. `.scoreLine` pone el nombre a la izquierda y la cifra a la derecha.

### Propósito y hoja

Clases: `.tabs`, `.subTab`, `.moduleSelect`, `.copy`, `.answer`, `.note`, `.subTitle`, `.activity`, `.answerText`, `.stack`.

`.answer` es el bloque con fondo del enunciado firmado o de la dirección. `.activity` es cada actividad o combinación, separada por un borde superior.

### Alertas de la cuenta

Clases: `.panel`, `.viewTitle`, `.copy`, `.note`, `.subTitle`, `.stack`, `.fired`, `.clear`, `.kicker`, `.prompt`, `.answerText`.

`.fired` lleva borde rojo al 45 por ciento. `.clear` usa el mismo borde discreto que la pregunta.

### Bandeja /admin/alertas

Reutiliza `.page`, `.panel`, `.pairs`, `.field`, `.select`, `.note`, `.cards`, `.alertCard`, `.copy`, `.tableWrap`, `.retry`.

Desde 768 px `.cards` se esconde y se ve la tabla. Bajo 768 px `.tableWrap` se esconde.

### Clases que el JSX ya no usa

`.choice`, `.choiceRow`, `.sheetName`, `.moduleList`, `.moduleButton`. Siguen en el CSS. No pintan la pantalla actual.

## Código

El bloque de cada archivo es el fuente de hoy. Si se edita la pantalla, hay que editar el archivo, no solo este documento.


### `apps/web/components/admin/recorrido-screen.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RecorridoView } from '@/components/admin/recorrido-view';
import { apartadoFrom, patchRecorridoQuery, vistaFrom, type Apartado, type Vista } from '@/components/admin/recorrido-reading';
import { apiAdminAlerts, apiAdminJourney, apiAdminResponses, type AdminAlertPage, type AdminJourney, type AdminResponsePage } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';

export function RecorridoScreen() {
  const params = useParams<{ userId: string }>();
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const userId = params.userId;
  const sessionId = search.get('sessionId') ?? undefined;
  const vista = vistaFrom(search.get('vista'));
  const apartado = apartadoFrom(search.get('apartado'));
  const modulo = search.get('modulo');
  const pagina = Math.max(1, Number(search.get('pagina')) || 1);
  const [journey, setJourney] = useState<AdminJourney | null>(null);
  const [responses, setResponses] = useState<AdminResponsePage | null>(null);
  const [alerts, setAlerts] = useState<AdminAlertPage | null>(null);
  const [error, setError] = useState('');
  const [alertTick, setAlertTick] = useState(0);

  function replace(patch: Record<string, string | null>) {
    router.replace(`${pathname}${patchRecorridoQuery(new URLSearchParams(search.toString()), patch)}`, { scroll: false });
  }

  useEffect(() => {
    const token = getAccessToken();
    setJourney(null);
    setResponses(null);
    setAlerts(null);
    setError('');
    if (!token || !userId) return;
    let cancel = false;
    apiAdminJourney(token, userId, sessionId)
      .then((next) => { if (!cancel) setJourney(next); })
      .catch(() => { if (!cancel) setError('No se pudo leer el recorrido.'); });
    return () => { cancel = true; };
  }, [userId, sessionId]);

  useEffect(() => {
    const token = getAccessToken();
    const current = journey?.selectedSessionId;
    if (!token || !userId || !current || !modulo || vista !== 'respuestas') return;
    let cancel = false;
    setResponses(null);
    apiAdminResponses(token, userId, current, modulo, pagina)
      .then((page) => { if (!cancel) setResponses(page); })
      .catch(() => { if (!cancel) setError('No se pudo leer el módulo.'); });
    return () => { cancel = true; };
  }, [userId, journey?.selectedSessionId, modulo, pagina, vista]);

  useEffect(() => {
    const token = getAccessToken();
    const current = journey?.selectedSessionId;
    if (!token || !userId || !current) return;
    let cancel = false;
    apiAdminAlerts(token, { userId, sessionId: current })
      .then((page) => { if (!cancel) setAlerts(page); })
      .catch(() => { if (!cancel) setAlerts({ state: 'ERROR', page: 1, total: 0, items: [] }); });
    return () => { cancel = true; };
  }, [userId, journey?.selectedSessionId, alertTick]);

  return (
    <RecorridoView
      journey={journey}
      responses={responses}
      alerts={alerts}
      error={error}
      vista={vista}
      apartado={apartado}
      modulo={modulo}
      pagina={pagina}
      onVista={(next: Vista) => replace({ vista: next })}
      onApartado={(next: Apartado) => replace({ apartado: next, vista: 'proposito' })}
      onSession={(next) => replace({ sessionId: next })}
      onModule={(slug) => replace({ modulo: slug, pagina: '1', vista: 'respuestas' })}
      onPage={(page) => replace({ pagina: String(page), modulo, vista: 'respuestas' })}
      onRetryAlerts={() => setAlertTick((value) => value + 1)}
    />
  );
}
```

### `apps/web/components/admin/recorrido-view.tsx`

```tsx
import { useState, type KeyboardEvent } from 'react';
import type { AdminAlertPage, AdminJourney, AdminResponsePage } from '@/lib/api';
import { formatAlignmentDate, formatAlignmentValue } from '@/lib/journey-api';
import styles from './recorrido.module.css';
import {
  apartadoFrom,
  answerStatusLabel,
  catalogLabel,
  directionLabel,
  fieldLabel,
  kindLabel,
  instrumentLabel,
  onboardingLabel,
  pointLabel,
  presentReading,
  questionStem,
  rowLabel,
  sheetHeading,
  presentActivity,
  presentSheetItem,
  questionTypeLabel,
  roleLabel,
  sessionStatusLabel,
  vistaFrom,
  type Apartado,
  type SheetItem,
  type Vista,
} from './recorrido-reading';

const VISTA_LABEL = {
  resumen: 'Resumen',
  respuestas: 'Respuestas',
  perfil: 'Perfil e índices',
  proposito: 'Propósito y hoja',
  alertas: 'Alertas',
} as const;

const APARTADO_LABEL = {
  direccion: 'Dirección',
  actividades: 'Actividades IKIGAI',
  cruce: 'Cruce',
  hoja: 'Hoja de ruta',
} as const;

const DIFFICULTY: Array<[string, string, 'interferencia' | 'recurso']> = [
  ['PR', 'Patrones repetitivos', 'interferencia'],
  ['ER', 'Emociones rechazadas', 'interferencia'],
  ['PY', 'Proyección', 'interferencia'],
  ['D', 'Excusas y autoengaño', 'interferencia'],
  ['IN', 'Recursos de integración', 'recurso'],
];

const FACTORS = ['Apertura', 'Responsabilidad', 'Extraversión', 'Amabilidad', 'Sensibilidad emocional'];

export function RecorridoView({
  journey,
  responses,
  alerts,
  error,
  vista,
  apartado,
  modulo,
  pagina,
  onVista,
  onApartado,
  onSession,
  onModule,
  onPage,
  onRetryAlerts,
}: {
  journey: AdminJourney | null;
  responses: AdminResponsePage | null;
  alerts: AdminAlertPage | null;
  error: string;
  vista: Vista;
  apartado: Apartado;
  modulo: string | null;
  pagina: number;
  onVista: (vista: Vista) => void;
  onApartado: (apartado: Apartado) => void;
  onSession: (sessionId: string) => void;
  onModule: (slug: string) => void;
  onPage: (page: number) => void;
  onRetryAlerts: () => void;
}) {
  if (error) return <p className="admin-alert admin-alert--error" role="alert">{error}</p>;
  if (!journey) return <p>Leyendo el recorrido.</p>;
  const session = journey.sessions.find((item) => item.id === journey.selectedSessionId) ?? null;
  const name = journey.direction?.name || journey.signed?.name || 'Sin nombre';
  return (
    <div className={styles.page}>
      <a className={styles.back} href="/admin/users">Volver a usuarios</a>
      <header className={styles.context}>
        <div>
          <h1 className={styles.title}>{name}</h1>
          <p className={styles.quiet}>{journey.account.email}</p>
        </div>
        <dl className={styles.metaRow}>
          <div><dt>Rol</dt><dd>{roleLabel(journey.account.role)}</dd></div>
          <div><dt>Onboarding</dt><dd>{onboardingLabel(journey.account.onboardingStep)}</dd></div>
          <div><dt>Cuestionario</dt><dd>{session ? sessionStatusLabel(session.status) : 'Sin sesión'}</dd></div>
          {session ? <div><dt>Catálogo</dt><dd>{catalogLabel(session.definitionRef, session.version)}</dd></div> : null}
        </dl>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="session-select">Sesión</label>
          <select id="session-select" className={styles.select} value={journey.selectedSessionId ?? ''} onChange={(event) => onSession(event.target.value)}>
            {journey.sessions.length === 0 ? <option value="">Sin sesión</option> : null}
            {journey.sessions.map((item) => (
              <option key={item.id} value={item.id}>
                {formatAlignmentDate(item.lastActivityAt) || item.lastActivityAt.slice(0, 10)}. {sessionStatusLabel(item.status)}. {catalogLabel(item.definitionRef, item.version)}
              </option>
            ))}
          </select>
        </div>
      </header>
      <nav className={styles.tabs} role="tablist" aria-label="Vista del recorrido" onKeyDown={(event) => moveTab(event, vista, onVista)}>
        {(Object.keys(VISTA_LABEL) as Vista[]).map((item) => (
          <button key={item} type="button" className={styles.tab} role="tab" aria-selected={vista === item} onClick={() => onVista(item)}>{VISTA_LABEL[item]}</button>
        ))}
      </nav>
      <div className={`${styles.field} ${styles.viewSelect}`}>
        <label className={styles.label} htmlFor="vista-select">Vista del recorrido</label>
        <select id="vista-select" className={styles.select} value={vista} onChange={(event) => onVista(vistaFrom(event.target.value))}>
          {(Object.keys(VISTA_LABEL) as Vista[]).map((item) => <option key={item} value={item}>{VISTA_LABEL[item]}</option>)}
        </select>
      </div>
      {vista === 'resumen' ? <Summary journey={journey} sessionId={journey.selectedSessionId} onVista={onVista} /> : null}
      {vista === 'respuestas' ? <Answers journey={journey} responses={responses} modulo={modulo} pagina={pagina} onModule={onModule} onPage={onPage} /> : null}
      {vista === 'perfil' ? <Profile journey={journey} /> : null}
      {vista === 'proposito' ? <Purpose journey={journey} apartado={apartado} onApartado={onApartado} /> : null}
      {vista === 'alertas' ? <Alerts journey={journey} onRetry={onRetryAlerts} /> : null}
    </div>
  );
}

function Summary({ journey, sessionId, onVista }: { journey: AdminJourney; sessionId: string | null; onVista: (vista: Vista) => void }) {
  const profile = journey.profile;
  const reading = journey.alignment.find((row) => row.sessionId === sessionId) ?? null;
  const output = reading?.output as { general?: number | null; pillars?: { ESPIRITU?: number | null; MENTE?: number | null; CUERPO?: number | null } } | undefined;
  const covered = journey.modules.reduce((sum, module) => sum + module.answered, 0);
  const required = journey.modules.reduce((sum, module) => sum + module.total, 0);
  const rules = journey.rules ?? [];
  const firedCount = rules.filter((rule) => rule.status === 'FIRED').length;
  return (
    <div className={styles.panel}>
      <h2 className={styles.viewTitle}>Resumen</h2>
      <p className={styles.note}>Las respuestas son de la sesión elegida. La dirección y la firma son de la cuenta.</p>
      <p className={styles.copy}>Cobertura de esta sesión: {covered} de {required}.</p>
      <dl className={styles.pairs}>
        <Pair label="Auditoría" value={score(profile?.auditTotal, profile?.auditMax ?? 115)} />
        <Pair label="Relaciones" value={profile?.relationTotal == null ? 'No disponible' : `${profile.relationTotal} de 60`} note={typeof profile?.relationNote === 'string' ? profile.relationNote : null} />
        <Pair label="Finanzas" value={profile?.financeTotal == null ? 'No disponible' : `${profile.financeTotal} de 60`} />
        <Pair label="Identidad" value={profile?.identityTotal == null ? 'No disponible' : `${profile.identityTotal} de ${profile.identityMax ?? 40}`} />
        <Pair label="Desarrollo y sentido" value={profile?.senseTotal == null ? 'No disponible' : `${profile.senseTotal} de 50`} />
      </dl>
      <h3 className={styles.subTitle}>Índice de alineación MK</h3>
      {reading ? <p className={styles.copy}>General {shown(output?.general)}. Espíritu {shown(output?.pillars?.ESPIRITU)}. Mente {shown(output?.pillars?.MENTE)}. Cuerpo {shown(output?.pillars?.CUERPO)}.</p> : <p className={styles.note}>No hay una lectura guardada de esta sesión.</p>}
      <p className={styles.copy}>Dirección: {directionLabel(journey.direction?.status)}. Firma: {journey.signed ? 'Firmada' : 'Sin firma'}.</p>
      <p className={styles.copy}>Alertas: {rules.length === 0 ? 'Sin respuestas evaluadas' : firedCount === 0 ? 'No hay' : String(firedCount)}.</p>
      <button type="button" className={styles.linkish} onClick={() => onVista('alertas')}>Abrir alertas</button>
    </div>
  );
}

function Answers({ journey, responses, modulo, pagina, onModule, onPage }: { journey: AdminJourney; responses: AdminResponsePage | null; modulo: string | null; pagina: number; onModule: (slug: string) => void; onPage: (page: number) => void }) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const visible = journey.modules.filter((module) => !needle || `${module.title} ${sheetHeading(module)}`.toLowerCase().includes(needle));
  const groups = new Map<string, AdminJourney['modules']>();
  for (const module of visible) {
    const key = sheetHeading(module);
    groups.set(key, [...(groups.get(key) ?? []), module]);
  }
  const selected = journey.modules.find((module) => module.slug === modulo) ?? null;
  const selectedAt = journey.modules.findIndex((module) => module.slug === modulo);
  const previous = selectedAt > 0 ? journey.modules[selectedAt - 1] : null;
  const following = selectedAt >= 0 && selectedAt < journey.modules.length - 1 ? journey.modules[selectedAt + 1] : null;
  const pageMatches = Boolean(responses && selected && responses.module.slug === selected.slug);
  const shownPage = pageMatches ? responses : null;
  const size = shownPage?.pageSize ?? 30;
  const from = shownPage ? (shownPage.page - 1) * size + 1 : 0;
  const to = shownPage ? Math.min(shownPage.page * size, shownPage.total) : 0;
  const session = journey.sessions.find((item) => item.id === journey.selectedSessionId) ?? null;
  const version = session ? catalogLabel(session.definitionRef, session.version) : null;
  return (
    <div className={styles.panel}>
      <h2 className={styles.viewTitle}>Respuestas</h2>
      <div className={styles.reader}>
        <nav className={styles.moduleNav} aria-label="Módulos">
          <h3 className={styles.navTitle}>Módulos</h3>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="module-search">Buscar módulo</label>
            <input id="module-search" className={styles.select} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          {[...groups.entries()].map(([stage, modules]) => (
            <div key={stage}>
              <p className={styles.stageName}>{stage}</p>
              {modules.map((module) => (
                <button key={module.slug} type="button" className={styles.moduleRow} aria-current={module.slug === modulo ? 'true' : undefined} onClick={() => onModule(module.slug)}>
                  <span className={styles.moduleName}>{module.title}</span>
                  <span className={styles.coverage}>{module.answered}/{module.total}</span>
                </button>
              ))}
            </div>
          ))}
          {visible.length === 0 ? <p className={styles.note}>Ningún módulo coincide.</p> : null}
        </nav>
        <div className={styles.reading}>
          <div className={`${styles.field} ${styles.moduleSelect}`}>
            <label className={styles.label} htmlFor="module-select">Módulo</label>
            <select id="module-select" className={styles.select} value={modulo ?? ''} onChange={(event) => onModule(event.target.value)}>
              <option value="">Elige un módulo</option>
              {[...moduleGroups(journey.modules).entries()].map(([stage, modules]) => (
                <optgroup key={stage} label={stage}>
                  {modules.map((module) => <option key={module.slug} value={module.slug}>{module.title} ({module.answered}/{module.total})</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          {selected ? (
            <header className={styles.readingHead}>
              <p className={styles.stage}>{sheetHeading(selected)}</p>
              <h3 className={styles.moduleTitle}>{selected.title}</h3>
              {selected.intro ? <p className={styles.objective}>{selected.intro}</p> : null}
            </header>
          ) : <p className={styles.note}>Elige un módulo.</p>}
          {shownPage ? <p className={styles.count}>{questionCount(shownPage.total, from, to, size)}</p> : null}
          {shownPage?.module.intro && shownPage.module.intro !== selected?.intro ? <p className={styles.objective}>{shownPage.module.intro}</p> : null}
          <div className={styles.stack}>
            {shownPage?.items.map((item, index) => {
              const reading = presentReading(item);
              const number = (shownPage.page - 1) * size + index + 1;
              const provenance = [instrumentLabel(item.instrument), version, rowLabel(item.sourceRef)].filter(Boolean);
              const ends = reading.marks && !reading.longScale ? endpointNotes(item.anchors) : [];
              return (
                <article key={item.questionId} id={`pregunta-${item.questionId}`} className={styles.question}>
                  <p className={styles.metaLine}>Pregunta {number}. {questionTypeLabel(item.type)}. {answerStatusLabel(item.status)}</p>
                  <h4 className={reading.plainTitle ? styles.plainPrompt : styles.prompt}>{reading.title}</h4>
                  {reading.headline ? <p className={styles.savedLine}>{reading.headline}</p> : reading.lines.length > 0 ? <p className={styles.metaLine}>Respuesta guardada</p> : null}
                  {reading.lines.map((line) => <p key={line} className={styles.answerText}>{line}</p>)}
                  {reading.fields.map((field) => <p key={field.label} className={styles.note}>{field.label}: {field.value}</p>)}
                  {reading.marks ? (
                    <div className={styles.meter}>
                      {reading.marks.map((mark, markIndex) => <span key={`${mark.token}-${markIndex}`} data-chosen={mark.chosen ? 'true' : undefined}>{mark.chosen ? `${mark.token}, elegida` : mark.token}</span>)}
                    </div>
                  ) : null}
                  {ends.map((line) => <p key={line} className={styles.note}>{line}</p>)}
                  {reading.longScale ? (
                    <details className={styles.scale}>
                      <summary>Ver escala completa</summary>
                      <ol>
                        {reading.options.map((option) => <li key={option.label} data-chosen={option.chosen ? 'true' : undefined}>{option.chosen ? `${option.label}. Elegida` : option.label}</li>)}
                      </ol>
                    </details>
                  ) : null}
                  {provenance.length > 0 || item.answeredAt || item.revision != null || reading.captureText || reading.limitation ? (
                    <details className={styles.scale}>
                      <summary>Detalles de captura</summary>
                      {provenance.length > 0 ? <p className={styles.note}>{provenance.join('. ')}.</p> : null}
                      {item.answeredAt ? <p className={styles.note}>{formatAlignmentDate(item.answeredAt)}</p> : null}
                      {item.revision != null ? <p className={styles.note}>Revisión {item.revision}.</p> : null}
                      {reading.captureText ? <p className={styles.note}>Texto de captura: {reading.captureText}</p> : null}
                      {reading.limitation ? <p className={styles.note}>{reading.limitation}</p> : null}
                    </details>
                  ) : null}
                </article>
              );
            })}
          </div>
          <div className={styles.pager}>
            {previous ? <button type="button" className={styles.retry} onClick={() => onModule(previous.slug)}>Módulo anterior</button> : null}
            {shownPage && shownPage.total > size ? <button type="button" className={styles.retry} disabled={pagina <= 1} onClick={() => onPage(pagina - 1)}>Anterior</button> : null}
            {shownPage && shownPage.total > size ? <button type="button" className={styles.retry} disabled={pagina * size >= shownPage.total} onClick={() => onPage(pagina + 1)}>Siguiente</button> : null}
            {following ? <button type="button" className={styles.retry} onClick={() => onModule(following.slug)}>Módulo siguiente</button> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function moduleGroups(modules: AdminJourney['modules']) {
  const groups = new Map<string, AdminJourney['modules']>();
  for (const module of modules) {
    const key = sheetHeading(module);
    groups.set(key, [...(groups.get(key) ?? []), module]);
  }
  return groups;
}

function questionCount(total: number, from: number, to: number, size: number): string {
  if (total === 0) return 'Sin preguntas.';
  if (total <= size) return total === 1 ? '1 pregunta' : `${total} preguntas`;
  return `Preguntas ${from} a ${to} de ${total}`;
}

function endpointNotes(anchors: { label: string; value: string }[]): string[] {
  if (anchors.length < 2) return [];
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  return [endpointNote(first), endpointNote(last)].filter((line): line is string => Boolean(line));
}

function endpointNote(anchor: { label: string; value: string }): string | null {
  const label = anchor.label.trim();
  if (!label || label === anchor.value.trim() || label.length > 42) return null;
  const token = /^\d+$/.test(anchor.value.trim()) ? anchor.value.trim() : label;
  if (label === token) return null;
  return `${token}. ${label}`;
}

function Profile({ journey }: { journey: AdminJourney }) {
  const profile = journey.profile ?? {};
  const difficulties = (profile.difficulties ?? {}) as Record<string, { value?: number | null; calculable?: boolean; descriptor?: string | null }>;
  const personality = (profile.personality ?? {}) as Record<string, { value?: number | null; calculable?: boolean; descriptor?: string | null }>;
  const known = new Set(DIFFICULTY.map(([key]) => key));
  const unknown = Object.keys(difficulties).filter((key) => !known.has(key)).sort();
  const readings = profileReadings(profile);
  return (
    <div className={styles.panel}>
      <h2 className={styles.viewTitle}>Perfil e índices</h2>
      <h3 className={styles.subTitle}>Índice de alineación MK</h3>
      {journey.alignment.length === 0 ? <p className={styles.note}>No hay una lectura guardada.</p> : journey.alignment.map((row) => <ReadingCard key={row.id} row={row} sessionId={journey.selectedSessionId} />)}
      <h3 className={styles.subTitle}>Lecturas del cuestionario</h3>
      <div className={styles.scoreList}>
        {readings.map((row) => (
          <div key={row.label}>
            <div className={styles.scoreLine}>
              <span>{row.label}</span>
              <span>{row.figure}</span>
            </div>
            {row.note ? <p className={styles.note}>{row.note}</p> : null}
          </div>
        ))}
      </div>
      <h3 className={styles.subTitle}>Interferencias declaradas</h3>
      <p className={styles.note}>Un valor mayor indica más interferencia declarada.</p>
      <div className={styles.scoreList}>
        {DIFFICULTY.filter(([, , kind]) => kind === 'interferencia').map(([key, label]) => <Difficulty key={key} label={label} part={difficulties[key]} />)}
      </div>
      <h3 className={styles.subTitle}>Recursos de integración</h3>
      <p className={styles.note}>Un valor mayor indica más recursos de integración declarados.</p>
      <Difficulty label="Recursos de integración" part={difficulties.IN} />
      {unknown.map((key) => <Difficulty key={key} label={key} part={difficulties[key]} />)}
      <h3 className={styles.subTitle}>Personalidad</h3>
      <p className={styles.note}>Cinco lecturas separadas. No hay un total único.</p>
      {FACTORS.map((name) => {
        const part = personality[name];
        const text = personalityText(name, part?.descriptor);
        const value = part?.calculable && typeof part.value === 'number' ? `${formatAlignmentValue(part.value)} de 5` : null;
        return (
          <div key={name}>
            <div className={styles.scoreLine}>
              <span>{name}</span>
              <span>{value ?? text ?? 'Pendiente'}</span>
            </div>
            {value && text ? <p className={styles.note}>{text}</p> : null}
          </div>
        );
      })}
      <h3 className={styles.subTitle}>Alineación declarada</h3>
      {journey.declared && journey.declared.status !== 'none' ? (
        <p className={styles.copy}>{journey.declared.status === 'partial' ? 'Parcial' : 'Guardada'}. Total {shown(journey.declared.total)}. Cobertura {journey.declared.coverage.answered} de {journey.declared.coverage.required}. Revisión {journey.declared.revision ?? 'No disponible'}.</p>
      ) : <p className={styles.note}>No hay ficha declarada. El índice de arriba no la reemplaza.</p>}
    </div>
  );
}

function ReadingCard({ row, sessionId }: { row: AdminJourney['alignment'][number]; sessionId: string | null }) {
  const output = row.output as { general?: number | null; pillars?: { ESPIRITU?: number | null; MENTE?: number | null; CUERPO?: number | null }; coverage?: { eligible?: number; scored?: number; required?: number } };
  const own = row.sessionId === sessionId ? 'Esta sesión' : row.sessionId ? 'Otra sesión' : 'Sesión no indicada';
  const shownGeneral = shown(output.general);
  const exact = typeof output.general === 'number' ? String(output.general).replace('.', ',') : '';
  const covered = output.coverage?.eligible ?? output.coverage?.scored;
  return (
    <article>
      <p className={styles.metaLine}>{kindLabel(row.kind)}. {own}. {formatAlignmentDate(row.computedAt)}.</p>
      <p className={styles.figure}>{shownGeneral}</p>
      <div className={styles.scoreList}>
        <div className={styles.scoreLine}><span>Espíritu</span><span>{shown(output.pillars?.ESPIRITU)}</span></div>
        <div className={styles.scoreLine}><span>Mente</span><span>{shown(output.pillars?.MENTE)}</span></div>
        <div className={styles.scoreLine}><span>Cuerpo</span><span>{shown(output.pillars?.CUERPO)}</span></div>
      </div>
      <p className={styles.note}>Cobertura {covered ?? 'No disponible'} de {output.coverage?.required ?? 'No disponible'}.</p>
      <details className={styles.scale}>
        <summary>Detalle de la lectura</summary>
        <p className={styles.note}>Versión {row.methodVersion}.</p>
        {exact && exact !== shownGeneral ? <p className={styles.note}>Valor guardado: {exact}.</p> : null}
      </details>
    </article>
  );
}

function Purpose({ journey, apartado, onApartado }: { journey: AdminJourney; apartado: Apartado; onApartado: (apartado: Apartado) => void }) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.viewTitle}>Propósito y hoja</h2>
      <div className={styles.tabs} role="tablist" aria-label="Apartado">
        {(Object.keys(APARTADO_LABEL) as Apartado[]).map((item) => (
          <button key={item} type="button" className={styles.subTab} role="tab" aria-selected={apartado === item} onClick={() => onApartado(item)}>{APARTADO_LABEL[item]}</button>
        ))}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="apartado-select">Apartado</label>
        <select id="apartado-select" className={`${styles.select} ${styles.moduleSelect}`} value={apartado} onChange={(event) => onApartado(apartadoFrom(event.target.value))}>
          {(Object.keys(APARTADO_LABEL) as Apartado[]).map((item) => <option key={item} value={item}>{APARTADO_LABEL[item]}</option>)}
        </select>
      </div>
      {apartado === 'direccion' ? (
        <div>
          <p className={styles.copy}>Dirección: {directionLabel(journey.direction?.status)}. Revisión {journey.direction?.revision ?? 'No disponible'}.</p>
          {journey.direction?.statement ? <p className={styles.answer}>{journey.direction.statement}</p> : <p className={styles.note}>Sin formulación guardada.</p>}
          {journey.draftIsLater ? <p className={styles.note}>Hay un borrador posterior. No reemplaza lo firmado.</p> : null}
        </div>
      ) : null}
      {apartado === 'actividades' ? (
        <div>
          {journey.ikigai.activities.length === 0 ? <p className={styles.note}>Sin actividades en esta sesión.</p> : null}
          {[...activityGroups(journey.ikigai.activities).entries()].map(([field, items]) => (
            <section key={field}>
              <h3 className={styles.subTitle}>{field}</h3>
              <div className={styles.stack}>
                {items.map((shown, index) => (
                  <article key={`${shown.answer}-${index}`} className={styles.activity}>
                    <p className={styles.answerText}>{shown.answer}</p>
                    {shown.ambit && shown.ambit !== 'Sin ámbito' ? <p className={styles.note}>Ámbito: {shown.ambit}</p> : null}
                    {shown.option && shown.option !== 'Sin opción' ? <p className={styles.note}>Opción: {shown.option}</p> : null}
                    {shown.raw ? <p className={styles.note}>Registro original: {shown.raw}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
      {apartado === 'cruce' ? <Cruce synthesis={journey.ikigai.synthesis} experiments={journey.ikigai.experiments} /> : null}
      {apartado === 'hoja' ? <Sheet journey={journey} /> : null}
    </div>
  );
}

function Cruce({ synthesis, experiments }: { synthesis: unknown; experiments: AdminJourney['ikigai']['experiments'] }) {
  const combinations = synthesis && typeof synthesis === 'object' && Array.isArray((synthesis as { combinations?: unknown }).combinations)
    ? (synthesis as { combinations: Record<string, unknown>[] }).combinations
    : [];
  return (
    <div>
      {combinations.length === 0 ? <p className={styles.note}>Sin combinaciones guardadas.</p> : combinations.map((row, index) => (
        <article key={String(row.id ?? index)} className={styles.activity}>
          <h3 className={styles.subTitle}>Combinación {index + 1}</h3>
          {typeof row.reason === 'string' ? <p className={styles.copy}>Motivo. {row.reason}</p> : null}
          {typeof row.valuation === 'string' ? <p className={styles.copy}>Valoración. {valuationLabel(row.valuation)}</p> : null}
          {typeof row.experiment === 'string' ? <p className={styles.copy}>Experimento. {row.experiment}</p> : null}
          {typeof row.learningQuestion === 'string' ? <p className={styles.copy}>Pregunta. {row.learningQuestion}</p> : null}
          {row.fieldStance && typeof row.fieldStance === 'object' ? Object.entries(row.fieldStance as Record<string, string>).map(([field, stance]) => (
            <p key={field} className={styles.copy}>{fieldLabel(field)}. {stanceLabel(stance)}</p>
          )) : null}
        </article>
      ))}
      <h3 className={styles.subTitle}>Evidencia del experimento</h3>
      {experiments.length === 0 ? <p className={styles.note}>Sin experimento guardado.</p> : experiments.map((item) => (
        <article key={item.id} className={styles.activity}>
          <p className={styles.copy}>Estado. {item.status}</p>
          <p className={styles.copy}>Hipótesis. {item.hypothesis ?? 'Sin hipótesis.'}</p>
          {item.sample ? <p className={styles.copy}>Muestra. {item.sample}</p> : null}
          {item.opportunity ? <p className={styles.copy}>Oportunidad. {item.opportunity}</p> : null}
          {item.missing ? <p className={styles.copy}>Falta. {item.missing}</p> : null}
        </article>
      ))}
    </div>
  );
}

function Sheet({ journey }: { journey: AdminJourney }) {
  return (
    <div>
      {journey.draftIsLater ? <p className={styles.note}>Hay un borrador posterior. No reemplaza lo firmado.</p> : null}
      {journey.signed ? (
        <div>
          <h3 className={styles.subTitle}>Versión firmada</h3>
          <p className={styles.note}>Revisión {journey.signed.revision}. {journey.signed.confirmedAt ? formatAlignmentDate(journey.signed.confirmedAt) : 'Sin fecha'}. {journey.signed.name ?? 'Sin nombre'}.</p>
          <Contract view={journey.signed.contractView} text={journey.signed.contract} />
        </div>
      ) : <p className={styles.note}>Sin firma.</p>}
      {journey.draftIsLater && journey.direction?.statement ? (
        <div>
          <h3 className={styles.subTitle}>Borrador posterior</h3>
          <p className={styles.answer}>{journey.direction.statement}</p>
        </div>
      ) : null}
    </div>
  );
}

function Contract({ view, text }: { view: unknown; text: string | null }) {
  const articles = view && typeof view === 'object' && Array.isArray((view as { articles?: unknown }).articles)
    ? (view as { articles: { title?: string; items?: SheetItem[] }[] }).articles
    : null;
  if (!articles) return <p className={styles.answer}>{text ?? 'Sin texto firmado.'}</p>;
  return (
    <div>
      {articles.map((article, index) => (
        <section key={`${article.title ?? 'bloque'}-${index}`}>
          <h4 className={styles.subTitle}>{article.title}</h4>
          {article.items?.map((item, itemIndex) => {
            const line = presentSheetItem(item);
            return (
              <div key={`${index}-${itemIndex}`}>
                {line.label ? <p className={styles.copy}>{line.label}</p> : null}
                {line.parts.map((part) => <p key={part} className={styles.answer}>{part}</p>)}
                {line.text ? <p className={styles.answer}>{line.text}</p> : null}
                {line.note ? <p className={styles.note}>{line.note}</p> : null}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

function Alerts({ journey }: { journey: AdminJourney; onRetry: () => void }) {
  const rules = journey.rules ?? [];
  const fired = rules.filter((rule) => rule.status === 'FIRED');
  const clear = rules.filter((rule) => rule.status === 'NOT_FIRED');
  if (rules.length === 0) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.viewTitle}>Alertas</h2>
        <p className={styles.copy}>No hay alertas.</p>
        <p className={styles.note}>No hay respuestas de auditoría evaluadas en esta sesión.</p>
      </div>
    );
  }
  return (
    <div className={styles.panel}>
      <h2 className={styles.viewTitle}>Alertas</h2>
      {fired.length === 0 ? <p className={styles.copy}>No hay alertas.</p> : <h3 className={styles.subTitle}>Dispararon ({fired.length})</h3>}
      <div className={styles.stack}>{fired.map((rule) => <RuleCard key={rule.questionRef} rule={rule} tone="fired" />)}</div>
      <h3 className={styles.subTitle}>Podían gatillar y no lo hicieron ({clear.length})</h3>
      {clear.length === 0 ? <p className={styles.note}>No hay respuestas evaluadas fuera de la regla.</p> : <div className={styles.stack}>{clear.map((rule) => <RuleCard key={rule.questionRef} rule={rule} tone="clear" />)}</div>}
    </div>
  );
}

function RuleCard({ rule, tone }: { rule: AdminJourney['rules'][number]; tone: 'fired' | 'clear' }) {
  return (
    <article id={`pregunta-${rule.questionId ?? rule.questionRef}`} className={tone === 'fired' ? styles.fired : styles.clear}>
      <p className={styles.kicker}>{tone === 'fired' ? 'Disparó' : 'No disparó'}</p>
      <h4 className={styles.prompt}>{questionStem(rule.text, rule.questionRef)}</h4>
      <p className={styles.answerText}>{pointLabel(rule.value, rule.questionRef) ?? rule.value ?? 'Sin valor guardado'}</p>
      <p className={styles.note}>{rule.rule}</p>
    </article>
  );
}

function activityGroups(activities: AdminJourney['ikigai']['activities']) {
  const groups = new Map<string, ReturnType<typeof presentActivity>[]>();
  for (const activity of activities) {
    const shown = presentActivity(activity);
    groups.set(shown.field, [...(groups.get(shown.field) ?? []), shown]);
  }
  return groups;
}

function personalityText(name: string, descriptor?: string | null): string | null {
  const text = descriptor?.trim();
  if (!text) return null;
  const prefix = `${name}:`;
  if (!text.startsWith(prefix)) return text;
  const rest = text.slice(prefix.length).trim();
  if (!rest) return text;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

function profileReadings(profile: Record<string, unknown>): Array<{ label: string; figure: string; note: string | null }> {
  const text = (key: string) => typeof profile[key] === 'string' && profile[key] ? profile[key] as string : null;
  const num = (key: string) => typeof profile[key] === 'number' ? profile[key] as number : null;
  const auditTotal = num('auditTotal');
  const coverage = profile.auditCoverage as { answered?: number; required?: number } | null;
  const auditFigure = auditTotal == null
    ? (coverage && typeof coverage.answered === 'number' ? `Pendiente. ${coverage.answered} de ${coverage.required}` : 'No disponible')
    : `${auditTotal} de ${num('auditMax') ?? 115}`;
  const relationTotal = num('relationTotal');
  const relationNote = text('relationNote');
  const partnerOut = Boolean(relationNote) && relationTotal == null;
  const relationPending = profile.relationBandPending === true;
  const relationFigure = partnerOut ? 'No se calcula' : relationPending || relationTotal == null ? 'No disponible' : `${relationTotal} de 60`;
  const relationShown = partnerOut ? relationNote : relationPending ? 'Banda pendiente' : text('relationBand') ? bandLabel(text('relationBand') as string) : null;
  const financeTotal = num('financeTotal');
  const identityTotal = num('identityTotal');
  const senseTotal = num('senseTotal');
  return [
    { label: 'Auditoría', figure: auditFigure, note: text('auditNote') ?? (text('auditBand') ? bandLabel(text('auditBand') as string) : null) },
    { label: 'Relaciones', figure: relationFigure, note: relationShown },
    { label: 'Finanzas', figure: financeTotal == null ? 'No disponible' : `${financeTotal} de 60`, note: text('financeBand') ? bandLabel(text('financeBand') as string) : null },
    { label: 'Identidad', figure: identityTotal == null ? 'No disponible' : `${identityTotal} de ${num('identityMax') ?? 40}`, note: text('identityNote') },
    { label: 'Desarrollo y sentido', figure: senseTotal == null ? 'No disponible' : `${senseTotal} de 50`, note: senseTotal == null ? null : 'Lectura aparte de la auditoría' },
  ];
}

function bandLabel(band: string): string {
  const known: Record<string, string> = {
    SOLIDO: 'Sólido',
    'SÓLIDO': 'Sólido',
    DOMINANTE: 'Dominante',
    INESTABLE: 'Inestable',
    CRITICO: 'Crítico',
    'CRÍTICO': 'Crítico',
    ALERTA: 'Calibración',
    OPTIMO: 'Óptimo',
    'ÓPTIMO': 'Óptimo',
    DETRIMENTO: 'Detrimento',
    PROPULSOR: 'Propulsor',
  };
  return known[band] ?? band;
}

function Difficulty({ label, part }: { label: string; part?: { value?: number | null; calculable?: boolean } }) {
  const value = part?.calculable && part.value != null ? `${part.value} de 18` : 'Pendiente';
  return (
    <div className={styles.scoreLine}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Pair({ label, value, note }: { label: string; value: string; note?: string | null }) {
  return (
    <div className={styles.pair}>
      <dt className={styles.label}>{label}</dt>
      <dd>{value}</dd>
      {note ? <p className={styles.note}>{note}</p> : null}
    </div>
  );
}

function score(value: unknown, max: unknown): string {
  if (typeof value !== 'number') return 'No disponible';
  return `${value} de ${typeof max === 'number' ? max : 115}`;
}

function shown(value: number | null | undefined): string {
  if (typeof value !== 'number') return 'No disponible';
  return formatAlignmentValue(value);
}

function valuationLabel(value: string): string {
  if (value === 'RECOGNIZED') return 'Reconocido';
  if (value === 'PARTIAL') return 'Parcial';
  if (value === 'NOT_RECOGNIZED') return 'No reconocido';
  if (value === 'INSUFFICIENT') return 'Insuficiente';
  return value;
}

function stanceLabel(value: string): string {
  if (value === 'RECOGNIZE') return 'Lo reconoce';
  if (value === 'DOUBT') return 'Lo duda';
  if (value === 'UNKNOWN') return 'Sin información';
  return value;
}

function moveTab(event: KeyboardEvent<HTMLElement>, vista: Vista, onVista: (vista: Vista) => void) {
  const order = Object.keys(VISTA_LABEL) as Vista[];
  const index = order.indexOf(vista);
  if (event.key === 'ArrowRight') onVista(order[(index + 1) % order.length]);
  if (event.key === 'ArrowLeft') onVista(order[(index - 1 + order.length) % order.length]);
}
```

### `apps/web/components/admin/recorrido-reading.ts`

```ts
import { scalePromptFor } from '@/lib/scale-prompts';

export type SheetItem = {
  label?: string;
  text?: string;
  category?: string;
  descriptor?: string;
  commitment?: string;
};

export type SheetLine = { label: string; parts: string[]; text: string | null; note: string | null };

const FIELD_LABEL: Record<string, string> = {
  pasion: 'Pasión',
  vocacion: 'Vocación',
  mision: 'Misión',
  profesion: 'Profesión',
};

export function fieldLabel(field: string | null | undefined): string {
  if (!field) return 'Campo no identificado';
  return FIELD_LABEL[field] ?? 'Campo no identificado';
}

export function sessionStatusLabel(status: string): string {
  if (status === 'ACTIVE') return 'En curso';
  if (status === 'COMPLETED') return 'Completada';
  if (status === 'ABANDONED') return 'Abandonada';
  return status;
}

export function directionLabel(status: string | null | undefined): string {
  if (status === 'EXPLORANDO') return 'Explorando';
  if (status === 'PROVISIONAL') return 'Provisional';
  if (status === 'CONFIRMADO_POR_USUARIO') return 'Confirmada por la persona';
  if (!status) return 'Sin estado';
  return status;
}

export function kindLabel(kind: string): string {
  if (kind === 'INITIAL') return 'Lectura inicial';
  if (kind === 'REMEASURE') return 'Medición posterior';
  if (kind === 'RECONSTRUCTED') return 'Reconstrucción';
  if (kind === 'DOCUMENTED') return 'Trabajo documentado';
  return kind;
}

export function catalogLabel(definitionRef: string | null, version: string): string {
  const number = /@(\d+)$/.exec(version)?.[1];
  const name = definitionRef === 'formulario-completo' ? 'Cuestionario completo' : 'Catálogo';
  return number ? `${name}, versión ${number}` : name;
}

export function answerStatusLabel(status: string): string {
  const known: Record<string, string> = {
    ANSWERED: 'Respondida',
    UNANSWERED: 'No respondida',
    UNKNOWN: 'No lo sé',
    NOT_APPLICABLE: 'No aplica',
    DECLINED: 'Prefiero no responder',
    PENDING: 'Pendiente',
    SKIPPED: 'Omitida',
  };
  return known[status] ?? status;
}

export function questionTypeLabel(type: string): string {
  const known: Record<string, string> = {
    SCALE_1_5: 'Escala',
    SINGLE_CHOICE: 'Una opción',
    MULTI_CHOICE: 'Varias opciones',
    FREE_TEXT: 'Texto',
    RANKING: 'Orden',
  };
  return known[type] ?? type;
}

const SHEETS: Record<string, string> = {
  'E-AUD-001': 'Auditoría inicial',
  'F-RAD-001': 'Radiografía física',
  'F-RAD-002': 'Radiografía relacional',
  'F-RAD-003': 'Radiografía financiera',
  'E-PER-000': 'Perfil',
};

export function sheetCode(module: { slug: string; sheet?: string | null }): string {
  if (module.sheet) return module.sheet;
  if (module.slug.startsWith('e-aud')) return 'E-AUD-001';
  if (module.slug.startsWith('f-rad-001')) return 'F-RAD-001';
  if (module.slug.startsWith('f-rad-002')) return 'F-RAD-002';
  if (module.slug.startsWith('f-rad-003')) return 'F-RAD-003';
  if (module.slug.startsWith('e-per')) return 'E-PER-000';
  return '';
}

export function sheetLabel(module: { slug: string; sheet?: string | null }): string {
  const code = sheetCode(module);
  return SHEETS[code] ?? (code || 'Sin hoja');
}

export function sheetHeading(module: { slug: string; sheet?: string | null }): string {
  const code = sheetCode(module);
  const name = SHEETS[code];
  if (code && name) return `${code}. ${name}`;
  return code || 'Sin hoja';
}

export function cellLabel(sourceRef: string | null | undefined): string | null {
  const match = /!(R\d+)$/.exec(sourceRef ?? '');
  return match?.[1] ?? null;
}

export function questionStem(text: string, sourceRef?: string | null): string {
  return presentStem(text, sourceRef).title;
}

export function presentStem(text: string, sourceRef?: string | null): { title: string; separated: boolean } {
  const stored = text.trim();
  const stem = scalePromptFor(sourceRef)?.stem?.trim();
  if (stem && stored.startsWith(stem) && stored.slice(stem.length).trim().length > 0) {
    return { title: stem, separated: true };
  }
  return { title: stored, separated: false };
}

export function pointLabel(value: string | null | undefined, sourceRef?: string | null): string | null {
  if (!value) return null;
  const numeric = Number(value);
  const points = scalePromptFor(sourceRef)?.points;
  if (!points || !Number.isInteger(numeric)) return null;
  const label = points[numeric]?.trim();
  if (!label || label === value) return null;
  return label;
}

const ONBOARDING: Record<string, string> = {
  TERMS_PENDING: 'Términos pendientes',
  DIAGNOSTICO_BIENVENIDA: 'Bienvenida del cuestionario',
  FASE1_EN_CURSO: 'Cuestionario en curso',
  PROFILE_COMPLETE: 'Perfil completo',
  BLUEPRINT_READY: 'Recorrido listo',
};

export function onboardingLabel(step: string): string {
  return ONBOARDING[step] ?? step.replaceAll('_', ' ').toLowerCase();
}

const INSTRUMENTS: Record<string, string> = {
  audit: 'Auditoría',
  sense: 'Desarrollo y sentido',
  body: 'Cuerpo',
  relations: 'Relaciones',
  finance: 'Finanzas',
  'finance-projection': 'Construcción y proyección',
  origin: 'Origen y linaje',
  vision: 'Visión',
  values: 'Valores',
  standards: 'Estándares',
  identity: 'Identidad',
  difficulties: 'Dificultades',
  personality: 'Personalidad',
  ikigai: 'IKIGAI',
  footprint: 'Huella',
};

export function instrumentLabel(instrument: string | null | undefined): string | null {
  if (!instrument) return null;
  return INSTRUMENTS[instrument] ?? null;
}

export function rowLabel(sourceRef: string | null | undefined): string | null {
  const match = /!R(\d+)$/.exec(sourceRef ?? '');
  return match ? `Fila ${match[1]}` : null;
}

export type ReadingAnchor = { label: string; value: string };

export type SavedReading = {
  title: string;
  plainTitle: boolean;
  limitation: string | null;
  captureText: string | null;
  headline: string | null;
  lines: string[];
  fields: { label: string; value: string }[];
  marks: { token: string; chosen: boolean }[] | null;
  options: { label: string; chosen: boolean }[];
  longScale: boolean;
};

const BRIEF_ANCHOR = 42;

export function presentReading(item: {
  text: string;
  type: string;
  status: string;
  sourceRef?: string | null;
  anchors: ReadingAnchor[];
  selected: ReadingAnchor[];
  freeText: string | null;
}): SavedReading {
  const stem = presentStem(item.text, item.sourceRef);
  const scale = item.type === 'SCALE_1_5' && item.anchors.length >= 2 && item.anchors.length <= 7;
  const longScale = scale && item.anchors.some((anchor) => anchor.label.trim().length > BRIEF_ANCHOR);
  const chosen = new Set(item.selected.map((option) => option.value));
  const options = item.anchors.map((anchor) => ({ label: anchor.label, chosen: chosen.has(anchor.value) }));
  const base = {
    title: stem.title,
    plainTitle: !stem.separated,
    limitation: item.type === 'SCALE_1_5' && !stem.separated ? 'El texto de captura no separa el enunciado de los anclajes.' : null,
    captureText: stem.separated ? item.text.trim() : null,
    options,
    longScale,
  };
  if (item.status !== 'ANSWERED') {
    return { ...base, headline: `Estado: ${answerStatusLabel(item.status)}`, lines: [], fields: [], marks: null };
  }
  const activity = structuredText(item.freeText?.trim() ?? '');
  if (activity) {
    return {
      ...base,
      headline: null,
      lines: [activity.answer],
      fields: [
        activity.ambit ? { label: 'Ámbito', value: activity.ambit } : null,
        activity.option ? { label: 'Opción', value: activity.option } : null,
      ].filter((field): field is { label: string; value: string } => Boolean(field)),
      marks: null,
    };
  }
  const loose = item.freeText?.trim() ?? '';
  if (loose.startsWith('{')) {
    return {
      ...base,
      limitation: 'El formato de la respuesta no se reconoce.',
      headline: null,
      lines: [loose],
      fields: [],
      marks: null,
    };
  }
  if (scale) {
    const option = item.selected[0];
    const token = option ? pointToken(option, item.anchors) : '';
    const known = option ? item.anchors.some((anchor) => anchor.value === option.value || anchor.label.trim() === token) : false;
    const meaning = option && option.label.trim() && option.label.trim() !== token ? option.label.trim() : null;
    return {
      ...base,
      headline: token ? `Respuesta guardada: ${token}${known ? ` de ${item.anchors.length}` : ''}` : 'Sin texto guardado',
      lines: meaning ? [meaning] : [],
      fields: [],
      marks: item.anchors.map((anchor) => ({
        token: pointToken(anchor, item.anchors),
        chosen: chosen.has(anchor.value),
      })),
    };
  }
  if (item.type === 'MULTI_CHOICE' || item.type === 'SINGLE_CHOICE' || item.type === 'RANKING') {
    const lines = item.selected.map((option) => option.label.trim()).filter((label) => label.length > 0);
    return { ...base, headline: lines.length ? null : 'Sin texto guardado', lines, fields: [], marks: null };
  }
  const lines = [...item.selected.map((option) => option.label.trim()), loose].filter((line) => line.length > 0);
  return { ...base, headline: null, lines: lines.length ? lines : ['Sin texto guardado'], fields: [], marks: null };
}

function pointToken(option: ReadingAnchor, anchors: ReadingAnchor[]): string {
  const label = option.label.trim();
  const value = option.value.trim();
  if (/^\d+$/.test(value)) return value;
  if (/^\d+$/.test(label)) return label;
  const index = anchors.findIndex((anchor) => anchor.value === option.value);
  return String(index >= 0 ? index + 1 : 1);
}

export function phaseLabel(phase: string | undefined): string {
  if (phase === 'FASE1') return 'Fase 1';
  if (phase === 'FASE2') return 'Fase 2';
  if (phase === 'FASE3') return 'Fase 3';
  return phase || 'Sin etapa';
}

export function roleLabel(role: string): string {
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'USER') return 'Miembro';
  return role;
}

function compact(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function presentSheetItem(item: SheetItem): SheetLine {
  const label = item.label?.trim() ?? '';
  const category = item.category?.trim() ?? '';
  const descriptor = item.descriptor?.trim() ?? '';
  const commitment = item.commitment?.trim() ?? '';
  const text = item.text?.trim() ?? '';
  const structured = [category, descriptor, commitment].filter(Boolean);
  if (!text) return { label, parts: structured, text: null, note: null };
  if (descriptor && compact(text).split(compact(descriptor)).length - 1 > 1) {
    return { label, parts: [], text, note: 'El texto guardado repite una frase.' };
  }
  const covered = structured.length > 0 && structured.every((part) => compact(text).includes(compact(part)));
  if (covered) return { label, parts: structured, text: null, note: null };
  if (structured.length) return { label, parts: structured, text, note: null };
  return { label, parts: [], text, note: null };
}

export type StoredActivity = {
  sourceRef?: string | null;
  field?: string | null;
  ambit?: string;
  option?: string;
  answer?: string;
  recognized?: boolean;
  raw?: string | null;
};

export function presentAnswer(item: { status: string; selected: { label: string }[]; freeText: string | null }): { primary: string[]; detail: string[] } {
  const selected = item.selected.map((option) => option.label.trim()).filter(Boolean);
  const text = item.freeText?.trim() ?? '';
  if (item.status !== 'ANSWERED') {
    return { primary: [answerStatusLabel(item.status), ...selected, ...plainText(text)], detail: [] };
  }
  const activity = structuredText(text);
  if (activity) {
    return {
      primary: [...selected, activity.answer],
      detail: [activity.ambit ? `Ámbito: ${activity.ambit}` : '', activity.option ? `Opción: ${activity.option}` : ''].filter(Boolean),
    };
  }
  const primary = [...selected, ...plainText(text)];
  return { primary: primary.length ? primary : ['Sin texto guardado'], detail: [] };
}

function plainText(text: string): string[] {
  return text && !text.startsWith('{') ? [text] : [];
}

function structuredText(text: string): { answer: string; ambit: string; option: string } | null {
  if (!text.startsWith('{')) return null;
  const read = readLoose(text);
  if (read.raw) return null;
  return {
    answer: read.answer,
    ambit: read.ambit === 'Sin ámbito' ? '' : read.ambit,
    option: read.option === 'Sin opción' ? '' : read.option,
  };
}

export function presentActivity(activity: StoredActivity | string): { answer: string; ambit: string; option: string; field: string; raw: string | null } {
  if (typeof activity === 'string') {
    const read = readLoose(activity);
    return { answer: read.answer, ambit: read.ambit, option: read.option, field: 'Campo no identificado', raw: read.raw };
  }
  return {
    answer: activity.answer?.trim() || 'Sin respuesta',
    ambit: activity.ambit?.trim() || 'Sin ámbito',
    option: activity.option?.trim() || 'Sin opción',
    field: fieldLabel(activity.field),
    raw: activity.recognized ? null : activity.raw ?? null,
  };
}

function readLoose(text: string): { answer: string; ambit: string; option: string; raw: string | null } {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{')) return { answer: trimmed, ambit: 'Sin ámbito', option: 'Sin opción', raw: null };
  try {
    const parsed = JSON.parse(trimmed) as { answer?: unknown; activity?: unknown; ambit?: unknown; option?: unknown };
    const answer = typeof parsed.answer === 'string' ? parsed.answer.trim()
      : typeof parsed.activity === 'string' ? parsed.activity.trim() : '';
    if (!answer) return { answer: trimmed, ambit: 'Sin ámbito', option: 'Sin opción', raw: trimmed };
    return {
      answer,
      ambit: typeof parsed.ambit === 'string' && parsed.ambit.trim() ? parsed.ambit.trim() : 'Sin ámbito',
      option: typeof parsed.option === 'string' && parsed.option.trim() ? parsed.option.trim() : 'Sin opción',
      raw: null,
    };
  } catch {
    return { answer: trimmed, ambit: 'Sin ámbito', option: 'Sin opción', raw: trimmed };
  }
}

export const VISTAS = ['resumen', 'respuestas', 'perfil', 'proposito', 'alertas'] as const;
export type Vista = (typeof VISTAS)[number];
export const APARTADOS = ['direccion', 'actividades', 'cruce', 'hoja'] as const;
export type Apartado = (typeof APARTADOS)[number];

export function vistaFrom(value: string | null): Vista {
  return VISTAS.includes(value as Vista) ? value as Vista : 'resumen';
}

export function apartadoFrom(value: string | null): Apartado {
  return APARTADOS.includes(value as Apartado) ? value as Apartado : 'direccion';
}

export function patchRecorridoQuery(current: URLSearchParams, patch: Record<string, string | null>): string {
  const next = new URLSearchParams(current);
  if (patch.sessionId) {
    next.delete('modulo');
    next.delete('pagina');
  }
  if (patch.modulo) next.set('pagina', '1');
  for (const [key, value] of Object.entries(patch)) {
    if (!value) next.delete(key);
    else next.set(key, value);
  }
  const text = next.toString();
  return text ? `?${text}` : '';
}
```

### `apps/web/components/admin/recorrido.module.css`

```css
.page {
  box-sizing: border-box;
  width: 100%;
  max-width: 1440px;
  min-width: 0;
  display: grid;
  gap: 24px;
  font-family: var(--font-body);
  color: var(--color-text, #f5f5f5);
}

.page *,
.page *::before,
.page *::after { box-sizing: border-box; }

.back {
  color: var(--color-text-secondary, #b5b5b5);
  font-size: 0.875rem;
  text-decoration: none;
}

.context {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 20px;
  border: 1px solid rgb(255 255 255 / 9%);
  border-radius: 16px;
  background: var(--color-surface, #141414);
}

.title {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1.625rem;
  font-weight: 600;
  line-height: 1.2;
  text-transform: none;
}

.metaRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: 0;
}

.metaRow div { display: grid; gap: 2px; min-width: 0; }

.metaRow dt,
.label {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary, #b5b5b5);
}

.metaRow dd,
.quiet {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.field { display: grid; gap: 8px; min-width: 0; }

.select,
.moduleSelect {
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid rgb(255 255 255 / 16%);
  border-radius: 10px;
  background: var(--color-surface-raised, #1c1c1c);
  color: var(--color-text, #f5f5f5);
  font: inherit;
}

.tabs {
  display: none;
  flex-wrap: wrap;
  gap: 8px;
}

.choiceRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.choice {
  display: grid;
  gap: 2px;
  flex: 1 1 168px;
  max-width: 240px;
}

.tab,
.subTab,
.moduleButton,
.retry {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 10px;
  background: transparent;
  color: var(--color-text, #f5f5f5);
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.3;
  text-align: left;
  text-transform: none;
  letter-spacing: 0;
  cursor: pointer;
}

.tab[aria-selected='true'],
.subTab[aria-selected='true'],
.moduleButton[aria-current='true'] {
  border-color: rgb(192 1 0 / 55%);
  background: rgb(192 1 0 / 12%);
}

.tab:focus-visible,
.subTab:focus-visible,
.moduleButton:focus-visible,
.moduleRow:focus-visible,
.select:focus-visible,
.retry:focus-visible,
.back:focus-visible {
  outline: 2px solid var(--color-text, #f5f5f5);
  outline-offset: 3px;
}

.panel {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 20px;
  border: 1px solid rgb(255 255 255 / 9%);
  border-radius: 16px;
  background: var(--color-surface, #141414);
}

.viewTitle {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
  text-transform: none;
}

.subTitle {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  text-transform: none;
}

.copy,
.answer,
.objective {
  margin: 0;
  max-width: 72ch;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.objective {
  font-size: 0.9375rem;
  line-height: 1.5;
}

.answer {
  padding: 12px;
  border-radius: 10px;
  background: rgb(255 255 255 / 4%);
}

.pairs {
  display: grid;
  gap: 16px;
  margin: 0;
}

.pair { display: grid; gap: 8px; min-width: 0; }

.pair dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.2;
}

.note { margin: 0; max-width: 72ch; font-size: 0.875rem; line-height: 1.5; color: var(--color-text-secondary, #b5b5b5); }

.linkish {
  justify-self: start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-text, #f5f5f5);
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.reader {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.moduleNav { display: none; min-width: 0; }

.navTitle {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
}

.stageName {
  margin: 14px 0 2px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
  color: var(--color-text-secondary, #b5b5b5);
}

.moduleRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 0;
  border-left: 3px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--color-text, #f5f5f5);
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 400;
  line-height: 1.35;
  text-align: left;
  cursor: pointer;
}

.moduleRow[aria-current='true'] {
  background: rgb(255 255 255 / 5%);
  border-left-color: var(--color-text, #f5f5f5);
}

.moduleName { min-width: 0; overflow-wrap: anywhere; }

.coverage {
  flex: none;
  font-variant-numeric: tabular-nums;
  font-size: 0.8125rem;
  color: var(--color-text-secondary, #b5b5b5);
}

.reading { display: grid; gap: 16px; min-width: 0; }

.readingHead { display: grid; gap: 4px; min-width: 0; }

.stage {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--color-text-secondary, #b5b5b5);
}

.moduleTitle {
  margin: 0;
  max-width: 36ch;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.25;
}

.count { margin: 0; font-size: 0.8125rem; color: var(--color-text-secondary, #b5b5b5); }

.stack {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.moduleList { display: none; }

.sheetName {
  margin: 16px 0 0;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-text-secondary, #b5b5b5);
}

.moduleList > div:first-child .sheetName { margin-top: 0; }

.meter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meter span {
  min-width: 36px;
  min-height: 36px;
  display: grid;
  place-items: center;
  padding: 4px 8px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 8px;
  font-size: 0.8125rem;
  line-height: 1.2;
}

.meter span[data-chosen='true'] {
  border-color: var(--color-text, #f5f5f5);
  font-weight: 600;
}

.scoreList { display: grid; gap: 8px; }

.scoreLine {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: baseline;
  padding-top: 8px;
  border-top: 1px solid rgb(255 255 255 / 8%);
}

.scoreLine span:last-child {
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.moduleButton {
  display: grid;
  gap: 4px;
  width: 100%;
}

.question,
.fired,
.clear {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 18px;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 12px;
  background: var(--color-surface-raised, #1c1c1c);
}

.fired { border-color: rgb(192 1 0 / 45%); }
.clear { border-color: rgb(255 255 255 / 8%); }

.kicker,
.metaLine {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  color: var(--color-text-secondary, #b5b5b5);
}

.prompt,
.plainPrompt {
  margin: 0;
  max-width: 72ch;
  font-family: var(--font-body);
  font-size: 1.1875rem;
  font-weight: 600;
  line-height: 1.45;
  text-transform: none;
  overflow-wrap: anywhere;
}

.plainPrompt { font-size: 1rem; font-weight: 400; line-height: 1.5; }

.savedLine {
  margin: 0;
  max-width: 72ch;
  font-size: 1.375rem;
  font-weight: 600;
  line-height: 1.3;
}

.answerText {
  margin: 0;
  max-width: 68ch;
  font-size: 1.0625rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.scale { margin: 0; max-width: 68ch; }

.scale summary {
  min-height: 44px;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--color-text-secondary, #b5b5b5);
}

.scale summary:focus-visible {
  outline: 2px solid var(--color-text, #f5f5f5);
  outline-offset: 3px;
}

.scale ol {
  display: grid;
  gap: 8px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.scale li {
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.9375rem;
  line-height: 1.45;
  color: var(--color-text-secondary, #b5b5b5);
}

.scale li[data-chosen='true'] {
  background: rgb(192 1 0 / 12%);
  color: var(--color-text, #f5f5f5);
  font-weight: 600;
}

.activity,
.alertCard {
  display: grid;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid rgb(255 255 255 / 8%);
}

.tableWrap { min-width: 0; overflow-x: auto; }

.cards { display: grid; gap: 16px; }

.figure { font-variant-numeric: tabular-nums; font-size: 2rem; font-weight: 600; line-height: 1; margin: 0; }

.pager { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

@media (min-width: 768px) {
  .context,
  .panel { padding: 24px; }
  .title { font-size: 1.875rem; }
  .viewTitle { font-size: 1.375rem; }
  .tabs { display: flex; }
  .viewSelect,
  .moduleSelect { display: none; }
  .reader {
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }
  .moduleNav { display: grid; gap: 4px; align-content: start; }
  .pairs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cards { display: none; }
}

@media (max-width: 767px) {
  .tableWrap { display: none; }
}
```

### `apps/web/app/admin/users/[userId]/recorrido/page.tsx`

```tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { RecorridoScreen } from '@/components/admin/recorrido-screen';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Recorrido',
  robots: { index: false, follow: false },
};

export default function RecorridoPage() {
  return (
    <Suspense fallback={<p>Leyendo el recorrido.</p>}>
      <RecorridoScreen />
    </Suspense>
  );
}
```

### `apps/web/app/admin/alertas/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import styles from '@/components/admin/recorrido.module.css';
import { apiAdminAlerts, type AdminAlertPage } from '@/lib/api';
import { formatAlignmentDate } from '@/lib/journey-api';
import { getAccessToken } from '@/lib/auth-storage';

export default function AlertasPage() {
  const [page, setPage] = useState(1);
  const [module, setModule] = useState('');
  const [rule, setRule] = useState('');
  const [data, setData] = useState<AdminAlertPage | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const token = getAccessToken();
    setData(null);
    setError('');
    if (!token) return;
    let cancel = false;
    apiAdminAlerts(token, { page, module: module.trim() || undefined, rule: rule.trim() || undefined })
      .then((next) => { if (!cancel) setData(next); })
      .catch(() => { if (!cancel) setError('No se pudo consultar las alertas.'); });
    return () => { cancel = true; };
  }, [page, module, rule, tick]);

  const failed = Boolean(error) || data?.state === 'ERROR';
  return (
    <div className={styles.page}>
      <AdminPageHeader title="Alertas" description="Reglas del cuestionario. Solo el administrador las consulta." />
      <div className={styles.panel}>
        <div className={styles.pairs}>
          <label className={styles.field}>Módulo<input className={styles.select} value={module} onChange={(event) => { setPage(1); setModule(event.target.value); }} /></label>
          <label className={styles.field}>Regla<input className={styles.select} value={rule} onChange={(event) => { setPage(1); setRule(event.target.value); }} /></label>
        </div>
        {failed ? <p role="alert">No se pudo consultar las alertas. <button type="button" className={styles.retry} onClick={() => setTick((value) => value + 1)}>Reintentar</button></p> : null}
        {!failed && data?.state === 'READY' && data.items.length === 0 ? <p className={styles.note}>No hay alertas.</p> : null}
        {!failed && data && data.items.length > 0 ? <ul className={styles.cards}>
          {data?.items.map((item) => (
            <li key={item.id} className={styles.alertCard}>
              <Link href={`/admin/users/${item.userId}/recorrido?sessionId=${item.sessionId}&vista=respuestas&modulo=${item.moduleSlug ?? ''}#pregunta-${item.questionId ?? ''}`}>{item.email}</Link>
              <p className={styles.copy}>{item.productRule}</p>
              <p className={styles.note}>{item.provenance === 'RECONSTRUCTED' ? 'Reconstruida' : 'Registrada'}. {item.matchesCurrentResponse ? 'Vigente' : 'No vigente'}. {formatAlignmentDate(item.detectedAt)}</p>
            </li>
          ))}
        </ul> : null}
        {!failed && data && data.items.length > 0 ? <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>Cuenta</th><th>Regla</th><th>Procedencia</th><th>Vigencia</th><th>Detección</th></tr></thead>
            <tbody>
              {data?.items.map((item) => (
                <tr key={item.id}>
                  <td><Link href={`/admin/users/${item.userId}/recorrido?sessionId=${item.sessionId}&vista=respuestas&modulo=${item.moduleSlug ?? ''}`}>{item.email}</Link></td>
                  <td>{item.productRule}</td>
                  <td>{item.provenance === 'RECONSTRUCTED' ? 'Reconstruida' : 'Registrada'}</td>
                  <td>{item.matchesCurrentResponse ? 'Vigente' : 'No vigente'}</td>
                  <td>{formatAlignmentDate(item.detectedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> : null}
        {data && page * 30 < data.total ? <button type="button" className={styles.retry} onClick={() => setPage((current) => current + 1)}>Siguiente</button> : null}
      </div>
    </div>
  );
}
```
