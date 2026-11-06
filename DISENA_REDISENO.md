# Diseña tu plan: rediseño del 4 nov 2026, consolidado el 5 nov

Qué cambió en `/disenar` y en la revisión de Actúa, por qué y con qué contrato. Complementa las secciones 5, 8 y 9 de [PRODUCTO_VIABLE.md](PRODUCTO_VIABLE.md). Las secciones 1 y 2 son el diagnóstico de partida. El resto describe el código vigente.

## 1. Problemas del sistema anterior

- `/disenar` montaba tres flujos distintos: cinco pasos (`DesignChangeFirst`), la entrada antigua de plantillas en tres pasos (`MentalidadStart` y `MentalidadPlanSteps`) y el formulario de «Prefiero organizarlo yo». Este último salía del recorrido y perdía lo escrito en los pasos 1 y 2.
- Los pasos 1 y 2 vivían en `sessionStorage`. No había borrador en el servidor hasta elegir una plantilla.
- En el paso 3, reconocer una lectura no tenía efecto: la variable `working` nunca se asignaba, así que ningún plan quedaba orientado por respuestas. Las lecturas aparecían dos veces, una en el paso 1 y otra en el paso 3.
- «¿A qué se parece tu cambio?» se preguntaba después de escribir el cambio, y las sugerencias eran las dos primeras plantillas de esa meta, sin explicación.
- Una plantilla generaba una sola acción, fija y sin edición. `PlanAction` ya admitía varias acciones, versión mínima y marcas, pero la activación creaba una.
- No existía una modalidad exploratoria. La casilla «criterio provisional» no cambiaba la revisión.
- Propósito era un enlace. No aportaba motivo, vínculo ni contexto.
- No había obstáculos, recursos ni un «cuándo» de la acción. Tampoco había tareas de una sola vez para proyectos o decisiones.
- «Ajustar diseño» de un plan activo abría un flujo que el servidor rechazaba, porque solo se edita en preparación.

## 2. Opciones evaluadas

| Opción | Problema |
|---|---|
| Mantener la plantilla como plan completo | La estrategia decide las acciones. No sirve para proyectos ni para exploración. |
| Formulario libre para todo | Traslada todo el trabajo a la persona y no aprovecha lo que MK ya sabe. |
| IA generativa para proponer planes | Cuesta más y es difícil de auditar. Puede inventar conclusiones del diagnóstico y prescribir en salud o dinero. Además, el catálogo no está validado por Rafa. |
| **Contrato único con estrategia que propone y acciones editables** | Es la elegida. La estrategia, del catálogo o propia, siembra acciones. La persona las edita, y todos los planes terminan en el mismo modelo. |

Las recomendaciones son **reglas deterministas y plantillas configurables**. Cada sugerencia nombra el dato que la sostiene. Sin datos se dice que no hay datos y se muestra el catálogo completo. No hay IA: el resultado tiene que ser reproducible, revisable por Rafa y sin costo por uso.

## 3. Los cinco pasos

| Paso | Responsabilidad | Qué se pide | Qué es opcional |
|---|---|---|---|
| 1. Tu cambio | Qué quieres cambiar | «Quiero…» | Motivo, tipo de cambio, vínculo con la dirección, lecturas de Descubre a tener en cuenta |
| 2. Resultado | Qué se consigue o qué se explora, y cuándo se revisa | Modo, qué será distinto (o qué explorar), cómo reconocerlo (o qué saber al final), ciclo en semanas | Evidencia |
| 3. Estrategia | Cómo se trabaja | Una estrategia del catálogo o una propia | Nombre y razón de la estrategia propia |
| 4. Plan de acción | Qué, cuándo y cómo | Acciones con frecuencia y criterio de hecho, cuidado, carga que cabe | Cuándo y dónde, versión mínima, marcas, obstáculos, recursos |
| 5. Revisar y activar | Ficha completa y activación | Confirmar. Aclarar salud o conversación si alguna acción lo requiere | |

El ciclo en semanas pasó del paso de carga al paso 2, porque define el resultado y también las semanas en que caen las tareas de una vez.

El contexto aparece en el paso 1 y solo si existe. Va en bloques plegables de una línea: tu dirección, las lecturas de tus respuestas y lo que ya probaste en ese ámbito.

