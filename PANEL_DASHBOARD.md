# Qué hace que `/panel` muestre el dashboard

Documento de inventario del código de `/panel`, corregido el 4 nov 2026. El contrato de la matriz está en [DESIGN.md](DESIGN.md). El ciclo de producto está en [PRODUCTO_VIABLE.md](PRODUCTO_VIABLE.md).

URL local: `http://localhost:3000/panel`.
Datos: `GET http://localhost:4000/api/v1/journey/dashboard`, proxied por Next como `/api/v1/journey/dashboard`.

Para ver la matriz hace falta una sesión de miembro, no de admin. `demo.user3@maximus-kratos.local` / `DemoUser123!` entra en `/panel` y ve **Tu recorrido**.

## 1. Cadena de render

```
/panel
  apps/web/app/(member)/layout.tsx
    AppShell
      MemberSideNav, AppTopBar, BottomTabBar
      children
  apps/web/app/(member)/panel/page.tsx
    InicioDashboard
      si canUseMemberProduct: StartDashboard
        JourneyMatrix
```

`InicioDashboard` es el interruptor. La matriz no es el único componente que puede salir en esa ruta.

## 2. Ruta y layout

| Pieza | Archivo | Qué hace |
| --- | --- | --- |
| Página | `apps/web/app/(member)/panel/page.tsx` | Metadata `title: Inicio`. Renderiza solo `InicioDashboard`. |
| Layout de miembro | `apps/web/app/(member)/layout.tsx` | Envuelve con `AppShell`. |
| Shell | `apps/web/components/app-shell/AppShell.tsx` | Si no hay sesión, manda a `/login`. Si el rol es `ADMIN`, manda a `/admin`. En `/panel` añade la clase `mk-app-shell--stage`. Si `canUseMemberProduct`, añade `mk-app-shell--flat`. |
| Nav escritorio | `apps/web/components/app-shell/MemberSideNav.tsx` | Primer enlace: `/panel`, etiqueta **Inicio**, icono `layout-dashboard`. El logo también apunta a `/panel`. |
| Nav activo | `apps/web/lib/member-nav.ts` | `/panel` queda activo también en `/ambito/...`. |
| Barra superior | `apps/web/components/app-shell/AppTopBar.tsx` | Título de ruta `/panel`: **Inicio**. Logo a `/panel`. |
| Tabs móvil | `apps/web/components/app-shell/BottomTabBar.tsx` | Tab **Inicio** con `href: '/panel'`. También activo en `/ambito/`. |
| Icono | `apps/web/components/icons/lucide/layout-dashboard.tsx` | Icono del enlace Inicio. |
| Proxy | `apps/web/next.config.ts` | `/api/v1/:path*` se reescribe al API (`NEXT_PUBLIC_API_URL` o `http://localhost:4000`). |
| PWA | `apps/web/app/manifest.ts` | `start_url: '/panel'`. |
| Robots | `apps/web/app/robots.ts` | `/panel` no se indexa. |

Redirecciones que terminan en `/panel`:

- `apps/web/app/bienvenido/page.tsx`
- `apps/web/app/(member)/mente/page.tsx`
- `apps/web/app/(member)/cuerpo/page.tsx`
- `apps/web/app/(member)/espiritu/page.tsx`
- `apps/web/app/(member)/ruta/page.tsx`
- `apps/web/app/(member)/asesores/page.tsx`

Después del login, `apps/web/lib/auth-redirect.ts` (`getPostAuthPath`) devuelve `/panel` para el miembro.

## 3. Quién ve la matriz y quién ve otra cosa

`apps/web/components/pages/InicioDashboard.tsx`

1. Mientras la sesión carga: `DashboardSkeleton` (clases `mk-dashboard`, `mk-skeleton`).
2. Si `canUseMemberProduct(user)` es falso y hay perfil diagnóstico: `ProfileDashboard` (radar, KPIs, pilares). Usa `RadarProfile`, `KpiCard`, `computePillarScores`.
3. Si no puede usar el producto y no hay perfil: `FounderAccessDashboard`.
4. Si puede usar el producto: `StartDashboard`. Esa es la matriz.

`canUseMemberProduct` en el cliente lee `user.access.canUseMemberProduct` (`apps/web/lib/member-access.ts`).

En el API, `apps/api/src/auth/member-access.ts` (`resolveMemberAccess`) pone `canUseMemberProduct: true` para cualquier `userId` autenticado. El flag de preview solo marca `isMemberPreview`.

`DiagnosticOpenGuard` (`apps/api/src/diagnostic/diagnostic-open.guard.ts`) usa ese mismo flag. `JourneyController` está protegido con `JwtAuthGuard` y `DiagnosticOpenGuard`.

