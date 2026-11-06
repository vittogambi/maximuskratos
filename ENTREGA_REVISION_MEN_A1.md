# Mentalidad: revisión que decide y MEN-A1

> **Actualización del 5 nov 2026.** La decisión de revisión ahora es acción por acción: mantener, aligerar, cambiar, reprogramar, reemplazar, retirar o agregar, con un resumen antes de guardar y el mismo panel de aplicar. Lo que este archivo dice sobre MEN-A1 (preparación de prioridades, indicador derivado, códigos de propuesta) sigue vigente. Lo que dice sobre una decisión que cambia una sola acción es la etapa anterior. Ver [DISENA_REDISENO.md](DISENA_REDISENO.md), sección 11.

**Documento vigente** (estado del producto en rama de trabajo, sin commit ni deploy asumidos).  
Detalle técnico del motor compartido: [`REVISION_QUE_DECIDE_IMPLEMENTADO.md`](REVISION_QUE_DECIDE_IMPLEMENTADO.md) (referencia API; si hay discrepancia, prevalece este archivo).  
Evolución entre entregas: [`docs/historial/REVISION_MEN_A1_EVOLUCION.md`](docs/historial/REVISION_MEN_A1_EVOLUCION.md).

## Alcance

Primera experiencia **completa** en Mentalidad para una plantilla: **preparar → actuar → observar → decidir → aplicar cambios futuros** (MEN-A1).  
El motor de revisión y multiplan aplica a otros ámbitos con intervención; **no** implica el mismo nivel de ayuda práctica fuera de MEN-A1.  
No demuestra retención de pago ni acompañamiento equivalente en Finanzas, Relaciones o Salud.

Matriz v2 no se modificó.

## Recorrido MEN-A1 (persona)

1. **Diseñar** → Mentalidad → MEN-A1 → activar (carga, cuidado, activación atómica).
2. **`/semana`** (semana civil actual): marcar la acción si corresponde; panel del plan con estado de preparación y enlace **Preparar / continuar borrador / ver preparación**.
3. **`/planes/:id/preparar`**: contexto, prioridades (3 estándar / 1 mínima), borrador, confirmar preparación (no marca la acción hecha ni el resultado).
4. Vuelta a **`/semana?planId=…`**: revisión **por prioridad** (avanzó / no / no lo sé), **resultado de semana derivado**, propuesta de **estrategia**, guardar decisión del plan.
5. **`Cierre conjunto`**: lista de planes con cambio concreto y **desde qué semana** aplica; aplicar una vez; acceso a la semana siguiente.

Otros planes de intervención en Semana siguen `IndicatorCheckin` + revisión, sin workspace de prioridades.

## Motor compartido (revisión)

- Decisión **por plan** (`POST …/review-decision`); cierre **una vez** (`POST …/week-review/apply`).
- Cumplimiento (solo ocasiones resueltas) y **cobertura** (registros incompletos) separados; no KEEP/CHECK sobre muestra mínima sin cobertura.
- `templateSnapshot` fija el contrato del plan aunque cambie el pack.
- MODIFY exige cambio efectivo; semana anterior intacta al aplicar.
- Pendiente invalida si cambia la **acción** (`actionDigest`) o la **evidencia** (`evidenceDigest`: MEN-A1 + contrato/evaluación del resultado propio), o si se altera revisión por prioridad tras guardar decisión (se quita la pendiente).
- Meta sin cuestionario: plan con `focusText`, sin fingir lecturas (`general: true`).
- Restricciones en activación: `contentTags` de plantilla + límite vigente → **403**, sin acción ni ACTIVE.

## Indicador MEN-A1: una fuente de verdad

| Situación | Comportamiento |
|-----------|----------------|
| Preparación **CONFIRMED** en la semana | Resultado solo vía revisión por prioridad → sync a `plan_evidence` (`DERIVED_FROM_PRIORITIES`). UI en Semana muestra el derivado. **`POST …/indicator` rechaza** entrada manual del resultado. |
| Prioridad en **UNKNOWN** o faltante | No se publica resultado completo; se borra medida de esa semana si existía. |
| Semana **FROZEN** (tras cierre) | Sin edición; sin indicador manual; lectura del cierre. |
| **Sin** preparación confirmada | Camino **alternativo**: indicador manual vía `IndicatorCheckin` / API (planes que no pasaron por prep o semanas previas al hábito). No compite con derivado: el derivado manda en cuanto hay prep CONFIRMED. |