- Descubre: una lectura se reconoce ahí mismo (me representa, en parte o no me representa). Solo si la persona marca «Quiero tenerlo en cuenta» entra al plan. Si el cambio está vacío, propone el tipo de cambio de esa lectura como texto inicial. No convierte la interpretación en un objetivo.
- Propósito: «Partir de tu cambio buscado» copia la aspiración y avisa que en el paso 2 hay que bajarla a pocas semanas. «Usarla como motivo» copia la dirección al porqué. El vínculo es una casilla y no viene marcado.
- Ciclos anteriores: se muestra el título, la etapa y el aprendizaje. Si ya hay un plan en marcha en el ámbito, se avisa de la carga.

Las preguntas no se repiten: el foco de una plantilla se rellena con el cambio del paso 1 y la etapa con el criterio del paso 2. Ambos se pueden editar.

## 4. Recomendaciones

`recommendStrategies` en `apps/api/src/journey/intervention/plan-design.ts`:

- Una lectura reconocida que la persona eligió suma 2 a las plantillas que esa lectura declara. Motivo visible: «Parte de una lectura que reconociste: …».
- El tipo de cambio elegido suma 1 a las plantillas de esa meta. Motivo visible: «Coincide con «…», el tipo de cambio que elegiste».
- El orden va por puntaje y después por el orden del catálogo. Nunca por la gravedad de la respuesta. Se muestran como máximo tres.
- Si el modo es explorar, la primera sugerencia es «Explorar con pruebas pequeñas».
- Si una plantilla ya se usó en un plan anterior, se dice, pero no cambia el orden.
- Sin ningún dato: `basis: NONE`, la frase «Todavía no hay datos tuyos que apunten a una estrategia en particular» y el catálogo abierto.

Propósito no elige plantillas. Aporta motivo, vínculo y contexto.

## 5. Estrategia propia

Seis formas de trabajo que siembran acciones editables, sin inventar contenido. Si el título queda vacío, la persona lo escribe.

| Forma | Siembra |
|---|---|
| Repetir algo cada semana | 1 acción, 3 veces por semana, 15 minutos |
| Avanzar por pasos | Hasta 3 pasos de una vez, uno por semana |
| Preparar una decisión | Anotar qué falta, conseguirlo, decidir o fijar otra fecha |
| Preparar una conversación | Escribir qué decir; tener la conversación o fijar la fecha. En Relaciones lleva la marca de conversación difícil |
| Explorar con pruebas pequeñas | Una prueba y anotar lo aprendido |
| Empezar desde cero | 1 acción vacía |

Al activar, una estrategia propia guarda una plantilla `OWN-…` sin indicador inventado. La revisión usa el resultado propio y la ejecución.

## 6. Contrato de datos

**`plan_proposals.payload.design`** (`diseno-plan@1`):

```ts
{
  version: 'diseno-plan@1',
  goal: string | null,                 // meta del pack elegida en el paso 1
  contextReadingIds: string[],         // lecturas reconocidas que la persona eligió
  mode: 'RESULT' | 'EXPLORATION' | null,
  objectiveRevision: number,           // sube si cambia el objetivo y hay acciones editadas
  strategy: { kind: 'CATALOG', templateId, focusText, stageDefinition }
          | { kind: 'OWN', pattern, title, approach } | null,
  actions: {
    key, title, doneWhen, cue, minimum,
    schedule: { kind: 'WEEKLY', occasionsPerWeek, minutesPerOccasion }
            | { kind: 'ONCE', week, minutesPerOccasion }
            | { kind: 'TRIGGER', trigger, minutesPerOccasion },   // solo si lo sembró una plantilla
    contentTags: ContentTag[],
    source: { kind: 'TEMPLATE', templateId, usesMinimum } | { kind: 'PATTERN', pattern } | { kind: 'MEMBER' },
    basis: number,                      // objectiveRevision para la que se escribió o confirmó
  }[],
  obstacles: { obstacle, response }[],  // hasta 3
  resources: string | null,
  loadConfirmed: boolean,
  resultSaved: boolean,
  actionsTouched: boolean,
}
```

El cambio, el motivo, el vínculo y el cuidado siguen en `personal_plans` (`title`, `whyItMatters`, `linkKind`, `purposeRevisionId`, `protectNote`). El resultado sigue en `personal_plans.outcome_contract`, que ahora tiene `mode`. En exploración, `soughtOutcome` es la pregunta, `criterion` es lo que se quiere saber y `criterionStatus` es `PROVISIONAL`, así que no se puede declarar logro. El ciclo es `payload.horizonWeeks`.

