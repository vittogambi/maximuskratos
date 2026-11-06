# Revisión que decide (Mentalidad): referencia técnica del motor

> **Histórico en parte, desde el 5 nov 2026.** Las menciones a `MentalidadStart`, `MentalidadPlanSteps`, `DesignChangeFirst`, a la activación de una sola acción de plantilla y a la decisión de revisión sobre la primera acción describen la etapa anterior. Diseñar vigente y la revisión acción por acción están en [DISENA_REDISENO.md](DISENA_REDISENO.md), secciones 6 y 11. El motor de propuestas (códigos, avance, ejecución) sigue vigente.

**Estado de producto y recorrido MEN-A1:** usar [`ENTREGA_REVISION_MEN_A1.md`](ENTREGA_REVISION_MEN_A1.md) como única fuente vigente.  
**Historial de entregas:** [`docs/historial/REVISION_MEN_A1_EVOLUCION.md`](docs/historial/REVISION_MEN_A1_EVOLUCION.md).

Este archivo describe contratos de implementación (motor, endpoints, archivos). La Matriz v2 no se tocó. Finanzas, Relaciones y Salud física heredan el motor compartido.

## Qué problema cerraba

Antes, la revisión semanal del plan de intervención devolvía solo un párrafo. El plan propio en Diseñar no entraba en el mismo contrato (sin indicador ni revisión). La activación partía en dos pasos (`addAction` + `activatePlanDraft`) y podía dejar acciones huérfanas. `reviewAt` se fijaba al crear el borrador, no al activar.

Ahora las tres entradas de Diseñar convergen en el mismo contrato cuando el ámbito tiene intervención; la persona confirma una decisión que cambia solo el futuro, reutilizando el cierre semanal existente.

## 1. Contratos del motor (`apps/api/src/journey/intervention/engine.ts`)

### Indicador de texto

- La nota sola ya no cuenta como avance.
- Al registrar, hace falta un estado explícito: conseguido, no conseguido, no se sabe (`textOutcome` en API; persistido en `plan_evidence.value` como 1, 0 o null con texto opcional).
- Solo **conseguido** acredita avance. «No conseguí nada» con nota queda en no avance.

### Ejecución en revisión

- Misma regla que `week-count.ts`: el ratio usa solo ocasiones **hechas** y **no hechas**. Sin registro no entra al denominador.
- Si no hay ninguna resuelta, la propuesta es `NO_RECORDS`, no ejecución baja ficticia.

### Meseta de éxito

- Nuevo estado de progreso `MAINTAINED`: la última medida sigue cumpliendo la meta (sí en YES_NO, texto conseguido, conteo en meta, etc.).
- Con ejecución suficiente, `reviewProposal` trata `MAINTAINED` como avance estable → propuesta `KEEP` (no empuja a subir carga).

### Horizonte de revisión

- `reviewAt` en `personal_plan` **no** se escribe al crear ni al ajustar el borrador de intervención.
- El horizonte en semanas vive en el payload de `plan_proposals`.
- Al activar (`POST .../activate`), se ancla `reviewAt` a hoy + semanas del payload, salvo fecha explícita en el cuerpo de activación.

### Copia versionada de plantilla

- Al crear plan de intervención, el payload incluye `templateSnapshot` (definición completa usada).
- `proposalFor` resuelve la plantilla desde código o desde snapshot; si el id ya no existe en el pack, la vista no cae en 404 vacío.

### Versión mínima y cuidado

- La mínima no sustituye la confirmación de compatibilidad con lo que hay que cuidar.
- Si el plan va en mínima y `protectNote` es distinto de «Por ahora no hay nada que cuidar.», la activación exige `minimumLoadConfirmed: true` (UI: checkbox en paso 3 de `MentalidadPlanSteps`).

## 2. Un contrato para plantilla y plan propio

### Copy de las tres entradas (`DesignStudio.tsx`)