Versión mínima vs estándar: el derivado usa el indicador y el conteo acordados en la prep (`minimum` en fila de semana), no mezcla contratos.

## Restricciones y catálogo

- **MEN-A1**: sin `contentTags` (organización / prioridades, no marca de contenido restringido).
- **SAL-A1** (Salud): `contentTags: ['PHYSICAL_EXERTION']` en el pack; activación con `CURRENT_LIMIT` → 403 (probado en integración).
- Otras plantillas de intervención: sin tags salvo decisión explícita en el pack (no inferir por palabras del título).

## Pruebas automatizadas (contrato, última corrida local)

Base aislada: `mk_journey_it`.

| Suite | Resultado |
|-------|-----------|
| `intervention-acceptance.http.test.ts` | 12 passed |
| `outcome-cycle.http.test.ts` | 7 passed (incluye gobierno de revisión por resultado) |
| `plan-outcome-contract.test.ts` (unit) | 7 passed |
| `intervention-mentalidad.http.test.ts` | 5 passed |
| `men-a1-prep.test.ts` + `intervention-mentalidad.test.ts` (unit) | 23 passed |

Comprueban persistencia y reglas, **no** utilidad percibida ni comprensión del recorrido.

Nota: tests HTTP que acumulan ejecución **retrodatan `activatedAt`** para alinear con `MK_CLOCK_DAY`. En uso real, `activatedAt` es la fecha de activación.

## Limitaciones conocidas

- Sin QA visual móvil documentada en esta entrega.
- Nota opcional por prioridad: API preparada; UI en Semana sin textarea.
- Solo MEN-A1 tiene workspace de prioridades; MEN-B1 y resto sin editor dedicado.
- Tres entradas de Diseñar comparten mucho recorrido visual; diferencia en copy y caminos (meta, catálogo, plan propio).

## Fuera de alcance inmediato (acordado)

- **No** ampliar funcionalidad de MEN-A1 ni nuevas plantillas de ayuda práctica hasta **prueba de utilidad** con personas.
- **No** más suites del mismo contrato como sustituto de observación cualitativa.

## Recorrido local (desarrollo)

1. `cd packages/database && DATABASE_URL=postgresql://mk:mk_local_dev@127.0.0.1:5433/mk_journey_it npx prisma migrate deploy`
2. API y web en dev (`apps/api`, `apps/web`).
3. Cuenta nueva o fixture: Diseñar → MEN-A1 → activar.
4. `/semana` → preparar → confirmar → revisar prioridades → decisión → cierre conjunto.

Migraciones recientes: `20261028020000_plan_week_preparations`, `20261028030000_plan_outcome_contract`.

**Nota de alcance:** en la pasada de implementación se aplicó `20261028030000_plan_outcome_contract` también a la base local `maximuskratos` (5433), fuera del límite acordado de solo bases aisladas. No revertir a ciegas. En siguientes pasadas, migrar solo `mk_journey_it` o la base que indiques.

## Resultado propio del plan y revisión (oct 2026)

La persona distingue **qué hizo**, **qué aportó la herramienta** y **si ocurrió el cambio buscado**.

- Contrato común en `personal_plans.outcome_contract` (JSON versionado) más espejo en `outcome`, `criterion_text`, `review_at`.
- Evaluación explícita del resultado: `ACHIEVED` / `NOT_YET` / `INSUFFICIENT` en `plan_evidence` (`kind: OUTCOME`). No infiere logro por tareas, prep ni longitud de texto.
- Diseñar paso 2: resultado, criterio cotidiano, evidencia esperada, criterio provisional opcional.
- Semana: capa **Resultado** (`PlanOutcomeReview`) separada de indicadores de herramienta; reutilización explícita si `linkedIndicatorRef` coincide con el indicador RESULT.
- Revisión pendiente: `evidenceDigest` incluye contrato del resultado y evaluación; invalida si cambian tras guardar decisión.
- Activación: fecha de comprobación alineada con `reviewAt`.
- Activación: si la dirección cambió desde el borrador, la persona elige en «Revisar y activar» conservar la del borrador, la actual o ninguna.
- Ficha del plan: formulario para completar resultado, criterio, evidencia y fecha cuando el contrato está incompleto o recuperado.
- Revisión: la evaluación del resultado propio gobierna `review.outcomeText`, el código de propuesta y las alternativas (`mergeReviewWithOutcome`), no solo una etiqueta.
- Backfill: planes sin JSON muestran «información recuperada» y campos pendientes; no se presenta como acuerdo histórico ni se inventan evaluaciones.