Al activar se materializa una fila de `plan_actions` por acción. La migración `20261104010000_plan_action_cue_position` agrega `cue` y `position`. Una acción `ONCE` queda con `occasionsPerWeek` nulo y una fila `action_schedules` `FLEXIBLE` con 1 ocasión, válida solo dentro de su semana. Fuera de esa semana no hay ocasión y la semana no la muestra. No se tocó `week-count`.

**HTTP**, bajo `/api/v1/journey/intervention/:territory`:

| Método y ruta | Uso |
|---|---|
| `GET /design-context` | Lecturas, dirección, planes anteriores, minutos de otros planes activos, marcas, formas de trabajo y catálogo |
| `POST /designs` | Crea el borrador desde el paso 1. `commandKey` evita duplicados |
| `GET /plans/:planId/design` | Diseño, carga por semana, qué falta, paso para retomar, recomendaciones y seguridad |
| `PATCH /plans/:planId/design` | `section`: `change`, `result`, `strategy` o `actions`. Solo en preparación (409 `NOT_PREPARING`) |
| `POST /plans/:planId/activate` | Si el plan tiene diseño, valida todo y materializa las acciones. Acepta `conversation` además de `healthLimit` |

**Validaciones** (servidor; el cliente solo da aviso temprano):

- Cambio: de 1 a 180 caracteres. Motivo: hasta 1000.
- Resultado: modo obligatorio, con sus dos textos (hasta 500 cada uno). Ciclo: entero de 1 a 12.
- Estrategia: existe en el pack; foco y etapa si la plantilla los pide.
- Acciones: de 1 a 6; descripción de al menos 3 caracteres; criterio de hecho; frecuencia de 1 a 21 por semana; minutos de 1 a 600; semana dentro del ciclo; marcas conocidas; carga semanal máxima de 1680 minutos. Más de 300 minutos o más de 3 acciones muestra un aviso de plan exigente, sin bloquear.
- Obstáculo con las dos partes. Cuidado obligatorio. Carga confirmada.
- Acciones editadas que quedaron detrás de un objetivo cambiado (`STALE`): hay que confirmar que siguen sirviendo.
- Inversión o deuda declarada: bloquea con el texto de la regla compartida.
- Al activar: `assertMemberContentTags` con las marcas de todas las acciones más las de la plantilla. Salud pide `healthLimit`, conversación pide `conversation`. Se mantiene `MINIMUM_PROTECT_CONFIRM`.
- Las lecturas se vuelven a leer al activar. Una lectura cuya firma caducó deja de orientar el plan.

**Resolución explícita**: cambiar de estrategia después de editar acciones responde 409 `ACTIONS_EDITED`. La pantalla ofrece conservar, sumar o reemplazar. Si las acciones son semillas sin tocar, se reemplazan sin preguntar, porque no hay trabajo de la persona que perder.

## 7. Actúa

- La semana muestra las acciones en el orden del plan, con «Cuándo» y «Si el día se complica». Cada acción aparece solo en las semanas de su ventana. Una tarea de una vez solo aparece en su semana.
- Si una tarea de una vez quedó sin hacer en su semana, la semana lo avisa y lleva a la revisión. La tarea no desaparece: sigue en la revisión, marcada para decidir, hasta que se reprograma, se cambia, se reemplaza o se descarta.
- Hecha sigue siendo un registro de ejecución. No acredita el resultado. A medias no cuenta como hecha. Sin registro es sin información: no se presenta como hecha ni como no hecha.
- La revisión de un plan exploratorio pregunta qué aprendiste. El servidor rechaza «conseguido» en exploración y «aprendí» en un plan de resultado.
- La ficha lista todas las acciones y los obstáculos. En exploración no ofrece declarar logro. Los cambios de un plan activo van a la revisión.
- Pausa, mantenimiento, cierre y logro con evidencia no cambiaron. Una pausa no genera avance: las semanas en pausa no se cuentan.

## 8. Compatibilidad