Sesión en el cliente: `apps/web/components/auth-session-provider.tsx` incluye `/panel` entre las rutas de miembro. El token sale de `apps/web/lib/auth-storage.ts` (`getAccessToken`).

## 4. Componentes de la matriz

### `StartDashboard`

`apps/web/components/member/StartDashboard.tsx`

- Cliente.
- Pide en paralelo `fetchDashboard` y `fetchReturnReading`.
- Carga: `.mk-mx-wrap` con `.mk-mx-skeleton`. No usa `MemberPage` para la matriz ya cargada.
- Error o respuesta sin `matrix`: **Reintentar**. No inventa filas.
- Éxito: una tarjeta de siguiente paso (`dashboardNextStep`), una franja de dirección hacia `/proposito`, y después `JourneyMatrix`.
- El retorno de siete días o más, si aplica, entra en esa misma tarjeta. No hay una segunda presentación de la matriz.
- Pie: explorar una situación, hacia `/diagnostico?alcance=general`. No crea un plan.

### `JourneyMatrix`

`apps/web/components/member/JourneyMatrix.tsx`

Una sola tabla, `.mk-mx-table`, dentro de `.mk-mx-scroll`. No hay `.mk-mx-cards` ni una segunda presentación bajo 1024 px.

Columnas: Descubre, Diseña y Actúa. La primera columna es el ámbito. En móvil la tabla se desplaza en horizontal. `.mk-mx-table__territory` y la esquina quedan fijas, así el nombre sigue visible. La cabecera está en la misma tabla y se desplaza con las filas. Si el ancho alcanza, no hace falta desplazar. El scroll vertical sigue siendo el de la página.

Filas, en el orden que manda el API: Mentalidad, Finanzas, Relaciones, Salud física.

Actúa puede mostrar el estado de las ocasiones (`actWeekDetail`, `actStatusCopy`). Eso no es una cuarta fase. `complianceCopy` traduce un porcentaje del payload y la matriz no lo usa como columna.

Enlaces de celda:

| Celda | Destino |
| --- | --- |
| Descubre | `/ambito/{territorio}?fase=descubre` |
| Excepciones | el mismo, más `&excepciones=1` |
| Crear plan | `/disenar?territorio={territorio}` |
| Continuar borrador | `/disenar/{planId}` |
| Ver plan | `/planes/{planId}` |
| Actúa sin plan | `/semana` |
| Actúa en preparación | el mismo destino que Diseña |
| Actúa en pausa o cerrado | `/planes/{planId}` |
| Actúa activo o en mantenimiento | `/semana?planId={planId}` |

Si hay más de un plan, la celda muestra el número. El enlace abre el plan representativo, no una lista. No hay un enlace «Ver los N planes».

Textos de estado: `apps/web/lib/territory-ui-copy.ts` (`territoryCoverageLabel`, `planStageLabel`, `discoverActionLabel`, `designActionLabel`, `actStatusCopy`, `actWeekDetail`). `complianceCopy` existe y no pinta una columna.

### `MemberPage`

`apps/web/components/member/MemberPage.tsx`

Solo envuelve carga y error. La matriz cargada no usa `MemberPage`, para no quedar limitada al ancho de `.mk-m-page`.

## 5. Estilos

Todo en `apps/web/app/globals.css`, bloque `.mk-mx*`:

- `.mk-mx-wrap`: hasta 1200 px, centrado.
- `.mk-mx-scroll`: desplazamiento horizontal de la tabla. No sustituye el scroll vertical de la página.
- `.mk-mx-table__territory`: nombre del ámbito, sticky.
- `.mk-mx__chip`: etiqueta **Foco**.
- No hay grilla de cinco columnas ni tarjetas `.mk-mx-cards`.

El chrome del miembro (nav, título, botones `.mk-m-*`) está en el mismo archivo, más arriba.

## 6. API

`GET /api/v1/journey/dashboard`

| Pieza | Archivo |
| --- | --- |
| Ruta | `apps/api/src/journey/journey.controller.ts`, método `dashboard` |
| Orquestación | `apps/api/src/journey/journey.service.ts`, `memberDashboard` |
| Armado | `apps/api/src/journey/dashboard.ts`, `buildDashboard`, `pickRepresentativePlan`, `nextPlanOccasion` |
| Orden de filas | `DASHBOARD_TERRITORY_ORDER` en ese mismo archivo |
| Cobertura | `apps/api/src/instrumentos/territory-catalog.ts` |
| Etiquetas | `apps/api/src/instrumentos/glossary.ts`, `TERRITORY_LABEL` |
| Conteo | `apps/api/src/journey/week-count.ts`, `weekCounts` |
| Próxima ocasión | `apps/api/src/journey/apply-week.ts`, `futureOccasions` |
| Etapa legacy | `apps/api/src/journey/plan-lifecycle.ts`, `fromLegacy` |
| Cliente | `apps/web/lib/journey-api.ts`, `fetchDashboard`, tipos `MemberDashboard`, `MatrixRow`, `MatrixPlan`, `MatrixWeek` |
| Retorno | `GET /api/v1/journey/return`, `fetchReturnReading` |