API: `PATCH …/outcome-contract`, `POST …/outcome-assessment`.

### Recorrido local (dos escenarios)

1. **Mucha ejecución, resultado no logrado:** MEN-A2 o MEN-A1 con prioridades completadas → comprobación `NOT_YET` → revisión puede proponer MODIFY sin declarar logro.
2. **Resultado logrado con menos ocasiones:** comprobación `ACHIEVED` con evidencia declarada → hint de simplificar o preparar cierre; no exige subir carga.

## Dirección y diseño desde el cambio (oct 2026)

- `/proposito`: dirección editable con versiones (`GET/POST /journey/direction`). Cada guardado crea una revisión nueva; los planes conservan `purposeRevisionId` al activarse.
- `/disenar` en los cuatro ámbitos de intervención: cinco pasos (cambio, resultado, estrategia, semana, activar) vía `DesignChangeFirst`.
- Plan, Inicio, Memoria y revisión semanal incluyen vínculo con la dirección, resultado buscado y pregunta de **sentido** (sin mezclarla con cumplimiento).

## Recorrido visible (dos historias, sin más backend)

1. **Prioridades cumplidas, método no aplicado por otra persona:** MEN-A1 o plan con resultado «otra persona aplica el método». Completar prep y ocasiones. Comprobación **Todavía no conseguido**. Revisión debe hablar del resultado propio y ofrecer cambiar estrategia sin logro automático.
2. **Otra persona aplica el método con menos preparación:** Comprobación **Conseguido** con evidencia. Revisión debe permitir aligerar o preparar cierre sin exigir más carga.

En ambos, la persona debería poder articular: resultado buscado, evidencia, decisión ahora, qué cambia la próxima semana.

## Próximo paso de producto (observación, no código)

Objetivo: saber si MK **acompaña** o solo **registra**, frente a una lista de tareas.

**Criterio:** si quitamos MK, ¿qué decisión útil pierde la persona? Para MEN-A1 debería perder al menos concretar prioridades, comprobar viabilidad y ajustar estrategia según resultados.

**Tres sesiones** (Rafa + persona ajena al desarrollo; cuentas/semanas simuladas, identificadas como tales; sin guiar dónde pulsar):

| Situación | Observar |
|-----------|----------|
| No sé por dónde empezar | Encuentra un cambio significativo sin quedarse en catálogo |
| Quiero terminar una propuesta para un cliente | Meta → prioridades concretas y primer paso viable |
| Hice lo previsto pero no conseguí el resultado | Entiende revisión, elige cambio útil, anticipa la semana siguiente |

Anotar: dónde hace falta traducir pantallas, decisiones sin ayuda, información duplicada, qué propuesta cambia el siguiente paso.

**Elegir siguiente entrega según evidencia:**

- Cuesta elegir cambio → entrada de Diseñar.
- Cuesta preparar prioridades → ejemplos y ayuda dentro de MEN-A1.
- Revisión no ayuda a decidir → alternativas de estrategia.
- Recorrido funciona → ayuda práctica MEN-B1 (u otra plantilla), no más motor.

## Referencia de código

| Área | Rutas |
|------|--------|
| Prep / revisión API | `intervention/men-a1-prep.ts`, `intervention.service.ts`, `intervention.controller.ts` |
| Cierre | `week-review-pending.ts`, `apply-week.ts`, `review-decision.ts` |
| Web Semana | `MenA1PlanPanel.tsx`, `InterventionWeekApplyPanel.tsx`, `CalendarScreen.tsx`, `InterventionReviewDecision.tsx` |
| Web preparar | `MenA1PrioritiesWorkspace.tsx`, `app/(member)/planes/[planId]/preparar/page.tsx` |
| Tests | `intervention-acceptance.http.test.ts`, `intervention-mentalidad.http.test.ts`, `men-a1-prep.test.ts` |