- Un borrador creado por `POST /plans` (ruta anterior) se lee como diseño al abrirlo (`adopted: true`), con la plantilla sembrada y su carga. Se guarda como diseño con el primer cambio.
- Los planes activos anteriores no se migran. Su revisión usa el mismo panel acción por acción: sus acciones existentes se leen igual. Una decisión guardada antes de este contrato (una sola `actionId`) se aplica como antes.
- Las acciones terminadas antes de la columna `effective_to` siguen el criterio anterior: si las reemplazó otra, terminan el día antes de la sucesora; si se retiraron sin fecha, no se cuentan.
- `planView`, indicador y cierre de semana siguen leyendo `templateSnapshot` y `load`. `load.weeklyMinutes` y `capacityMinutes` se recalculan con todas las acciones al aplicar una revisión.
- Las rutas `POST /plans`, `PATCH /plans/:id` y `PATCH /plans/:id/own-contract` siguen en el servidor. `POST /review-decision` sin `actions` conserva la decisión de plan entero.
- `DesignChangeFirst`, `MentalidadStart` y `MentalidadPlanSteps` salieron de `apps/web`. Había una copia en el historial local de Cursor, ahora en `_archive/apps-web/disena-anterior/`. La de `DesignChangeFirst` puede ser una versión anterior a la última.

## 9. Pruebas

| Suite | Archivo | Qué fija |
|---|---|---|
| Dominio | `apps/api/test/plan-design.test.ts` | Patrones, edición, carga, preparación, recomendaciones, exploración. |
| Dominio | `apps/api/test/action-review.test.ts` | Ventana de una acción, `ADJUST`, cada decisión por acción, máximo de acciones, carga de la semana siguiente, disparador. |
| HTTP | `apps/api/test/plan-design.http.test.ts` | Cuatro escenarios, seis tipos de objetivo, seguridad, compatibilidad. |
| HTTP | `apps/api/test/action-review.http.test.ts` | Plan de seis acciones: hecha, no hecha, sin registro, pendiente y futura; reducir la primera, reprogramar la tercera, reemplazar la cuarta, cambiar la sexta, agregar una; registros e historia intactos; carga total; idempotencia y conflicto; descartar con motivo; disparador; marcas de seguridad; revisión tardía y semanas intermedias; pregunta semanal que no se cambia sola. |
| HTTP | `apps/api/test/product-acceptance-audit.http.test.ts` | Ya no depende de la fecha real: la activación usa `JourneyClock`. |
| Web | `apps/web/test/design-flow.test.ts`, `apps/web/test/audit-week-close.test.tsx` | Editor del diseño y decisión de revisión. |
| Navegador | `tmp/disena-ui/*.mjs`, `e2e/design-intervention-activation.spec.ts` | Sección 13. |

## 10. Límites

- No hay días fijos por acción. El día se elige en la semana y el «cuándo» es texto.
- Las acciones por disparador solo existen si las siembra una plantilla (MEN-C2) y, como antes, no se marcan por día. En la revisión se pueden cambiar el texto, el cuándo o los minutos, no convertirlas en semanales.
- Reemplazar una acción, o cambiarle el nombre, no modifica la plantilla ni la pregunta semanal. Si la acción venía de una plantilla con indicador de resultado, hay que decir si esa pregunta sigue sirviendo o si queda pendiente revisarla. En los dos casos la pregunta se conserva. Un plan propio no tiene esa pregunta y no pide la confirmación. Aligerar, reprogramar o cambiar solo el cuándo, la versión mínima o los minutos tampoco la piden.
- Una tarea de una vez se reprograma hasta 12 semanas después de la semana revisada. La pantalla ofrece 8, desde el lunes en que los cambios entran en vigor.
- Una revisión aplicada tarde entra en vigor el próximo lunes respecto del día en que se aplica. Si ese día es lunes, entra ese mismo día. Nunca en un lunes que ya pasó. Las semanas de en medio siguen con las acciones y los registros anteriores. Si la decisión guardada apuntaba una tarea a una semana que ya empezó, aplicar responde 409 y hay que volver a elegir.

## 11. Revisión acción por acción

**Problema confirmado.** La decisión pendiente de cada plan guardaba una sola acción (`actions[0]`). En un plan con varias, reducir, cambiar o sustituir solo tocaba la primera. Además, el conteo de ejecución leía solo acciones activas: al reemplazar o retirar una acción, sus registros pasados desaparecían del acumulado y la sucesora contaba como sin registro semanas en las que no existía. Eso falseaba la historia.

**Solución.** Se extendió el modelo de revisión existente:

- `plan_actions.effective_to` y `ended_reason` (migración `20261105010000_plan_action_window`) dan a cada acción una ventana. `actionCountsInWeek` (`apps/api/src/journey/action-window.ts`) decide en qué semanas cuenta. La usan el conteo de ejecución, el tablero, la semana y el cierre. Una acción que termina sigue contando en sus semanas.
- `previewWeek` tiene la decisión `ADJUST`. Cualquier cambio, incluido el cuándo o la versión mínima, cierra la acción y crea una sucesora con `replacesActionId`. La acción anterior conserva el texto con el que se registró. Una semana ya cerrada sigue leyendo su copia. Una semana todavía abierta, anterior a la sucesora, lee la acción anterior.
- `planActionReview` (`apps/api/src/journey/intervention/action-review.ts`) traduce las decisiones de la persona a decisiones de `closeWeek`:

