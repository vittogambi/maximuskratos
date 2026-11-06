# Cambio de producto: implementación detallada

27 oct 2026. Rama de referencia: `pilot/domain-f1-m1-gate`. Este documento describe **qué hay en código** alineado con [PLAN_MAESTRO_RECORRIDO.md](PLAN_MAESTRO_RECORRIDO.md). El plan maestro sigue siendo propuesta; no sustituye especificación firmada.

**Índice**

1. [Marco de producto](#1-marco-de-producto)
2. [Modelo de datos (M1–M4)](#2-modelo-de-datos-m1m4)
3. [Dominio: ámbitos y cobertura](#3-dominio-ámbitos-y-cobertura)
4. [Dominio: ciclo de plan](#4-dominio-ciclo-de-plan)
5. [API Journey: contratos](#5-api-journey-contratos)
6. [Acompañamiento y tablero legacy](#6-acompañamiento-y-tablero-legacy)
7. [Diagnóstico por ámbito](#7-diagnóstico-por-ámbito)
8. [Web miembros: rutas y componentes](#8-web-miembros-rutas-y-componentes)
9. [Cliente HTTP (`journey-api.ts`)](#9-cliente-http-journey-apits)
10. [Estilos `.mk-m-*`](#10-estilos-mk-m)
11. [Pruebas](#11-pruebas)
12. [Operación local y fallos frecuentes](#12-operación-local-y-fallos-frecuentes)
13. [Brecha vs plan maestro](#13-brecha-vs-plan-maestro)
14. [Inventario de archivos](#14-inventario-de-archivos)
15. [Apéndice: fragmentos de código](#15-apéndice-fragmentos-de-código)

Documentos relacionados: [MK_PLAN_MAESTRO_CIERRE_RAMA.md](MK_PLAN_MAESTRO_CIERRE_RAMA.md), [RECORDATORIO_ENTRADA_Y_AVANCE.md](RECORDATORIO_ENTRADA_Y_AVANCE.md).

---

## 1. Marco de producto

### 1.1 Antes vs dirección en código

| Antes (recorrido largo) | Implementado ahora (parcial) |
| --- | --- |
| Entrada al cuestionario completo | Entrada a `/panel` (`StartDashboard`) |
| Índice / alineación como centro | Mapa 4 ámbitos × 3 fases; sin índice en inicio nuevo |
| Espíritu / Mente / Cuerpo en nav operativa | Mentalidad, Finanzas, Relaciones, Salud física |
| Plan activo implícito | `stage`: PREPARING → ACTIVE → … → CLOSED |
| Propuesta = hecho | Propuestas ACCEPT/EDIT/REJECT; activación con `activationBlock` |

### 1.2 Flujo de alto nivel (miembro)

```mermaid
flowchart LR
  subgraph entrada [Entrada]
    Login["/login"]
    Panel["/panel"]
  end
  subgraph ambito [Por ámbito]
    Amb["/ambito/MENTALIDAD"]
    Desc["Descubre: cuestionario + síntesis"]
    Dis["Diseña: /disenar"]
    Act["Actúa: /semana"]
  end
  subgraph plan [Plan]
    Prep["PREPARING"]
    Active["ACTIVE"]
    Logro["/planes/id/logro"]
    Closed["CLOSED"]
  end
  Login --> Panel
  Panel --> Amb
  Amb --> Desc
  Amb --> Dis
  Amb --> Act
  Dis --> Prep
  Prep --> Active
  Active --> Logro
  Logro --> Closed
```

El tablero **legacy** (`GET /journey/state`, `homeBoard`) sigue para transición, acompañamiento guiado y tests HTTP; no es la pantalla principal del mapa.

---

## 2. Modelo de datos (M1–M4)

Base local: `postgresql://mk:mk_local_dev@localhost:5433/maximuskratos`. HTTP de integración: **`mk_journey_it`** (desechable).

### 2.1 M1 `20261021200000_plan_lifecycle_m1`

Columnas nuevas en `personal_plans` (extracto):

| Columna | Uso en producto |
| --- | --- |
| `stage` | PREPARING, ACTIVE, PAUSED, MAINTENANCE, CLOSED |
| `territory` | MENTALIDAD, FINANZAS, RELACIONES, SALUD_FISICA |
| `entry` | NO_DIRECTION, GOAL, OWN_PLAN |
| `why_it_matters`, `why_status`, `why_refs` | Enlace meta ↔ paso |
| `criterion_text`, `criterion_status`, `criterion_revision` | Logro observable |
| `capacity_minutes`, `protect_note` | Activación (tiempo y protección) |
| `is_focus`, `focus_since` | Foco semanal (índice único por usuario) |
| `version` | Concurrencia optimista en patch/decisiones |
| `activated_at`, `achieved_at`, `closed_reason` | Ciclo de vida |

Tabla `plan_transitions`: auditoría `from_stage` → `to_stage` + `reason`.

### 2.2 M2 `20261021210000_action_schedules_m2`

Horarios flexibles, `occasions_per_week`, tabla de schedules y cancelaciones de ocasión (consumida por `loadActionSchedules`, `resolveSchedule`, `flexOccasionCapReached`).

### 2.3 M3 `20261021220000_plan_proposals_evidence_m3`

- `plan_proposals`: `kind`, `payload`, `edited_payload`, `status`, `command_key` (idempotencia).
- `plan_evidence`: evidencia ligada a `criterion_revision`, `status` OBSERVED, texto obligatorio para logro.

### 2.4 M4 `20261021230000_action_record_revision_m4`

Revisión en registros de acción (semana / historial).

### 2.5 Compatibilidad legacy

`compatStatus` / `fromLegacy` en `plan-lifecycle.ts` mapean `DRAFT` ↔ PREPARING, `ARCHIVED` ↔ CLOSED para filas antiguas y queries que aún usan `status`.

---

## 3. Dominio: ámbitos y cobertura

### 3.1 Catálogo

- Fuente: `packages/database/definitions/formulario-completo@6.json` (activo vía seed).
- Mapeo pregunta → ámbito: `territoryForSourceRef` en `apps/api/src/instrumentos/territory-catalog.ts`.
- Tests de disjointness: `apps/api/test/territory-catalog.test.ts`.

### 3.2 Estados de cobertura

```typescript
// territory-catalog.ts
export type TerritoryCoverageState = 'NOT_STARTED' | 'PARTIAL' | 'EXPLORED';
```

Regla: `settled === required` → EXPLORED; `0 < settled < required` → PARTIAL; si no → NOT_STARTED. Las excepciones UNKNOWN / NOT_APPLICABLE / DECLINED cuentan como **settled** pero se contabilizan aparte en `exceptions`.

### 3.3 Dashboard miembro (`buildDashboard`)

Entrada: ledger de respuestas + catálogo de preguntas + planes + conteos de semana del foco.

Salida (`MemberDashboard`):

```typescript
{
  territories: DashboardTerritory[];  // label + coverage
  focusPlan: DashboardPlan | null;    // stage + weekCounts
  otherActivePlans: number;
  chooseStart: boolean;               // true si stages.length === 0
}
```

Implementación: `apps/api/src/journey/dashboard.ts`, orquestación `JourneyService.memberDashboard`.

### 3.4 Síntesis Descubre (`discoverSynthesis`)

No es D-SYN interpretativo. Reutiliza `devolutionOf` (hipótesis reconocidas / pendientes) y marca `partial: true` si la cobertura del ámbito no es EXPLORED.

Archivo: `apps/api/src/journey/discover-synthesis.ts`.

Web: `TerritoryScreen` muestra hasta 6 líneas; UI en español vía `territory-ui-copy.ts` (badge Explorado / En curso / Sin empezar).

---

## 4. Dominio: ciclo de plan

### 4.1 Transiciones permitidas

```typescript
// plan-lifecycle.ts (extracto)
PREPARING → ACTIVE | CLOSED(DISCARDED)
ACTIVE → PAUSED | MAINTENANCE | CLOSED
PAUSED → ACTIVE(RETURN) | CLOSED
MAINTENANCE → ACTIVE | PAUSED | CLOSED
CLOSED → (ninguna)
```

### 4.2 Activación (`activationBlock`)

Faltantes posibles: `GOAL`, `TIME`, `RESTRICTIONS`, `ACTION`, `CONFIRMATION`.

`planActivationInput` combina plan + patch + conteo de acciones activas + `explicitNoSchedule`.

HTTP: `POST /journey/plans/:id/activate` y rama `status: ACTIVE` en `PATCH` (delega en `activatePlan`).

En activación se aplican propuestas no rechazadas vía `planPatchFromProposals` y `actionPatchesFromProposals` (`plan-proposal-apply.ts`).

### 4.3 Propuestas (`plan-proposal-domain.ts`)

| Regla | Comportamiento |
| --- | --- |
| `proposalStatus` | ACCEPTED con `editedPayload` no vacío → tratado como EDITED |
| `storedPayload` | EDITED usa `editedPayload`; si no, `payload` |
| `decidePlanProposal` | EDIT exige body; ACCEPT pone `editedPayload: JsonNull` |

### 4.4 Logro (`declareAchievement`)

Cadena:

1. `canDeclareAchievement`: `criterionStatus === 'CONFIRMED'` y texto.
2. `achievementEvidenceReady`: evidencia `OBSERVED` con texto para `criterion_revision` vigente.
3. Transición a `CLOSED`, `achieved_at`, quita foco, desactiva acciones (transacción en servicio).

Códigos HTTP: `CRITERION_NOT_CONFIRMED`, `ACHIEVEMENT_EVIDENCE_REQUIRED`.

### 4.5 Semana y ocasiones

- `futureOccasions(from, weekday, intervalDays)`: días civiles ISO que coinciden con weekday; filtro cada N semanas según intervalo (`apply-week.ts`).
- `flexOccasionCapReached`: tope de ocasiones flex en semana (`FLEX_WEEK_CAP` en respuesta API).
- `isOccasionRegistrationDay`: unifica validación al registrar (`upsertRecord`).
- Revisión: `review-guidance.ts` + `review-reading.ts` en preview/cierre de semana.

### 4.6 Territorio del plan

`plan-territory-assignment.ts`, endpoints `GET/POST .../plans/:id/territory` (propuesta + confirmación con `expectedVersion`).

---

## 5. API Journey: contratos

Controlador: `apps/api/src/journey/journey.controller.ts` (guard: `JwtAuthGuard` + `DiagnosticOpenGuard`).

### 5.1 Tablero nuevo (producto ámbitos)

| Método | Ruta | Servicio |
| --- | --- | --- |
| GET | `/journey/dashboard` | `memberDashboard` |
| GET | `/journey/territories/:territory` | `territoryView` |
| GET | `/journey/memory` | `memory` |
| GET/POST | `/journey/return` | `returnReading` |

Ejemplo respuesta dashboard (forma):

```json
{
  "territories": [
    {
      "territory": "MENTALIDAD",
      "label": "Mentalidad",
      "required": 11,
      "settled": 0,
      "pending": 11,
      "exceptions": { "UNKNOWN": 0, "NOT_APPLICABLE": 0, "DECLINED": 0 },
      "state": "NOT_STARTED"
    }
  ],
  "focusPlan": null,
  "otherActivePlans": 0,
  "chooseStart": true
}
```

Ejemplo territorio (campos extra):

```json
{
  "territory": "MENTALIDAD",
  "label": "Mentalidad",
  "coverage": { "settled": 35, "required": 35, "state": "EXPLORED", "..." : "..." },
  "synthesis": [
    { "text": "No hay una frase de visión guardada.", "sourceRef": null, "partial": true }
  ],
  "plans": []
}
```

### 5.2 Plan: borrador, propuestas, activación

| Método | Ruta | Notas |
| --- | --- | --- |
| POST | `/journey/plans/draft` | `entry`, `territory` |
| PATCH | `/journey/plans/:id` | borrador + activación legacy |
| POST | `/journey/plans/:id/activate` | `ActivatePlanDto` |
| POST | `/journey/plans/:id/transition` | `toStage`, `reason` |
| GET | `/journey/plans/:id/proposals` | listado |
| POST | `/journey/plans/:planId/proposals/:proposalId/decide` | ACCEPT / EDIT / REJECT |
| POST | `/journey/plans/:id/evidence` | evidencia de logro |
| POST | `/journey/plans/:id/achievement` | `confirm: true` |
| GET/POST | `/journey/plans/:id/territory/...` | asignación ámbito |

### 5.3 Semana y calendario

| Método | Ruta |
| --- | --- |
| GET | `/journey/calendar` |
| POST | `/journey/records` |
| POST | `/journey/weeks/preview` |
| POST | `/journey/weeks/close` |
| GET | `/journey/weeks` |

### 5.4 Legacy aún usado

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/journey/state` | Home board situational (GUIDED, OWN, …) |
| POST | `/journey/accompaniment/preview` | Meta guiada |
| POST | `/journey/accompaniment` | Crea plan PREPARING + acción SYSTEM_TEMPLATE |

---

## 6. Acompañamiento y tablero legacy

### 6.1 Plan en PREPARING tras confirmar guía

En `accompaniment.service.ts`, al aceptar propuesta con acción:

- `personalPlan.create`: `status: 'DRAFT'`, `stage: 'PREPARING'`.
- `planAction.create`: `origin: 'SYSTEM_TEMPLATE'`, `weekday` si `body.weekday` numérico o flexible.

**Consecuencia:** `occasionGuidance` y `nextOccasion` filtran `plan.status === 'ACTIVE'`. Hasta activar, la semana puede devolver `MISSING_INFORMATION` en tests si no se hace `PATCH` con `activatePlanBody()`.

### 6.2 `primaryPlan` (27 oct)

```typescript
// accompaniment.service.ts
private async primaryPlan(userId: string) {
  const active = await findFirst({ status: 'ACTIVE' });
  if (active) return active;
  return findFirst({ status: 'DRAFT' }, orderBy createdAt desc);
}
```

Permite preview MODIFY con plan en preparación (`plan.updatedAt` en respuesta).

---

## 7. Diagnóstico por ámbito

### 7.1 HTTP

| Método | Ruta |
| --- | --- |
| POST | `/diagnostic/territory/:territory/start` |

Parámetros ámbito: `MENTALIDAD`, `FINANZAS`, `RELACIONES`, `SALUD_FISICA` (case insensitive en URL, normalizado en servicio).

### 7.2 Comportamiento (`startOrResumeForTerritory`)

1. `startOrResume` sesión activa catálogo.
2. Desbloquea módulos cuyas preguntas pertenecen al ámbito (`moduleMatchesTerritory`).
3. Persiste `metadata.focusTerritory`.
4. `buildState(..., { territory })` limita navegación a preguntas del ámbito.

### 7.3 Pasos terminales en player

Tipos en `diagnostic.types.ts`:

```typescript
| { type: 'territory_complete'; data: { territory: string } }
| { type: 'territory_pause'; data: { territory: string; moduleSlug: string } }
```

Web enruta con `ambitoPathForTerritory` (`diagnostic-continue.ts`):

- `territory_complete` → `/ambito/X?cuestionario=completo`
- `territory_pause` → `/ambito/X?cuestionario=pausa`

`DiagnosticPlayer.tsx` y `routeDiagnosticFromState` comparten la misma lógica.

### 7.4 Actividades Ikigai obligatorias

`isRequiredActivity` incluye `E-PER-000!R241` (profesión). No admite excepción en API aunque el JSON del formulario liste DECLINED: `allowedExceptions: []` en payload al cliente si es required.

---

## 8. Web miembros: rutas y componentes

### 8.1 Mapa de rutas `(member)`

| Ruta | Archivo page | Componente principal |
| --- | --- | --- |
| `/panel` | `app/(member)/panel/page.tsx` | `InicioDashboard` → `StartDashboard` |
| `/ambito/[territory]` | `app/(member)/ambito/[territory]/page.tsx` | `TerritoryScreen` |
| `/disenar` | `disenar/page.tsx` | listado |
| `/disenar/[planId]` | `disenar/[planId]/page.tsx` | `DesignPlanFlow` |
| `/planes/[planId]` | `planes/[planId]/page.tsx` | detalle |
| `/planes/[planId]/logro` | `logro/page.tsx` | evidencia + logro + cierre |
| `/planes/[planId]/mantener` | `mantener/page.tsx` | mantenimiento / aviso CLOSED |
| `/semana`, `/calendario`, `/memoria`, `/proposito` | respectivos | flujos existentes |

Post login: `getPostAuthPath` → `/panel` para miembros con producto (`auth-redirect.ts`).

### 8.2 `StartDashboard`

- `fetchDashboard` + `fetchReturnReading`.
- Tarjetas ámbito → `/ambito/{territory}`.
- Bloque retorno si `daysAway >= 7`.
- `chooseStart`: CTAs diseñar / explorar primer ámbito.

### 8.3 `TerritoryScreen` (UI 27 oct)

- Hero: métrica grande, badge estado ES, barra progreso.
- Tabs segmentadas: Descubre / Diseña / Actúa + hint por fase.
- Insights en tarjetas; CTA cuestionario; ghost “Volver al mapa”.
- Diseña: lista `mk-m-plan-card`; Actúa: semana + calendario.

### 8.4 `DesignPlanFlow`

Pasos: **Meta → Propuestas → Confirmar → Activar**.

- `patchPlanDraft`: título, outcome, capacity, protect, criterion + confirmación criterio.
- `decidePlanProposal` en lote para propuestas pendientes.
- `activatePlanDraft` con `commandKey: activate:{planId}`; error `ACTIVATION_INCOMPLETE` vuelve a paso 0.

### 8.5 Nav

`MemberSideNav.tsx` + `isMemberNavActive`: `/panel` activo también en `/ambito/*`.

### 8.6 Player (fuera de `(member)` pero acoplado)

Archivos tocados en working tree: `DiagnosticPlayer.tsx`, `DiagnosticEntry.tsx`, `PlayerStage.tsx`, `QuestionCard.tsx`, `ModuleOutro.tsx`, `section-copy.ts`, `player-back.ts`, `AreaSectionsRail.tsx`, `AuditCloseScreen.tsx`.

Persisten reglas Matrix v2; cambios son navegación, copy y routing post ámbito.

---

## 9. Cliente HTTP (`journey-api.ts`)

Clase de error: `JourneyApiError` (`status`, `code`, `nextHref`, `alternatives`, `scope`).

Funciones nuevas o ampliadas (extracto):

| Función | Endpoint |
| --- | --- |
| `fetchDashboard` | GET dashboard |
| `fetchTerritory` | GET territories/:t |
| `fetchReturnReading` | GET return |
| `createPlanDraft` | POST plans/draft |
| `fetchPlanProposals` | GET plans/:id/proposals |
| `patchPlanDraft` | PATCH plans/:id |
| `decidePlanProposal` | POST decide |
| `activatePlanDraft` | POST activate |
| `addPlanEvidence` | POST evidence |
| `declarePlanAchievement` | POST achievement |
| `transitionPlanStage` | POST transition |

Helper tests HTTP: `apps/api/test/plan-activation-body.ts` → `{ status: 'ACTIVE', confirmed: true, capacityMinutes: 120, protectNote: '...' }`.

Web API diagnóstico: `apiDiagnosticStartTerritory` en `apps/web/lib/api.ts`.

---

## 10. Estilos `.mk-m-*`

Bloque en `apps/web/app/globals.css` (~línea 22232+).

| Clase | Rol |
| --- | --- |
| `.mk-m-page`, `.mk-m-title`, `.mk-m-eyebrow` | Layout miembro; título serif |
| `.mk-m-btn`, `.mk-m-btn--ghost` | Primario dorado / secundario outline |
| `.mk-m-tabs`, `.mk-m-tabs__tab--active` | Segment control 3 fases |
| `.mk-m-territory-hero`, `.mk-m-progress` | Progreso ámbito |
| `.mk-m-insight`, `.mk-m-badge--done` | Lecturas Descubre |
| `.mk-m-plan-card` | Planes en pestaña Diseña |
| `.mk-m-territory-card` | Lista inicio |
| `.mk-m-field`, `.mk-m-input` | Formularios Diseña (si definidos en mismo bloque) |

Contrato visual: fondo operativo `#0a0a0a`, acción `#c8a96e`, sin chrome de marketing (`DESIGN.md`).

---

## 11. Pruebas

### 11.1 Comandos

```bash
npm test                                    # ~953 tests (engines + api sin HTTP + web)
npm run test:domain -w @mk/api              # ~225
npm run test:components -w @mk/web        # ~75
npm run test:acceptance                     # domain + components + HTTP mk_journey_it
```

### 11.2 `test:domain` (lista en `apps/api/package.json`)

Incluye entre otros: `territory-catalog`, `plan-lifecycle`, `plan-proposal-apply`, `plan-proposal-domain`, `plan-territory-assignment`, `diagnostic-territory`, `action-schedule`, `apply-week`, `review-reading`, `home-board`, `accompaniment-rules`, `execution`, `week-count`, `answer-ledger`, `purpose-link`, `personalization`.

### 11.3 HTTP (`vitest.integration.config.ts`)

Excluye unit tests; exige `DATABASE_URL` con `/mk_journey_it`.

Archivos: `journey-http.test.ts`, `realistic-cases.http.test.ts`, `home-board.http.test.ts`, `accompaniment-contract.http.test.ts`, `admin-journey.http.test.ts`, `plan-activation.http.test.ts`, `plan-achievement.http.test.ts`, `journey-rate.test.ts`, `http-bind.test.ts`.

Escenario: `apps/api/test/journey-scenario.json` (~1025 líneas). Tipos `multi` para E-PER R40 (4–10 valores) y R51 (3 de los elegidos).

### 11.4 Web

`territory-ui-copy.test.ts`, `journey-followup.test.tsx`, `player-back.test.ts`, `diagnostic-continue.test.ts`, `journey-surface.test.tsx`.

### 11.5 Build API para HTTP

- `apps/api/tsconfig.build.json`: `incremental: false` (evita `dist` vacío tras `deleteOutDir`).
- `apps/api/nest-cli.json`: `tsConfigPath: tsconfig.build.json`.

---

## 12. Operación local y fallos frecuentes

```bash
docker compose up -d --wait
npm run db:migrate:deploy    # obligatorio tras pull con M1–M4
npm run dev                  # o dev:api + dev:web
```

| Síntoma | Causa típica | Acción |
| --- | --- | --- |
| ERR_CONNECTION_REFUSED :3000 | Web/API no levantados | `npm run dev:web` / `dev:api` |
| «No se pudo leer el inicio» | 500 dashboard; falta columna `stage` | `db:migrate:deploy` |
| Dashboard 500 P2022 | Misma causa | Migrar |
| HTTP tests fallan al inicio | Sin `dist` | `npm run build -w @mk/api` |
| CORS / API unreachable | Env | `NEXT_PUBLIC_API_URL=http://localhost:4000`, `CORS_ORIGINS` |

Cuentas seed: ver README (`admin@maximus-kratos.local`, `demo.user3@...`). Player parcial: scripts en `packages/database/scripts/`.

---

## 13. Brecha vs plan maestro

### 13.1 Implementado (núcleo)

Mapa ámbitos, cobertura, cuestionario focalizado, síntesis Descubre mínima, Diseña 4 pasos, activación, semana, logro con evidencia, propuestas, territorio plan, retorno/memoria API, nav miembro.

### 13.2 Parcial

D-SYN (interpretación confirmable en UI), B-04/B-05 Diseña, P3A plantillas, memoria rica, marketing alineado, T8.4 capturas navegador.

### 13.3 No hecho

F8 copy/admin/beta, F9–F10 cobro MP, fixture `@4` completo, commit único del WIP player/auth.

### 13.4 WIP en working tree (no inventariado como entregable)

Auth (`auth.constants.ts`, `auth.service.ts`), player extenso, docs raíz (`PLAN_MAESTRO_RECORRIDO.md`, `RECORDATORIO_...`), `formulario-completo@6.json` menor, capturas `tmp/`.

---

## 14. Inventario de archivos

### 14.1 API journey / diagnóstico (núcleo cambio)

```
apps/api/src/journey/
  dashboard.ts              # buildDashboard, territoryDetail
  discover-synthesis.ts     # síntesis Descubre
  plan-lifecycle.ts         # stages, activation, logro
  plan-proposal-domain.ts
  plan-proposal-apply.ts
  plan-territory-assignment.ts
  apply-week.ts             # futureOccasions ISO
  action-schedule.ts        # flex cap, resolveSchedule
  civil-week.ts             # dayMatchesIsoWeekday
  week-count.ts
  review-reading.ts
  review-guidance.ts
  journey.service.ts        # memberDashboard, territoryView, activate, declareAchievement
  journey.controller.ts
  accompaniment.service.ts  # primaryPlan
apps/api/src/diagnostic/
  diagnostic-territory.ts
  diagnostic.service.ts     # startOrResumeForTerritory, buildState territory steps
apps/api/src/instrumentos/
  territory-catalog.ts
  answer-ledger.ts
```

### 14.2 Web

```
apps/web/components/member/
  StartDashboard.tsx
  TerritoryScreen.tsx
  DesignPlanFlow.tsx
  MemberPage.tsx
  MemberTabs.tsx
apps/web/lib/
  journey-api.ts
  diagnostic-continue.ts
  territory-ui-copy.ts
  member-nav.ts
apps/web/app/(member)/ambito/[territory]/page.tsx
apps/web/app/globals.css     # .mk-m-*
```

### 14.3 Tests clave

```
apps/api/test/journey-scenario.json
apps/api/test/journey-http.test.ts
apps/api/test/plan-achievement.http.test.ts
apps/api/test/plan-proposal-domain.test.ts
apps/api/test/player-navigation.test.ts
apps/web/test/territory-ui-copy.test.ts
scripts/test-acceptance.sh
```

---

## 15. Apéndice: fragmentos de código

### 15.1 Cobertura EXPLORED

```122:127:apps/api/src/instrumentos/territory-catalog.ts
    let state: TerritoryCoverageState = 'NOT_STARTED';
    if (required === 0) state = 'NOT_STARTED';
    else if (settled === 0) state = 'NOT_STARTED';
    else if (settled < required) state = 'PARTIAL';
    else state = 'EXPLORED';
```

### 15.2 Puerta de logro

```65:75:apps/api/src/journey/plan-lifecycle.ts
export function canDeclareAchievement(plan: PlanAchievementGate): boolean {
  if (plan.stage && plan.stage !== 'ACTIVE' && plan.stage !== 'MAINTENANCE') return false;
  return plan.criterionStatus === 'CONFIRMED' && Boolean(plan.criterionText?.trim());
}

export function achievementEvidenceReady(evidence: AchievementEvidenceRow | null | undefined): boolean {
  return evidence?.status === 'OBSERVED' && Boolean(evidence?.text?.trim());
}
```

### 15.3 ACCEPT limpia edición en propuesta

```2341:2350:apps/api/src/journey/journey.service.ts
    const status =
      input.decision === 'REJECT' ? 'REJECTED' : input.decision === 'EDIT' ? 'EDITED' : 'ACCEPTED';
    const updated = await this.prisma.planProposal.update({
      where: { id: proposal.id },
      data: {
        status,
        decidedAt: new Date(),
        ...(input.decision === 'EDIT' && input.editedPayload ? { editedPayload: asJson(input.editedPayload) } : {}),
        ...(input.decision === 'ACCEPT' ? { editedPayload: Prisma.JsonNull } : {}),
```

### 15.4 Ocasiones futuras (ISO weekday)

```193:201:apps/api/src/journey/apply-week.ts
export function futureOccasions(from: string, weekday: number, intervalDays: number, horizon = 21): string[] {
  const dates: string[] = [];
  for (let offset = 0; offset < horizon; offset += 1) {
    const day = addIsoDays(from, offset);
    if (dayMatchesIsoWeekday(day, weekday)) dates.push(day);
  }
  const every = Math.max(1, Math.round(Math.max(7, intervalDays) / 7));
  return dates.filter((_, index) => index % every === 0);
}
```

### 15.5 Vista territorio API

```1971:2020:apps/api/src/journey/journey.service.ts
  async territoryView(userId: string, territory: string) {
    const t = territory.toUpperCase();
    if (!['MENTALIDAD', 'FINANZAS', 'RELACIONES', 'SALUD_FISICA'].includes(t)) {
      throw new BadRequestException('Ámbito desconocido.');
    }
    // ... ledger, territoryDetail, discoverSynthesis, plans ...
    return {
      ...detail,
      synthesis,
      plans: plans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        stage: plan.stage ?? fromLegacy(plan.status as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'),
        isFocus: plan.isFocus,
      })),
    };
  }
```

### 15.6 Routing player → ámbito

```3:10:apps/web/lib/diagnostic-continue.ts
export function ambitoPathForTerritory(
  territory: string,
  hint?: 'territory_complete' | 'territory_pause',
): string {
  const base = `/ambito/${encodeURIComponent(territory)}`;
  if (hint === 'territory_complete') return `${base}?cuestionario=completo`;
  if (hint === 'territory_pause') return `${base}?cuestionario=pausa`;
  return base;
}
```

### 15.7 Escenario HTTP multi (valores)

```json
"formulario-v1:E-PER-000!R40": {
  "kind": "multi",
  "values": ["Claridad mental", "Coherencia", "Disciplina", "Honestidad"]
},
"formulario-v1:E-PER-000!R51": {
  "kind": "multi",
  "values": ["Claridad mental", "Coherencia", "Disciplina"]
}
```

Payload en tests: `journey-http.test.ts` y `realistic-cases.http.test.ts` ramas `spec.kind === 'multi'`.

### 15.8 Etiquetas UI cobertura

```1:16:apps/web/lib/territory-ui-copy.ts
export function territoryCoverageLabel(state: string | undefined): string {
  switch (state) {
    case 'EXPLORED':
      return 'Explorado';
    case 'PARTIAL':
      return 'En curso';
    case 'NOT_STARTED':
    default:
      return 'Sin empezar';
  }
}
```

---

*Fin del documento. Para checklist de merge y fases F0–F10, usar [MK_PLAN_MAESTRO_CIERRE_RAMA.md](MK_PLAN_MAESTRO_CIERRE_RAMA.md).*