| Camino | Título en UI |
|--------|----------------|
| GENERAL | No sé por dónde empezar |
| ANSWERS | Quiero avanzar algo concreto |
| OWN | Ya tengo un plan |

### Plantilla vía `MentalidadStart` / `MentalidadPlanSteps`

- Sin cambio de flujo principal: lecturas, catálogo, carga, activación atómica.

### Plan propio en ámbito con intervención

- Paso 2 pide: «¿Con qué pregunta mirarás el resultado cada semana?»
- `PATCH /api/v1/journey/intervention/:territory/plans/:planId/own-contract` crea o actualiza propuesta `INTERVENTION_PLAN` con snapshot sintético (`OWN-…`), indicador TEXT y mismos campos de resultado, acción y criterio.
- Activación en Diseñar: `upsertOwnInterventionContract` → `adjustInterventionPlan` → `activateInterventionPlan` (no el par addAction + journey activate).

## 3. Activación en un solo paso

**Endpoint:** `POST /api/v1/journey/intervention/:territory/plans/:planId/activate`

- Transacción: crea acción activa si falta (desde snapshot), valida bloqueo de activación (`plan-lifecycle`), pone plan en ACTIVE, ancla `reviewAt`, registra transición con `commandKey`.
- Repetir la misma `commandKey` devuelve `{ repeated: true }` sin duplicar acción.

**Web:** `MentalidadPlanSteps` y `intervention-api.ts` (`activateInterventionPlan`) dejan de llamar a `addAction` + `activatePlanDraft` en el flujo de plantilla.

## 4. Revisión que confirma un cambio futuro

### Lectura en semana

`GET .../plans/:planId` devuelve, además de ejecución e indicadores:

- `review.code`, `review.text`
- `review.choices`: opciones permitidas según código (`KEEP`, `REDUCE`, `MODIFY`, `SUBSTITUTE`, `NO_RECORDS`)
- `review.alternateTemplate`: otra acción de la misma lectura cuando aplica
- `review.lastChoice` tras confirmar

Mapeo orientativo:

| Propuesta típica | Decisiones ofrecidas |
|------------------|----------------------|
| KEEP | Mantener, aligerar |
| LIGHTER_OK | Mantener, aligerar (no subir carga) |
| CHECK / EXPLORE | Cambiar estrategia, sustituir, aligerar, mantener |
| NO_RECORDS | Constancia de registros, mantener |

### Confirmación

**Endpoint:** `POST /api/v1/journey/intervention/:territory/plans/:planId/review-decision`

- Body: `choice`, `weekStart` (lunes civil), `revision` opcional, `alternateTemplateId`, `note`, `commandKey`.
- Guarda decisión en `pendingReviews[weekStart]` del payload; **no** cierra la semana sola.
- Cierre conjunto: `POST /api/v1/journey/intervention/week-review/apply` → una llamada a `JourneyService.closeWeek` (efecto desde la semana siguiente; registros pasados intactos).
- Escribe/actualiza `plan_proposals` con `lastReviewChoice` y pendiente de semana.

### Extensión de `apply-week.ts`

- `WeekRevision` / `WeekAction` admiten `occasionsPerWeek` y `minutesPerOccasion`.
- `REDUCE` puede bajar ocasiones o minutos sin tocar el criterio de hecho.
- `journey.service` persiste esos campos al aplicar efectos del cierre.

### UI

- `IndicatorCheckin`: pregunta de indicador (incl. texto con tres botones de resultado).
- `InterventionReviewDecision`: propuesta + elección + confirmación.
- `/semana/revision`: misma superficie sobre plan activo (query `planId` / foco del dashboard).

## 5. Memoria reutilizable

- Al pasar a **CLOSED** o **MAINTENANCE** vía `POST /journey/plans/:planId/transition`, opcional `learningNote` → `plan_evidence` (`kind: NOTE`, `status: LEARNING`).
- `GET /journey/memory` incluye `learningNote` por plan en la lista.
- `GET /journey/intervention/:territory` incluye `memoryNotes` (últimas 5 del ámbito).
- `MentalidadStart` muestra esas notas como sugerencia al diseñar; no rellenan el plan solas.
- `MemoryScreen` lista la nota bajo cada plan cuando existe.