| Decisión | Disponible para | Efecto desde el lunes siguiente |
|---|---|---|
| Mantener | Todas | Nada. Es la opción por defecto. |
| Aligerar | Semanales, por disparador, de una vez | Sucesora con menos veces o menos minutos. Subir alguna cifra se rechaza. |
| Cambiar | Todas | Sucesora con lo cambiado, también si solo cambia el cuándo o la versión mínima. Puede pasar de cada semana a una vez y al revés, salvo las de disparador. |
| Reprogramar | De una vez | Sucesora en otra semana futura. La original queda en su semana, con o sin registro. |
| Reemplazar | Todas | Sucesora con otra acción y otro criterio. Puede declarar marcas nuevas. |
| Retirar o descartar | Todas | La acción termina el día anterior al lunes en que el cambio entra en vigor. Si se aplica a tiempo, ese día es el domingo de la semana revisada. El motivo es obligatorio y queda en `ended_reason` y en el cierre. |
| Agregar | El plan | Acción nueva desde el lunes en que el cambio entra en vigor, cada semana o en una semana elegida. Hasta seis acciones con ocasiones futuras. |

- La decisión pendiente (`payload.pendingReviews[semana]`) guarda `actions[]` con el resumen y la huella de cada acción, `additions[]` y `followsProposal`. Las decisiones anteriores, con una sola `actionId`, se siguen aplicando.
- `applyInterventionWeekReview` comprueba la huella de cada acción (409 `STALE_REVIEW` si cambió) y aplica todos los planes en un solo `closeWeek`, que es transaccional: si algo falla, no queda nada a medias. Las sucesoras heredan orden, cuándo, versión mínima, origen, plantilla, marcas y viabilidad de conversación. Las altas pasan por los mismos controles de contenido.
- Después de aplicar, `capacityMinutes` y `load.weeklyMinutes` se recalculan con las acciones vigentes en el lunes en que el cambio entra en vigor.
- Guardar con la misma `commandKey` devuelve `repeated`. La misma clave con otro contenido responde 409.
- `POST /records` rechaza un día posterior al final de una acción (`ACTION_ENDED`).

**Relación con la propuesta.** La propuesta (KEEP, CHECK, LIGHTER_OK, EXPLORE, NO_RECORDS) se muestra igual. La elección de plan se deriva de las decisiones por acción (reemplazar, cambiar, aligerar, mantener o dejar constancia) y se guarda con `followsProposal`. Si no coincide con lo sugerido, la pantalla dice «La revisión sugería otra cosa. Decides tú.» Antes de la fecha de revisión el panel está plegado, salvo que haya una tarea sin hacer que espera decisión. La pregunta de si el resultado sigue importando y el cierre del plan aparecen desde esa fecha.

**Ejecución y resultado quedan separados.** Ajustar acciones no toca el contrato del resultado: la prueba HTTP lo compara antes y después. La pantalla lo dice en el resumen. El indicador y la comprobación del resultado siguen en su bloque.

**Pantalla.** «Qué ocurrió» lista lo previsto y lo registrado de cada acción en la semana revisada. «Tus acciones desde la semana del …» muestra una tarjeta compacta por acción, con su decisión. Las opciones se abren solo al pulsar «Ajustar esta acción». Una tarea ya hecha no aparece para decidir. «Lo que cambiará» resume los cambios y los minutos de la semana siguiente antes de guardar. «Revisar y aplicar» lista los cambios de cada plan antes de confirmarlos.

## 12. Revisión metodológica pendiente

Lo que sigue son reglas de producto. No están aprobadas por Rafa y no se presentan como conclusiones de método. La pantalla las muestra como sugerencias, con el dato que las sostiene, y la persona decide.