`memberDashboard` lee, siempre de la cuenta del JWT:

- ledger de respuestas (`answerLedger`)
- planes `personalPlan` del `userId`
- preguntas del formulario vigente
- acciones, registros, horarios y si la semana civil está revisada

`buildDashboard` deja los campos viejos (`territories`, `focusPlan`, `otherActivePlans`, `chooseStart`) y añade `matrix`. Esos campos viejos no son la pantalla.

Cada fila de `matrix`:

```json
{
  "territory": "MENTALIDAD",
  "label": "Mentalidad",
  "discover": { "state": "NOT_STARTED", "settled": 0, "required": 11, "exceptionCount": 0 },
  "planCount": 0,
  "plan": null
}
```

Si hay plan representativo activo o en mantenimiento, `plan` incluye `id`, `title`, `stage`, `isFocus`, `nextOccasion` y `week`. `week` es el objeto de `weekCounts` (`percent`, `percentReason`, conteos). El frontend no recalcula el porcentaje. La celda de Actúa muestra ocasiones y estado, no una columna de índice.

Selección del plan representativo, solo para mostrar:

1. Plan en foco del ámbito.
2. Activo actualizado más recientemente.
3. Mantenimiento.
4. En preparación.
5. En pausa.
6. Cerrado más reciente.

Desempate: `updatedAt`, luego `id`.

## 7. Destinos que la matriz abre

Estos archivos no pintan `/panel`, pero son a donde llevan las celdas.

| Ruta | Archivo | Componente |
| --- | --- | --- |
| `/ambito/[territory]` | `apps/web/app/(member)/ambito/[territory]/page.tsx` | `TerritoryScreen`. Lee `?fase=descubre\|disena\|actua`. |
| `/disenar` | `apps/web/app/(member)/disenar/page.tsx` | `DesignStudio`. Lee `?territorio=`. |
| `/disenar/[planId]` | `apps/web/app/(member)/disenar/[planId]/page.tsx` | `DesignStudio` con `planId`, que monta `PlanDesignFlow` para cualquier plan en preparación de los cuatro ámbitos. |
| `/planes` | `apps/web/app/(member)/planes/page.tsx` | `PlansIndex`. Filtra `?territorio=`. |
| `/planes/[planId]` | `apps/web/app/(member)/planes/[planId]/page.tsx` | detalle del plan |
| `/semana` | `apps/web/app/(member)/semana/page.tsx` | `CalendarScreen`. Filtra `?planId=`. |

Fase del ámbito: `apps/web/components/member/TerritoryScreen.tsx` y pestañas `apps/web/components/member/MemberTabs.tsx`.

Crear plan con ámbito: el cliente sale de `DesignStudio` y de `PlanDesignFlow`, no de `PlansScreen`. `PlansScreen` no es esta ruta.

## 8. Pruebas y capturas

| Prueba | Qué cubre |
| --- | --- |
| `apps/api/test/dashboard.test.ts` | Cuatro filas, orden, plan representativo, semana del foco. |
| `apps/web/test/territory-ui-copy.test.ts` | Etiquetas y cumplimiento, incluido `0 %` real. |
| `apps/web/test/journey-followup.test.tsx` | Semana sin ficha de alineación y revisión explícita. |
| `e2e/dashboard-ambitos.spec.ts` | En 1440 px espera el título **Tu recorrido** y la tabla. Hace falta `E2E_PREVIEW_EMAIL`, `E2E_PASSWORD` y `DATABASE_URL` local. |

Capturas de la cuenta vacía: `tmp/dashboard-matriz/1440-vacio.png`, `1024-vacio.png`, `768-vacio.png`, `390-vacio.png`, `320-vacio.png`.

## 9. Lo que no es este dashboard

Siguen en el repo y no alimentan la matriz de `/panel`:

- `ProfileDashboard` y `FounderAccessDashboard` dentro de `InicioDashboard.tsx`, para cuentas sin `canUseMemberProduct`.
- Imágenes de marketing `apps/web/public/images/landing/dashboard-*.png`.
- El panel de admin en `apps/web/app/admin/page.tsx`.
- Tarjetas `ag-panel` del sitio público.

Si `/panel` muestra radar o la pantalla de fundador, la sesión no está entrando por `StartDashboard`. Si muestra **Tu recorrido** y luego el error de reintento, la ruta existe y falló `GET /journey/dashboard`.