## 6. Pruebas y semilla

### Unitarias (`apps/api/test/intervention-mentalidad.test.ts`)

- Ejecución sin resueltos → `NONE`.
- Texto con outcome, progreso `MAINTAINED`, `KEEP` con meseta.
- Tabla de revisión existente.

### HTTP (`apps/api/test/intervention-mentalidad.http.test.ts`)

- Activación atómica + idempotencia por `commandKey`.
- Caso CHECK: ejecución suficiente, resultado no conseguido → confirmar MODIFY.
- Caso LIGHTER_OK: avance con menos ocasiones → choices KEEP / REDUCE, sin empujar a subir carga.

Requiere `DATABASE_URL` apuntando a `mk_journey_it`.

### Semilla (`packages/database/scripts/seed-sim-mentalidad.ts`)

- Cuenta `sim.mentalidad.seguimiento@fixtures.mk.invalid`: plan C1 activo, `templateSnapshot` en payload, registros y medidas orientados a ver propuesta CHECK en semana (revisión en fecha de semilla).

## Archivos tocados (referencia rápida)

| Área | Archivos principales |
|------|----------------------|
| Motor | `intervention/engine.ts`, `intervention/review-decision.ts` |
| API | `intervention.service.ts`, `intervention.controller.ts`, `apply-week.ts`, `journey.service.ts`, `dto/plan-stage.dto.ts`, `memory-reading.ts` |
| Web | `lib/intervention-api.ts`, `MentalidadPlanSteps.tsx`, `DesignStudio.tsx`, `MentalidadStart.tsx`, `IndicatorCheckin.tsx`, `InterventionReviewDecision.tsx`, `MemoryScreen.tsx`, `app/(member)/semana/revision/page.tsx` |
| Datos | `seed-sim-mentalidad.ts` |

## Fuera de alcance

- Cambiar scoring o rutas de la Matriz v2.
- Cierre automático de logro: contrato previo de criterio confirmado y evidencia.
- Ayuda práctica MEN-A1 y recorrido en Semana: ver entrega vigente (implementado; no repetir aquí).

## Cómo probar en local

1. Semilla: `cd packages/database && npx tsx scripts/seed-sim-mentalidad.ts`
2. Login cuenta `sim.mentalidad.seguimiento@fixtures.mk.invalid` (password en salida del script).
3. `/semana` o `/semana/revision`: bloque de indicador + revisión si `reviewAt` alcanzado.
4. Diseñar Mentalidad: tres entradas, activación única, plan propio con pregunta de evidencia.

## Aceptación automatizada

Casos y resultados actuales: [`ENTREGA_REVISION_MEN_A1.md`](ENTREGA_REVISION_MEN_A1.md) (sección pruebas). No duplicar tablas aquí.

Endpoints de revisión conjunta:

- `GET /api/v1/journey/intervention/week-review/pending?weekStart=`
- `POST /api/v1/journey/intervention/week-review/apply` body `{ weekStart, note?, commandKey }`

## Resultado propio (oct 2026)

- Módulo: `plan-outcome-contract.ts`
- Columna: `personal_plans.outcome_contract` (JSON)
- Evidencia: `plan_evidence.kind = OUTCOME`, status `ACHIEVED` | `NOT_YET` | `INSUFFICIENT`
- `PATCH /api/v1/journey/intervention/:territory/plans/:planId/outcome-contract` (confirmación si plan activo y cambia criterio/resultado)
- `POST /api/v1/journey/intervention/:territory/plans/:planId/outcome-assessment`
- `evidenceDigest` en pendiente: `{ outcome, menA1 }`
- Web: `PlanOutcomeReview.tsx`, paso 2 en `DesignChangeFirst.tsx`