| Regla | Dónde | Qué decide | Tipo |
|---|---|---|---|
| Seis formas de trabajo y sus semillas (veces, minutos, textos de criterio) | `plan-design.ts`, `WORK_PATTERNS`, `patternSeeds` | Qué estructura se propone a una estrategia propia | Metodológica |
| Pesos de recomendación: lectura elegida 2, tipo de cambio 1, hasta 3 sugerencias, explorar primero | `recommendStrategies` | El orden de las sugerencias | Metodológica |
| Textos de los motivos de recomendación | `recommendStrategies` | Cómo se explica una sugerencia | Metodológica y de copy |
| Umbral de plan exigente: más de 300 minutos o más de 3 acciones | `DEMANDING_WEEKLY_MINUTES` | Cuándo se avisa | Metodológica |
| Máximo de 6 acciones y de 1680 minutos por semana | `MAX_ACTIONS`, `MAX_PLAN_ACTIONS` | Qué se bloquea | Técnica, revisable |
| Marca de conversación difícil sembrada en la conversación de Relaciones | `patternSeeds('CONVERSATION')` | Que se pida la aclaración de viabilidad | Seguridad, revisable |
| La elección de plan se deriva de las acciones y no se bloquea si no coincide con la propuesta | `planActionReview`, `followsProposal` | Si la propuesta guía o restringe | Metodológica |
| Antes de la fecha de revisión se pueden ajustar acciones sueltas | `InterventionReviewDecision` | Cuándo se puede cambiar | Metodológica |
| Reprogramar hasta 12 semanas, la pantalla ofrece 8 | `action-review.ts`, `weekOptions` | Cuánto se puede posponer una tarea | Técnica, revisable |
| Al reemplazar o renombrar una acción de plantilla se pregunta si el indicador de resultado sigue sirviendo, y no se cambia | `confirmActionReview` | Si ese aviso hace falta y cómo se responde | Metodológica |
| Retirar exige un motivo de al menos 3 caracteres | `planActionReview` | Que un descarte quede justificado | Producto |

Criterios técnicos que no dependen de esa revisión: la ventana de las acciones, que la historia no se reescriba (tampoco el cuándo ni la versión mínima de una semana ya vivida), que un cambio tardío empiece el próximo lunes desde el día en que se aplica, la separación entre ejecución y resultado, las huellas y la idempotencia, y los controles de salud, conversación, inversión y deuda. Esos controles son los de `restrictions.ts` y no cambiaron.

## 13. Entornos y verificación en navegador

Dos entornos locales corren a la vez sin pisarse:

- `npm run dev`: web 3000, API 4000, base `maximuskratos`, con `apps/web/.next` y `apps/api/dist`.
- `npm run dev:audit`: web 3010, API 4010, base `mk_browser_audit`, con `apps/web/.next-audit` y `apps/api/dist-audit`. Para simular otra semana: `MK_CLOCK_DAY=2026-11-10 npm run dev:audit`.

Causa del error 500 en 3000: el servidor de auditoría corría `next dev` sobre la misma carpeta `.next` que el servidor Turbopack de 3000, y borró su runtime. La API tenía el mismo problema con `dist`: `nest start` usa `deleteOutDir`, así que el `npm run build` de las pruebas HTTP borraba el `dist` de los dos observadores. `NEXT_DIST_DIR`, `nest-cli.audit.json` y `nest-cli.test.json` (`npm run build:test`, `dist-test`) separan las carpetas.

Playwright: `MK_BROWSER_WEB=http://127.0.0.1:3010 npx playwright test`. Arranca `npm run dev:audit` si no está corriendo.

Recorridos verificados en navegador el 5 nov 2026, con capturas en `tmp/disena-ui/shots/`:

| Escenario | Plan | Diseña y activa | Ejecuta | Revisa y ajusta |
|---|---|---|---|---|
| A, sin Descubre ni Propósito | Propio, hábito y una tarea de una vez | Sí | Sí | Descarta la tarea sin registro con motivo, aligera el hábito |
| B, solo Descubre | Catálogo MEN-B2, decisión postergada | Sí | Sí | Cambia el cuándo |
| C, solo Propósito | Propio por pasos: tres tareas de una vez y una semanal | Sí, con dirección vinculada | Marca una tarea como hecha | Reprograma la tarea sin registro, cambia la semanal, agrega una |
| D, Descubre y Propósito | Propio de conversación, Relaciones | Sí, con aclaración de viabilidad | Sí | Reprograma la primera tarea |
| Exploración | Propio, Salud, con esfuerzo físico | Sí, con aclaración de salud | Sí | Registra lo aprendido y no ofrece logro |

Medidas revisadas: 390, 320 y 1440 px, sin desborde horizontal. Las cuentas se prepararon por API (registro y dirección) o por la semilla `seed-sim-mentalidad.ts` en `mk_browser_audit`. Lo demás se hizo por la interfaz.
