# Especificación de UI y UX: recorrido por ámbitos

17 oct 2026. Complemento de [MK_PLAN_MAESTRO_IMPLEMENTACION.md](MK_PLAN_MAESTRO_IMPLEMENTACION.md). Es la autoridad de implementación de las pantallas nuevas y de las que el plan maestro adapta. No autoriza implementar por sí misma ni cambia copy público. Las decisiones de diseño de este documento son propuestas del equipo: no están aprobadas por Rafa.

## 0. Cómo usar este documento

Cada decisión lleva una marca:

- **[PLAN]** Definida por el plan de producto o por el plan maestro. Se cita la sección.
- **[DISEÑO]** Decisión de diseño resuelta aquí. El ejecutor la implementa tal cual. Cambiarla requiere editar este documento.
- **[BLOQUEA]** Pendiente que impide implementar una parte concreta. Se delimita qué parte y qué puede avanzar.

Superficie: miembros (`AppShell`, `.mk-app-shell`), salvo el player del cuestionario (`.dk-shell`) y admin (`AdminShell`). Prevalecen, en este orden: la instrucción del usuario, el plan maestro, este documento, `DESIGN.md`. Donde este documento contradice `DESIGN.md` («Inicio de miembros»), `DESIGN.md` se actualiza en la tarea T4.2.

IDs: pantallas `S-xx`, estados y variantes `S-xx.Vn`, pasos `S-xx.Pn`, cambios de backend que pide la experiencia `B-xx`, datos de referencia `R-xx`.

## 1. Qué se conserva y qué se adapta

Revisado en el código del commit `0e72f69`.

| Pieza existente | Qué hace bien | Qué falla para esta experiencia | Veredicto |
|---|---|---|---|
| `AppShell` (`components/app-shell/AppShell.tsx`) | Sesión, redirección de invitado y admin, shell de 100dvh con scroll en `.mk-app-content` | Lógica de portal hacia `/mente`, `/espiritu`, `/cuerpo` (`enterPortal`, `isDomainPath`); clase `--stage` para la estatua | Conservar. Quitar el portal de pilares y `--stage` en T4.6. Agregar modo tarea (2.4) |
| `MemberSideNav` | Sidebar de 220 px desde 960 px, activo con borde rojo de 2 px | Once enlaces, pilares | Adaptar ítems (2.1) |
| `BottomTabBar` | Barra con safe area, panel Más con Escape y foco devuelto | Íconos SVG en línea distintos del registro; ítems antiguos | Adaptar ítems y usar `AppIcon` |
| `AppTopBar` | Título de página, avatar a Cuenta de 44 px | Títulos antiguos; sin botón Salir para modo tarea | Adaptar (2.4) |
| Player (`components/diagnostico/*`) | Una tarea por paso, Guardar y salir con garantía, motivo del Continuar deshabilitado (`continueHint`), revisión con 409, foco visible | Recorre todo el catálogo en orden fijo | Conservar patrones. Adaptar entrada y salida por ámbito (S-04) |
| `AmbitStage`, `HomeReading`, `IndexSummary` | Estados de carga y error | Pilares, índice, placa | Sustituir por S-01 |
| `AccompanimentFlow` | Vista previa y confirmación con digest y clave | Diez campos técnicos en un formulario, códigos visibles (`ENSENAR_O_CONTRIBUIR`), «Confirmar» sin decir qué se activa | Sustituir por S-06. La lógica de llamada se reutiliza |
| `HelpDraftView` | Muestra lo que el servidor propone sin inventar | Lista de párrafos sin jerarquía; muestra el modo interno («ESTABILIZACION. PROPOSED.») | Sustituir por `ProposalSummary` (S-06.P3) |
| `PlansScreen` | Errores con motivo y borrador conservado | Formulario de plan con vínculo, guía, valor y acciones en una sola pantalla | Sustituir por S-07, S-08 y S-06 |
| `CalendarScreen` | Siete días equivalentes (`.mk-week`), fechas civiles, semana cerrada en solo lectura | Revisión mezclada en un aside con selects por acción, índice y ficha | Adaptar a S-09; la revisión pasa a S-10 |
| `TaskRow` | Hecho como acción principal, otros estados en `details` | «Hecho no acredita el resultado» como texto fijo; resultado con select de cinco valores en la misma fila | Adaptar a `OccasionRow` (S-09) |
| `JourneyNotice` | Mensaje del servidor con enlace | Sin título ni acción de reintento; enlaces a la hoja de ruta | Adaptar a `MemberNotice` (3.6) |
| `ContentMarks`, `ContentClarification` | Marcas declaradas y aclaración de salud o conversación | Ninguno grave | Conservar dentro de S-06 |
| `PurposeScreen`, `IkigaiCross` | Cruce por clic o teclado, edición libre conservada | Firma, ficha IAD, índice | Adaptar a S-14 |
| `ContractSections` | Render del documento firmado | Ninguno | Conservar para S-15 |
| `ExcelProfile` | Lectura del cuestionario | Se presenta como perfil vigente | Conservar en solo lectura dentro de S-15 sin índice, profundidad ni ficha |
| `IkigaiSheet` (`components/ikigai/sheet.tsx`) | Diálogo con Escape, foco, bloqueo de scroll, pie | Vive en el scope `.ik-app` | No se reutiliza en miembros. Se crea `MemberSheet` con el mismo contrato de accesibilidad (3.4) |
| `.mk-form`, `.mk-member-btn`, `.mk-btn-ghost`, `.mk-task`, `.mk-week`, `.mk-section-eyebrow`, `.mk-page-title` | Tokens y alturas táctiles | `.mk-btn-danger` usa mayúsculas y fuente display | Conservar. No usar `.mk-btn-danger` en miembros |

## 2. Navegación cerrada

### 2.1 Ítems

[DISEÑO] Seis destinos. Cuatro en la barra móvil, todos en el sidebar.

| Ítem | Etiqueta | Ícono (`AppIcon`) | Ruta | Activo cuando la ruta empieza por | Móvil | Escritorio |
|---|---|---|---|---|---|---|
| Inicio | Inicio | `layout-dashboard` | `/panel` | `/panel`, `/ambito` | Barra | Sidebar 1 |
| Semana | Semana | `calendar` | `/semana` | `/semana` | Barra | Sidebar 2 |
| Planes | Planes | `map` | `/planes` | `/planes`, `/disenar` | Barra | Sidebar 3 |
| Propósito | Propósito | `compass` | `/proposito` | `/proposito` | Más | Sidebar 4 |
| Memoria | Memoria | `book-open` | `/memoria` | `/memoria` | Más | Sidebar 5 |
| Cuenta | Cuenta | `user-check` | `/cuenta` | `/cuenta` | Más y avatar | Sidebar, al pie, separado por un borde |

Barra móvil: Inicio, Semana, Planes, Más. Íconos de 22 px, etiqueta de 12 px. El estado activo usa el indicador rojo de 2 px existente y `aria-current="page"`; no cambia el grosor del trazo. Más abre el panel existente con Propósito, Memoria y Cuenta.

`AppTopBar`: título de la sección activa con la etiqueta de la tabla. En `/ambito/[slug]` el título es el nombre del ámbito. En `/planes/[id]` es «Plan». El avatar sigue llevando a Cuenta.

### 2.2 Rutas y tipo de cada vista

| Ruta | Tipo | Pantalla |
|---|---|---|
| `/panel` | Página | S-01 Inicio |
| `/ambito/[slug]` con `?fase=descubre\|disena\|actua` | Página con pestañas | S-02 Ámbito. Slugs: `mentalidad`, `finanzas`, `relaciones`, `salud-fisica` |
| `/diagnostico?ambito=[slug]` y subrutas actuales | Sesión de player | S-04 Preguntas del ámbito |
| `/disenar` con `?entrada=sin-direccion\|meta\|plan-propio` y `&ambito=[slug]` opcional | Página | S-05 Elegir cómo empezar |
| `/disenar/[planId]` con `?paso=intencion\|semana\|propuesta\|confirmar` | Página en modo tarea | S-06 Diseño del plan |
| `/planes` | Página | S-07 Planes |
| `/planes/[planId]` | Página | S-08 Plan |
| `/planes/[planId]/ajustar` | Página en modo tarea | S-11 Ajustar el plan |
| `/planes/[planId]/logro` con `?paso=` | Página en modo tarea | S-12 Logro |
| `/planes/[planId]/mantener` | Página en modo tarea | S-12.P4 Mantenimiento |
| `/planes/[planId]/retomar` | Página en modo tarea | S-13 Retomar |
| `/semana` con `?semana=AAAA-MM-DD&plan=[planId]&dia=AAAA-MM-DD` | Página | S-09 Semana |
| `/semana/revision` con `?semana=AAAA-MM-DD&paso=` | Página en modo tarea | S-10 Revisión |
| `/proposito` | Página | S-14 Propósito |
| `/memoria` con `?vista=logros\|decisiones\|documentos` | Página con pestañas | S-15 Memoria |
| `/memoria/documentos/[revisionId]` | Página | S-15.V4 Documento firmado |
| `/memoria/lecturas/[sessionId]` | Página | S-15.V5 Lectura anterior |
| `/cuenta` | Página | S-16 Cuenta |

Diálogos (`MemberSheet`): pregunta puntual (S-03), excepción de una ocasión, anotar resultado, anotar evidencia, pausar, cerrar el plan, descartar un plan en preparación, cambiar de foco, conflicto de versión. Nada más se abre en diálogo.

Paneles en línea (sin cambiar de ruta): retorno en Inicio (S-01.V7), aviso de revisión en Semana, síntesis de Descubre, «Otros estados» de una ocasión.

### 2.3 Atrás, enlaces directos y recarga

[DISEÑO]

- Todo estado que la persona elige y que cambia lo que ve (ámbito, fase, plan, semana, día, paso, vista de Memoria) vive en la URL. Recargar o compartir el enlace abre lo mismo.
- Cambiar de pestaña o de paso usa `router.replace` para pestañas y `router.push` para pasos. Atrás vuelve al paso anterior dentro de un flujo de modo tarea y a la página anterior en el resto.
- Un paso al que todavía no se puede llegar (por ejemplo, `?paso=confirmar` sin datos de semana) redirige al primer paso incompleto y muestra en él el aviso «Falta completar este paso».
- Un `planId` de otra cuenta o inexistente muestra S-00 «No encontramos ese plan» con «Ir a Planes». No se distingue entre ajeno e inexistente.
- Al salir de un flujo con «Salir» se vuelve al origen guardado en `?desde=` (solo rutas internas que empiezan por `/`), y si falta, a `/panel`.
- Inicio no recuerda selección. Semana recuerda el último plan elegido en `sessionStorage` (`mk:v1:{userId}:semana:plan`) solo si la URL no trae `plan`.

### 2.4 Modo tarea

[DISEÑO] Rutas marcadas «modo tarea» en 2.2: en móvil se oculta la barra inferior, `AppTopBar` muestra a la izquierda un botón «Salir» (texto, 44 px) en lugar del logo, y el título del flujo. El pie de acciones es fijo dentro del contenido (3.3). En escritorio el sidebar sigue visible. No se usa `.dk-shell` ni el chrome del player.

### 2.5 Rutas anteriores

| Ruta anterior | Destino |
|---|---|
| `/calendario` | `/semana` (mismos parámetros si existen) |
| `/mente`, `/espiritu`, `/cuerpo`, `/ruta`, `/asesores` | `/panel` |
| `/perfil` | `/memoria?vista=documentos` |
| `/diagnostico/resultado` | `/memoria?vista=documentos` |
| `/bienvenido`, `/app` | Sin cambio ([C] ya terminan en `/panel` con T4.1) |

Las redirecciones son de servidor (`redirect()` en el `page.tsx` de cada ruta), para que no se vea un parpadeo.

### 2.6 Una acción, un recorrido

[DISEÑO] Cada acción tiene una sola ruta, sin importar desde dónde se abra:

| Acción | Ruta única | Desde |
|---|---|---|
| Diseñar un plan | `/disenar` (con `entrada` y `ambito` si el origen los conoce) | Inicio, Ámbito, Planes, Propósito |
| Seguir un plan en preparación | `/disenar/[planId]` | Inicio, Ámbito, Planes, Plan |
| Registrar una ocasión | En línea donde aparece (Inicio, Semana) con el mismo componente `OccasionRow` | Inicio, Semana |
| Revisar una semana | `/semana/revision` | Inicio, Semana, Plan |
| Cambiar el plan activo | `/planes/[id]/ajustar` | Plan, Revisión (paso 3 enlaza aquí si elige otro ajuste) |
| Pausar, cerrar, cambiar foco | Diálogo desde Plan | Plan, Planes |
| Retomar | `/planes/[id]/retomar` | Inicio (retorno), Plan, Planes |
| Registrar un logro | `/planes/[id]/logro` | Plan, Revisión |
| Responder preguntas de un ámbito | `/diagnostico?ambito=` | Ámbito, Inicio |

### 2.7 Entrada a las tres opciones

[DISEÑO] Todas pasan por S-05 `/disenar`. Inicio con cuenta nueva muestra las tres opciones directamente (S-01.V1) y cada una lleva a `/disenar?entrada=…`, que salta S-05 y crea el plan en preparación al terminar el primer paso. Desde un ámbito, `&ambito=` viaja con la elección. «No sé qué quiero cambiar» no pide ámbito: se elige al elegir una prueba (S-06.P1A).

## 3. Patrones compartidos

Todos los componentes nuevos de esta sección van en `apps/web/components/member/` (nuevo) y usan solo tokens de `apps/web/app/globals.css`. Estilos en un bloque nuevo de `globals.css` con prefijo `.mk-m-` para no colisionar con clases existentes.

### 3.1 `MemberPage` (nuevo)

Contenedor de página: `padding: 1.25rem 1rem 2rem` hasta 959 px, `2rem 2.5rem 3rem` desde 960 px. Ancho máximo 1120 px para páginas de lectura y 36rem (576 px) para pasos de modo tarea, centrado. Encabezado: eyebrow opcional (`.mk-section-eyebrow`), H1 `.mk-page-title` con `tabIndex={-1}` para recibir foco al cambiar de paso, subtítulo opcional en texto secundario de 1rem.

### 3.2 `ChoiceCard` (nuevo)

Opción de radio o casilla con título y descripción. Mínimo 56 px de alto, borde 1 px `--color-border-functional`. Elegida: borde 2 px `--color-text`, ícono `circle-check` de 20 px a la izquierda del título (sin elegir: `circle`). Etiqueta real `<label>` con `input` nativo visualmente oculto. Foco: contorno 2 px `--color-focus` con separación de 2 px.

### 3.3 `ActionFooter` (nuevo)

Pie de acciones de modo tarea y de diálogos. `position: sticky; bottom: 0` dentro del contenedor que hace scroll, fondo `--color-bg` con borde superior 1 px `--color-border-decorative`, `padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom))`. Acción principal `.mk-member-btn` con modificador nuevo `.mk-member-btn--lg` (min-height 52 px, ancho completo hasta 959 px, ancho automático de al menos 12rem desde 960 px). Secundaria a su izquierda en escritorio y encima en móvil, como `.mk-btn-ghost`. Con contenido corto el pie queda al final del viewport porque la columna es `min-height: 100%` y el pie usa `margin-top: auto`. Si la altura del viewport es menor que 480 px (teclado abierto en horizontal, zoom), el pie pasa a `position: static`. Los campos tienen `scroll-margin-bottom: 6rem` para no quedar debajo del pie.

### 3.4 `MemberSheet` (nuevo)

Diálogo modal. Hasta 767 px: hoja inferior de ancho completo, alto máximo 85dvh, scroll interno. Desde 768 px: diálogo centrado de 32rem de ancho. Fondo `--color-surface-raised`, borde 1 px `--color-border-functional`, scrim `rgba(0,0,0,0.6)`. `role="dialog"`, `aria-modal`, `aria-labelledby` al título, foco inicial en el título, foco atrapado, Escape cierra, al cerrar devuelve el foco al control que lo abrió. Con cambios sin guardar, Escape y el scrim no cierran: muestran dentro del diálogo «Tienes cambios sin guardar. Descartar cambios» y «Seguir editando». Usa `ActionFooter`.

### 3.5 Estados de una operación

| Estado | Botón principal | Resto | Anuncio |
|---|---|---|---|
| Disponible | Texto de la acción | Editable | Ninguno |
| Deshabilitado | Opacidad 0.55, y debajo del botón el motivo en texto secundario (`id` enlazado con `aria-describedby`) | Editable | Ninguno |
| Guardando | Texto «Guardando» y `aria-busy` en el formulario | Campos editables; un cambio hecho durante el guardado queda marcado como «Cambios sin guardar» | `role="status"`: «Guardando» |
| Guardado | Vuelve a su texto | Editable | `role="status"`: «Guardado» |
| Error | Vuelve a su texto | Todo lo escrito se conserva | `MemberNotice` con `role="alert"` y foco movido al aviso |
| Resultado desconocido | Vuelve a su texto | Todo se conserva | Aviso: «No sabemos si se guardó. Reintentar no lo duplica.» con «Reintentar» |

### 3.6 `MemberNotice` (nuevo, sustituye el uso de `JourneyNotice` en pantallas nuevas)

Bloque con título corto, mensaje, acciones. Variantes: error (borde izquierdo 2 px `--color-error`, ícono `circle-x`), aviso (borde `--color-border-functional`, ícono `shield-alert`), éxito (borde `--color-success`, ícono `circle-check`). El código técnico del servidor se muestra al final en texto de 12 px como «Código para soporte: STALE_PLAN», nunca como mensaje.

### 3.7 `StatusText` (nuevo)

Estado en palabras con un ícono de forma distinta por estado, para no depender del color: hecha `check`, no hecha `x`, sin marcar o sin información `circle`, vencida sin marcar `circle-dot`, excepción `flag`, próxima `calendar`. El color acompaña, nunca es la única señal.

### 3.8 Avisos de cambio de página

[DISEÑO] Tras una acción que cambia de ruta, el destino muestra arriba un `MemberNotice` de éxito que se cierra con «Cerrar» y no desaparece solo. El mensaje viaja en `sessionStorage` (`mk:v1:{userId}:flash`) y se borra al mostrarse. No hay toasts flotantes.

### 3.9 Carga, vacío y error de página

- Carga: esqueletos `.mk-skeleton` con la forma de los bloques reales; el H1 de la página aparece de inmediato con su texto fijo.
- Error de lectura de página: `MemberNotice` de error «No pudimos cargar esta página.» con «Reintentar». No se muestran ceros ni vacíos.
- Error de un bloque: el bloque muestra «No pudimos cargar esta parte.» con «Reintentar» y el resto de la página sigue.

## 4. Sistema visual

### 4.1 Tokens que se usan

| Rol | Token o valor existente |
|---|---|
| Fondo | `--color-bg` `#0a0a0a` |
| Superficie de tarjeta destacada (decisión principal, foco) | `--color-surface` `#141414` |
| Diálogos, menús | `--color-surface-raised` `#1c1c1c` |
| Texto | `--color-text` `#f5f5f5` |
| Texto secundario | `--color-text-secondary` `#b5b5b5` |
| Borde de tarjeta | `--color-border-decorative` `#2d2d2d` |
| Borde de control | `--color-border-functional` `#6b6b6b` |
| Acción | `--color-action` `#c00100`, hover `--color-action-hover` `#a50000`, texto blanco |
| Foco | `--color-focus` `#f5f5f5`, contorno 2 px, separación 2 px |
| Éxito y error | `--color-success` `#6dd58c`, `--color-error` `#ffb4ab` |
| Radio | 0 en tarjetas; 2 px en botones (valor actual de `.mk-member-btn`); 9999px solo en el punto de foco del mapa |

No se usan `--color-crimson`, `--color-gold`, glass, sombras ni la fotografía de columnas.

### 4.2 Tipografía

| Función | Fuente | Tamaño e interlineado |
|---|---|---|
| H1 de página | `--font-editorial` 600 | `clamp(1.75rem, 2.4vw, 2.75rem)`, 1.15 (`.mk-page-title`) |
| H2 de bloque | `--font-editorial` 600 | 1.35rem, 1.25 (`.mk-page-title--sm`) |
| Título de tarjeta u ocasión | `--font-editorial` 600 | 1.25rem, 1.3 (`.mk-task__title`) |
| Texto | `--font-body` 400 | 1rem, 1.5 |
| Etiqueta de campo | `--font-body` 500 | 0.875rem, 1.4 |
| Secundario | `--font-body` 400 | 0.875rem, 1.45, `--color-text-secondary` |
| Eyebrow | `--font-body` 600 | 0.75rem, mayúsculas, 0.08em (`.mk-section-eyebrow`) |
| Cifras | `font-variant-numeric: tabular-nums` | Según el contexto |

Campos y botones a 1rem para que iOS no haga zoom. Ningún texto esencial se trunca; títulos largos hacen `overflow-wrap: anywhere`.

### 4.3 Espaciado y anchos

Unidad 4 px. Entre bloques de página: 1.75rem (gap actual de `.mk-dashboard`). Dentro de una tarjeta: 0.75rem entre elementos, padding 1rem (0.85rem 1rem en filas de ocasión, valor actual de `.mk-task`). Entre campos: 1rem; etiqueta a campo: 0.35rem (`.mk-form`). Texto corrido: máximo 40rem. Formularios: máximo 36rem.

### 4.4 Botones y controles

| Variante | Clase | Uso |
|---|---|---|
| Principal | `.mk-member-btn`, `.mk-member-btn--lg` en `ActionFooter` | Una por pantalla o diálogo |
| Secundaria | `.mk-btn-ghost` | Alternativas visibles |
| Discreta | `.mk-m-link` (nuevo): texto subrayado, 44 px de alto táctil | «Ver más», «Cambiar», «Por qué» |
| Destructiva | `.mk-btn-ghost` con texto `--color-error` y confirmación en `MemberSheet` | Descartar, cerrar plan |

Desplegables: `details` con `summary` de 44 px e ícono `chevron-down` que rota 180 grados. Selección de días: casillas con forma de botón de 44 px, siete en una fila desde 390 px y en dos filas (4 y 3) a 320 px.

### 4.5 Movimiento

Duraciones de `APP_MOTION`: 120 ms para presión, 160 ms para cambio de pestaña o paso (opacidad y 4 px de desplazamiento), 200 ms para abrir `MemberSheet` (desde abajo en móvil, opacidad en escritorio). Sin animación de entrada en Inicio. Con `prefers-reduced-motion: reduce`, todo cambio es inmediato. Ningún contenido espera una animación para ser usable.

### 4.6 Accesibilidad y reflow

- Sin desplazamiento horizontal de página a 320 px ni con texto al 200 %. La tabla del mapa (S-01) existe desde 768 px; por debajo es lista.
- Pestañas con `role="tablist"`, flechas izquierda y derecha, `aria-selected`.
- Cambio de paso: foco al H1 del paso. Error de envío: foco al aviso.
- Una región `role="status"` por página para guardado y conteos actualizados. Los conteos de la semana se anuncian solo después de registrar.
- Áreas táctiles de 44 px; los siete días a 320 px conservan 44 px de alto.

## 5. Contratos de pantalla

Formato de cada contrato: **Objetivo**, **Ruta y entrada**, **Bloques en orden**, **Visible y desplegable**, **Acción principal**, **Secundarias**, **Campos**, **Datos**, **Qué se guarda y cuándo**, **Destinos**, **Estados**, **Móvil y escritorio**, **Componentes**, **Aceptación**. Los endpoints con B-xx se definen en la sección 11.

### S-01 Inicio

**Objetivo.** Saber qué intenta cambiar, qué toca ahora y qué decisión está pendiente. [PLAN sección 10]

**Ruta y entrada.** `/panel`. Destino tras registro e inicio de sesión (T4.1).

**Datos.** `GET /journey/dashboard` (B-01): `focus` con `why` (`text`, `status`: `CONFIRMED` | `PROVISIONAL` | `PROPOSED`), `decisions` ordenadas (11.1), `today` (ocasiones de hoy del foco), `week` (conteo del foco), `sinceStart`, `territories` (cuatro filas), `achievements` (las tres más recientes), `returnPanel`.

**Bloques en orden.**

1. Encabezado: eyebrow «Inicio» y H1 según variante. Si hay plan en foco activo, en mantenimiento o en pausa con título visible, debajo del H1 una línea «Para qué: [frase]» con enlace «Ver en el plan», o «Para qué: sin escribir todavía» con enlace «Escribir para qué» (S-08 bloque Para qué).
2. Decisión principal (`DecisionCard`, nuevo): fondo `--color-surface`, título de la decisión, una línea de detalle, acción principal. Siempre una sola.
3. Hoy (`TodayBlock`, nuevo): ocasiones de hoy del foco con `OccasionRow` en versión compacta. Solo si hay plan activo.
4. Semana del foco: una línea de conteo (S-09, regla de conteo) y enlace «Ver la semana».
5. Desde que empezaste: hasta dos líneas (última evidencia, último ajuste con su fecha) y enlace «Ver el plan».
6. También pendiente: hasta dos decisiones de menor prioridad como enlaces con su título. Si hay más, «Ver todo lo pendiente» despliega el resto en línea.
7. Tus ámbitos: mapa (5.1).
8. Logros: hasta tres, con su frase y fecha, y «Ver todos en Memoria».

**Variantes.** Bloques visibles y H1 por variante. «Pliegue 390» indica qué queda dentro de la primera pantalla a 390 × 844.

| ID | Situación | H1 | Decisión principal | Bloques | Pliegue 390 |
|---|---|---|---|---|---|
| V1 | Cuenta nueva, sin respuestas ni planes | «¿Por dónde quieres empezar?» | En lugar de `DecisionCard`, las tres entradas como `ChoiceCard` enlazadas: «No sé qué quiero cambiar», «Tengo una meta», «Ya tengo un plan» | 1, entradas, 7 (todas las filas en «Sin empezar»), enlace «Explorar mi propósito» | H1 y las tres entradas |
| V2 | Respuestas parciales, sin plan | «¿Por dónde quieres empezar?» | Igual que V1. Encima de las entradas, una línea: «Ya respondiste preguntas de Finanzas. Puedes usarlas en un plan.» | 1, línea, entradas, 6 (si hay propuesta pendiente), 7 | H1, línea y entradas |
| V3 | Plan en preparación, sin activo | Título del plan | «Tu plan está en preparación. Falta: [lista corta del servidor].» «Seguir diseñando» | 1, 2, 6, 7, 8 | H1 y decisión |
| V4 | Plan activo con ocasión hoy | Título del foco | Según 11.1; si la primera es registrar: «Hoy toca: [acción]» «Ver la semana» | 1, 2, 3, 4, 5, 6, 7, 8 | H1, línea de para qué, decisión y Hoy |
| V4b | Plan activo sin para qué confirmado | Título del foco | Igual que V4; línea «Para qué: sin escribir todavía» | Igual que V4 | Igual que V4 |
| V5 | Semana anterior sin revisar | Título del foco | «La semana del 5 al 11 oct está lista para revisar.» «Revisar la semana» | 1, 2, 3, 4, 5, 6, 7, 8 | H1, decisión y Hoy |
| V6 | Foco en pausa y ningún otro activo | Título del plan | «Este plan está en pausa desde el 20 sep. Lo registrado se conserva.» «Retomar» | 1, 2, 5, 6, 7, 8 | H1 y decisión |
| V7 | Retorno (11.1 prioridad 1) | «Volviste» | Panel de retorno en línea (S-13.P0) | 1, panel, 6, 7, 8 | H1 y panel |
| V8 | Meta lograda sin decidir qué sigue | Título del plan | «Lograste: [frase del logro]. ¿Qué sigue?» «Elegir qué sigue» | 1, 2, 5, 6, 7, 8 | H1 y decisión |
| V9 | Foco en mantenimiento | Título del plan | Según 11.1; sin pendientes: «En mantenimiento. Próxima revisión el 30 nov.» «Ver el plan» | 1, 2, 3 si hay ocasión, 4, 6, 7, 8 | H1 y decisión |
| V10 | Cuenta anterior con historia y plan sin ámbito | Título del plan | «Elige el ámbito de este plan para seguir.» «Elegir ámbito» (abre S-08 en el bloque de ámbito) | 1, 2, 3, 4, 6, 7, 8 y una línea «Tus documentos y respuestas anteriores están en Memoria.» | H1 y decisión |

**Distinciones de estado.** Ningún bloque usa un número cuando no lo hay.

| Caso | Texto |
|---|---|
| No iniciado | «Sin empezar» |
| Información incompleta | «Faltan datos de 2 ocasiones» |
| Sin ocasiones | «Sin ocasiones esta semana» |
| Error al consultar | «No pudimos leer esta parte.» y «Reintentar» |

**Estados.** Carga: esqueleto de la decisión principal y cuatro filas del mapa. Error total: `MemberNotice` «No pudimos cargar tu inicio.» «Reintentar». Error parcial: por bloque (3.9).

**Móvil y escritorio.** Hasta 959 px una columna en el orden de bloques. Desde 960 px: fila superior en dos columnas (izquierda 7fr: bloques 2 y 3; derecha 5fr: bloques 4, 5 y 6), mapa a ancho completo debajo, logros al final.

**Componentes.** `components/pages/InicioDashboard.tsx` (reescrito), `components/member/DecisionCard.tsx`, `TodayBlock.tsx`, `TerritoryMap.tsx`, `OccasionRow.tsx`, `ChoiceCard.tsx`.

**Aceptación.** Cada variante V1 a V10 con su dato de referencia R-xx (sección 9) muestra exactamente sus bloques; una sola acción principal; ningún «0 %» ni índice; las decisiones secundarias siguen visibles cuando gana otra; a 320 px sin scroll horizontal.

### 5.1 Mapa de ámbitos (dentro de S-01)

[DISEÑO] La relación ámbito y fases se conserva con la misma estructura de lectura en todos los anchos: nombre del ámbito, luego Descubre, Diseña y Actúa en ese orden.

| Ancho | Composición |
|---|---|
| 320 a 767 px | Lista de cuatro tarjetas. Cada tarjeta es un único enlace a `/ambito/[slug]` (sin la fase, que elige el servidor según 5.2). Dentro: fila de título con ícono de ámbito de 20 px y nombre en 1.125rem; si es el foco, la palabra «Foco» a la derecha y borde izquierdo de 2 px `--color-action`. Debajo, una lista de definiciones de tres líneas: término «Descubre», «Diseña», «Actúa» en texto secundario 0.875rem, valor en texto 0.875rem. El valor ocupa hasta dos líneas y nunca se trunca. Alto típico: 132 px. A 390 px las cuatro tarjetas ocupan unos 560 px |
| 768 a 1439 px | Tabla con encabezados de columna Ámbito, Descubre, Diseña, Actúa. Columna Ámbito de 11rem, las otras tres repartidas. La celda de ámbito es un enlace a `/ambito/[slug]`; cada celda de fase es otro enlace a `/ambito/[slug]?fase=…`. No hay enlaces anidados. Fila del foco con «Foco» bajo el nombre y borde izquierdo de 2 px |
| 1440 px | Igual que 768, con la tabla dentro de 1120 px |

Íconos de ámbito: Mentalidad `brain`, Finanzas `wallet`, Relaciones `users`, Salud física `heart-pulse`.

Valores por fase (servidor, B-01):

| Fase | Valores |
|---|---|
| Descubre | «Sin empezar», «En curso, 12 de 30», «Explorado», «No pudimos leer» |
| Diseña | «Sin plan», «En preparación», «Activo», «En pausa», «En mantenimiento», «Cerrado», «Logrado» |
| Actúa | «Sin plan», «Sin ocasiones esta semana», «2 hechas, 1 pendiente», «Semana pasada: 3 de 4» (solo cuando el porcentaje existe) |

Interacción: foco de teclado con contorno 2 px; hover en escritorio cambia el borde de la fila a `--color-border-functional`. El estado nunca se comunica solo con color.

### S-02 Ámbito

**Objetivo.** Ver y continuar el trabajo de un ámbito en sus tres fases.

**Ruta y entrada.** `/ambito/[slug]?fase=`. Sin `fase`, el servidor indica la fase por defecto (B-02): Actúa si hay plan activo o en mantenimiento; Diseña en cualquier otro caso. Descubre se abre solo si se pide.

**Bloques en orden.** Volver a Inicio (`.mk-ambit-page__back` existente, texto «Inicio»); H1 con el nombre del ámbito; pestañas Descubre, Diseña, Actúa con su valor de estado debajo de la etiqueta en 0.75rem; panel de la pestaña.

**Pestaña Descubre (S-02.V1).**
- Bloques: línea de cobertura («Respondiste 12 de 30 preguntas de Finanzas. No hace falta terminarlas para empezar un plan.»); lista de tramos del ámbito con estado (`StatusText`) y número de preguntas; síntesis si existe (S-02.V1.S); botón principal.
- Acción principal: «Seguir con las preguntas» (o «Empezar las preguntas» con 0 respondidas, o «Ver tus respuestas» si está explorado) que abre `/diagnostico?ambito=[slug]`.
- Secundaria: «Diseñar un plan en Finanzas» (`/disenar?ambito=finanzas`).
- Síntesis: título «Lo que dejaron tus respuestas». Cada línea con su procedencia desplegable «De dónde sale» (pregunta y respuesta citadas). Las líneas interpretativas llevan «Es así» y «No es así»; al elegir «No es así», la línea se tacha, queda el texto «No se usará para proponerte cambios.» y se guarda (B-14). **[BLOQUEA]** Las líneas interpretativas dependen de D-SRC y D-SYN (plan maestro sección I). Mientras tanto la síntesis muestra solo «Qué describiste» y «Qué falta aclarar», sin botones de reconocimiento.

**Pestaña Diseña (S-02.V2).** Si hay plan del ámbito en preparación: tarjeta con su título, «Falta: …» y «Seguir diseñando». Si hay plan activo, en pausa o en mantenimiento: tarjeta del plan (S-07, `PlanCard`). Si no hay: las tres entradas como `ChoiceCard` con `ambito` en la URL. Debajo, planes cerrados del ámbito como enlaces.

**Pestaña Actúa (S-02.V3).** Conteo de la semana del plan del ámbito y la lista de ocasiones de hoy con `OccasionRow`; enlace «Ver la semana completa» a `/semana?plan=[id]`. Sin plan: «Todavía no hay un plan en Finanzas.» con «Diseñar un plan».

**Estados.** Carga: esqueleto de pestañas y panel. Error: 3.9.

**Móvil y escritorio.** Pestañas a ancho completo, tres tercios. Desde 960 px el panel tiene 40rem de ancho máximo.

**Componentes.** `app/(member)/ambito/[slug]/page.tsx`, `components/member/TerritoryScreen.tsx`, `Tabs.tsx` (nuevo).

**Aceptación.** Enlace directo a cada pestaña; recarga conserva la pestaña; flechas mueven el foco entre pestañas; Descubre no se ofrece como requisito de nada.

### S-03 Pregunta puntual

**Objetivo.** Responder una pregunta que puede cambiar una propuesta. [PLAN sección 2]

**Ruta y entrada.** `MemberSheet` desde S-06.P3 o S-02. Máximo tres por propuesta, una por diálogo.

**Bloques.** Contexto «Esta respuesta puede cambiar [qué parte]». Pregunta con `QuestionCard` (mismos tipos y excepciones del player: «No lo sé», «No aplica», «Prefiero no responder»). Pie: «Guardar respuesta» y «Ahora no».

**Datos.** `GET /diagnostic/question?sourceRef=` (B-13). Guarda con `POST /diagnostic/response` [C].

**Destinos.** Guardar cierra el diálogo y recalcula la propuesta. «Ahora no» cierra sin guardar; la pregunta sigue disponible como enlace «Responder una pregunta que puede cambiar esto» en la propuesta, sin volver a abrirse sola.

**Aceptación.** La respuesta aparece en la cobertura del ámbito; el diálogo devuelve el foco al enlace que lo abrió; un 409 de revisión conserva la elección y ofrece «Reintentar» [C patrón del player].

### S-04 Preguntas del ámbito (player)

**Objetivo.** Responder el cuestionario de un ámbito en cualquier orden respecto de los otros.

**Ruta y entrada.** `/diagnostico?ambito=[slug]` y subrutas actuales con `ambito` conservado en la URL.

**Cambios respecto del player actual.** Encabezado con el nombre del ámbito sobre el título de la sección. Progreso «Pregunta 4 de 15 de Finanzas» (B-12). Guardar y salir vuelve a `/ambito/[slug]?fase=descubre`. Al terminar el conjunto del ámbito: pantalla de cierre «Terminaste las preguntas de Finanzas.» con «Ver lo que dejaron tus respuestas» (a S-02 Descubre) y «Diseñar un plan en Finanzas». El cierre de cada tramo se mantiene. Sin bienvenida general la primera vez que se entra por un ámbito; la bienvenida actual se muestra una vez por cuenta.

**Componentes.** `DiagnosticEntry.tsx`, `DiagnosticPlayer.tsx`, `ModuleOutro.tsx`, `ProgressRail.tsx`.

**Aceptación.** Las garantías del player se conservan (pruebas `journey-followup.test.tsx`, `player-rail.test.tsx`); salir y volver retoma en la pregunta siguiente del mismo ámbito.

### S-05 Elegir cómo empezar

**Objetivo.** Elegir una de las tres entradas. [PLAN sección 1]

**Ruta y entrada.** `/disenar`, con `ambito` opcional. Con `entrada` en la URL, la pantalla no se muestra y se abre S-06 en el primer paso.

**Bloques.** H1 «¿Cómo quieres empezar?». Si viene `ambito`: línea «En Finanzas» con «Quitar» (`.mk-m-link`). Tres `ChoiceCard` en radio:

| Opción | Título | Descripción |
|---|---|---|
| sin-direccion | No sé qué quiero cambiar | Empezamos por una situación concreta o una prueba pequeña. |
| meta | Tengo una meta | Te proponemos un paso que cabe en tu semana y cómo saber que lo lograste. |
| plan-propio | Ya tengo un plan | Lo ordenamos para que puedas revisarlo, sin cambiar lo que traes. |

Si existe un plan en preparación: `MemberNotice` de aviso «Tienes un plan en preparación: [título].» con «Seguir con ese».

**Acción principal.** «Empezar», deshabilitada sin elección con el motivo «Elige una opción.».

**Destinos.** `/disenar/nuevo?entrada=…&ambito=…` abre S-06.P1. El plan se crea en el servidor al terminar ese paso.

**Aceptación.** Teclado con flechas dentro del grupo de radio; enlace «Explorar mi propósito» a `/proposito` debajo de las opciones.

### S-06 Diseño del plan

[DISEÑO] Esta pantalla reemplaza las seis tarjetas con tres botones de la sección E.3 del plan maestro. Cuatro pasos, iguales en estructura para las tres entradas. La persona revisa una propuesta completa, cambia solo lo que quiere, confirma aparte cada interpretación que requiere reconocimiento y activa una vez. No hay aceptación por campo: lo que no cambia se acepta al activar, y el resumen del paso 4 dice exactamente qué se acepta.

Todos los pasos muestran arriba la lista de requisitos para activar con su estado (`ActivationChecklist`, nuevo): «Qué quieres cambiar», «Tu tiempo», «Qué proteger», «Un paso o la decisión de no programar todavía». Cada uno con `StatusText` «Listo» o «Falta». «Para qué» aparece como dato informativo: «Para qué: confirmado», «Para qué: provisional» o «Para qué: sin escribir»; nunca como «Falta». Nada se descubre en el último botón.

Ruta: `/disenar/[planId]?paso=`. Antes de crear el plan: `/disenar/nuevo?entrada=`.

#### S-06.P1 Intención

Una variante por entrada.

**P1A Sin dirección.** H1 «¿Qué te gustaría que fuera distinto?». Campo «Una situación concreta» (área de texto, opcional, hasta 400 caracteres, ayuda «Por ejemplo: llego al domingo sin haber descansado.»). Campo «¿En qué parte de tu vida se nota?» con cinco `ChoiceCard`: los cuatro ámbitos y «Todavía no lo sé» (preseleccionada). Enlace «Prefiero explorar mi propósito» a `/proposito`. Acción «Ver una prueba». Si la situación queda vacía y el ámbito en «Todavía no lo sé», P3A muestra pruebas de cada ámbito y el ámbito se fija al elegir una.

**P1B Meta.** H1 «¿Qué quieres lograr?». Campo «Tu meta» (texto, obligatorio, 3 a 280 caracteres, ayuda «Escríbela con tus palabras.»). Campo «¿Para qué te importa esto?» (opcional, hasta 280 caracteres; si el servidor propone texto, se muestra editable con procedencia desplegable «De dónde sale»). Campo «¿En qué ámbito?» con los cuatro ámbitos y «Todavía no lo sé»; si queda sin decidir, el paso 3 lo pide como requisito. Campo «¿Qué tipo de cambio es?» con cinco `ChoiceCard`: «Terminar algo» (proyecto), «Sostener algo en el tiempo» (práctica), «Probar algo» (experimento), «Depende también de otra persona» (condicionado), «Prefiero que me lo propongan» (preseleccionada). Acción «Continuar».

**P1C Plan propio.** H1 «Cuéntanos tu plan». Campo «Qué quieres lograr» (obligatorio, 3 a 280). Campo «¿En qué ámbito?» con los cuatro ámbitos (obligatorio). Lista «Lo que vas a hacer» con hasta cinco acciones; cada una con «Qué haces» (obligatorio, 3 a 180) y «Cuándo» (`DayPicker`, nuevo: siete casillas de día y la opción «Sin día fijo», que muestra «Veces por semana» de 1 a 7). Enlace «Agregar otra acción». «Quitar» por acción con confirmación en línea. Acción «Continuar».

**Qué se guarda.** Al pulsar la acción del paso: `POST /journey/plans/draft` (B-03) crea el plan en preparación con `entry`, `territory` (o nulo) e intención. La URL pasa a `/disenar/[planId]?paso=semana` con `replace`.

#### S-06.P2 Tu semana

Igual para las tres entradas.

| Campo | Control | Obligatorio | Validación y ayuda |
|---|---|---|---|
| ¿Cuántas veces por semana puedes dedicarle? | Paso a paso de 0 a 7 con botones de 44 px | Sí | Con 0: aviso en línea «Con cero veces no hay nada que programar. Puedes empezar con una preparación sin día.» |
| ¿Cuántos minutos cada vez? | Opciones 10, 15, 20, 30, 45, 60, 90 | Sí si veces es mayor que 0 | |
| ¿Qué días te sirven? | `DayPicker` | No | Ayuda «Si no eliges, te proponemos días.» |
| ¿Hay algo que necesites proteger mientras lo haces? | Dos `ChoiceCard`: «Sí» (muestra «Qué proteges», texto obligatorio, hasta 280) y «Nada en particular» | Sí | Ayuda «Por ejemplo: dormir siete horas, la cena con mi familia.» |
| ¿Algo limita lo que puedes hacer? | Tres `ChoiceCard`: «Sí» (muestra texto obligatorio), «No», «No lo sé» | Sí | Ayuda «Salud, dinero, otra persona, tu trabajo.» |

Acción «Ver la propuesta». Guarda con `PATCH /journey/plans/[id]/draft` (B-03) y abre P3.

Si la cuenta ya tiene un foco activo, aparece arriba una línea informativa: «Tu plan [título] ya usa 2 veces por semana. Lo sumamos al revisar si cabe.»

#### S-06.P3 Propuesta

Variantes: **P3A** prueba (sin dirección), **P3B** paso (meta), **P3C** orden de lo que trajiste (plan propio).

Bloques en orden:

1. Interpretaciones que requieren reconocimiento (`RecognitionBlock`, nuevo). Solo si el servidor devuelve alguna (B-04 `recognitions`). Título «Antes de seguir, ¿esto es así?». Cada una: frase («Señalaste que sueles esperar a tener todo preparado. ¿También pasa con esta meta?»), procedencia desplegable «De dónde sale», y tres `ChoiceCard`: «Sí, pasa», «No es así», «No lo sé». Elegir recalcula la propuesta (vista previa nueva) y deja la elección marcada. Sin respuesta, la propuesta se muestra sin esa interpretación y el bloque queda como requisito «Responde o elige No lo sé».
2. Resumen de la propuesta (`ProposalSummary`, nuevo): una tarjeta con cinco filas fijas, cada una con etiqueta, valor y «Cambiar».

| Fila | P3A | P3B | P3C |
|---|---|---|---|
| Qué haces | La prueba | El paso | Tus acciones, tal como las escribiste |
| Versión mínima | Sí | Sí | Propuesta por acción, marcada «Propuesto por MK» |
| Cuándo | Días y minutos | Días y minutos | Tus días; si faltan, propuestos y marcados |
| Cómo sabrás que funcionó | Pregunta de aprendizaje | Criterio de logro | Criterio propuesto y marcado |
| Cuándo lo revisamos | Fecha (horizonte) | Fecha | Fecha propuesta y marcada |
| Para qué y cómo se conecta | Pregunta vacía con ejemplo | Frase propuesta; si hay dirección, tipo de vínculo (directa, habilitadora, protectora, exploratoria) con motivo | Opcional; mismo patrón que P3B |

Debajo de la tarjeta: «Por qué te proponemos esto» desplegado por defecto, con hasta tres razones. Cada razón con su fuente en texto («Porque dijiste que tienes 2 veces de 20 minutos.» o «Porque respondiste [pregunta]: [respuesta].»). Si la propuesta no usa ninguna respuesta tuya, una línea: «Esta propuesta es general: no usa respuestas tuyas.» [PLAN corrección B]

3. Preguntas que pueden cambiar esto: hasta tres enlaces que abren S-03. Ocultas si no hay.
4. Carga: una línea «Esto suma 40 minutos por semana de los 60 que dijiste.» Si supera lo declarado: `MemberNotice` de aviso «Esto supera el tiempo que dijiste.» con «Usar la versión mínima» y «Cambiar mi tiempo» (vuelve a P2).
5. Restricciones: si una acción tiene marcas que piden aclaración, el bloque de `ContentClarification` existente, con el texto del servidor.

«Cambiar» abre la fila en edición en el mismo lugar: campo con el valor propuesto, «Listo» y «Volver a la propuesta». Al editar, la fila muestra «Cambiado por ti» y «Volver a la propuesta». En la fila de criterio, la edición ofrece además la casilla «Prefiero no fijarlo todavía», que deja el aviso «Sin criterio, el plan no podrá marcarse como logrado.» [PLAN sección 4]

Acciones del paso: principal «Revisar y activar» (deshabilitada mientras falte un requisito, con el motivo). Secundarias: «Proponer otra cosa» (pide la alternativa al servidor; si no existe, el botón no se muestra), «Guardar para después» (vuelve al origen con aviso «Guardamos tu plan en preparación.»). En el menú de la cabecera, «Descartar este plan» con confirmación.

**Qué se guarda.** Las ediciones de fila se guardan en el borrador local al escribir y en el servidor al pulsar «Revisar y activar» o «Guardar para después» (`PATCH /journey/plans/[id]/draft` con `edits`). Las respuestas de reconocimiento se guardan al elegir (B-14).

**[BLOQUEA]** P3A sin situación ni ámbito necesita una plantilla de prueba por ámbito. Hoy solo existe `X-IKIGAI` y las familias por modo. Hasta que el contenido exista (D-SRC), P3A muestra solo los ámbitos con plantilla y, para los demás, el texto «Todavía no tenemos una prueba preparada para este ámbito. Puedes escribir la tuya.» con un campo libre. Lo demás de S-06 no está bloqueado.

#### S-06.P4 Confirmar

**Bloques.**

1. H1 «Antes de activar».
2. Tres preguntas, con el valor ya escrito por la persona o propuesto, editables: «¿Por qué este paso te acerca a lo que quieres?» (prellenado enlazando paso y para qué confirmado si existe; si no, la primera razón de la propuesta; obligatorio), «¿Cabe en tu semana?» (muestra la carga; dos `ChoiceCard`: «Sí, cabe» y «No estoy seguro», la segunda muestra «Usar la versión mínima»), «Qué vas a proteger» (lo del paso 2, editable). [PLAN sección 3]
3. Tarjeta opcional «Guardar como inicio de tu dirección» si no hay dirección de trabajo y el para qué quedó confirmado (B-20). Aceptar o descartar.
4. Si ya hay un foco: «¿Este plan pasa a ser tu foco?» con tres `ChoiceCard`: «Sí, y el otro sigue activo», «Sí, y el otro queda en pausa», «No, este queda como secundario». Obligatorio.
5. Lo que va a pasar (`EffectList`, nuevo): lista exacta generada por el servidor (B-05 preview). Ejemplo: «Desde el lunes 19 oct: Revisar los gastos de la semana, martes y jueves, 20 minutos.» «Revisamos el 9 nov.» «Criterio: transferir 100.000 pesos dos meses seguidos.» «Aceptas lo que no cambiaste de la propuesta.»
6. `ActionFooter` con «Activar el plan» y «Volver a la propuesta».

**Qué se guarda.** `POST /journey/plans/[id]/activate` (B-05) con el digest de la propuesta, las ediciones, los reconocimientos, la elección de foco y las tres respuestas. En una transacción se escriben las propuestas aceptadas o editadas, la transición y el horario.

**Destinos.** Éxito: `/panel` con aviso «Plan activado. La primera ocasión es el martes 20 oct.». 422 con faltantes: vuelve al paso que corresponde con el aviso. 409: 6.3.

**Aceptación de S-06.** Datos de referencia R-03 (meta) y R-04 (plan propio) activan en cuatro pasos sin aceptar campo por campo; R-11 activa con para qué confirmado y vínculo directo; R-12 acepta la semilla de dirección; R-10 cambia el paso al reconocer la interpretación y lo devuelve al general al rechazarla; R-02 llega a una prueba sin elegir ámbito primero; con capacidad 0 se puede activar una preparación sin día; activar sin para qué deja provisional y no bloquea; ningún requisito aparece por primera vez en P4; a 320 px el pie no tapa el último campo con el teclado abierto.

### S-07 Planes

**Objetivo.** Ver todos los planes por etapa y abrir uno.

**Ruta.** `/planes`.

**Bloques en orden.** H1 «Planes». Acción principal en la cabecera: «Diseñar un plan» (`/disenar`). Secciones con H2 solo si tienen planes: «Foco», «Otros activos», «En mantenimiento», «En preparación», «En pausa». «Cerrados» en un `details` cerrado con «Ver 3 planes cerrados».

**`PlanCard` (nuevo).** Título del plan (editorial 1.25rem); ámbito con su ícono; etapa en `StatusText`; una línea de contexto según etapa: activo «Próxima ocasión: martes 20 oct», en preparación «Falta: tu tiempo», en pausa «En pausa desde el 20 sep», en mantenimiento «Próxima revisión: 30 nov», cerrado «Logrado el 14 oct» o «Cerrado el 2 oct». Toda la tarjeta es un enlace a `/planes/[id]`, salvo en preparación, que enlaza a `/disenar/[id]`.

**Vacío.** «Todavía no tienes planes.» con «Diseñar un plan».

**Datos.** `GET /journey/plans` adaptado (B-06).

**Aceptación.** Un plan aparece en una sola sección; el orden dentro de cada sección es por última actividad.

### S-08 Plan

**Objetivo.** Entender un plan y decidir sobre él.

**Ruta.** `/planes/[planId]`.

**Bloques en orden.**

1. Cabecera: eyebrow con el ámbito; H1 título; etapa en `StatusText`; si es foco, «Foco». Menú «Más acciones» (botón de 44 px, abre una lista): «Marcar como foco», «Pausar», «Cerrar el plan». Las opciones que no aplican a la etapa no se muestran.
2. Para qué: frase del plan con `StatusText` (confirmado, provisional, propuesto); procedencia desplegable «De dónde sale»; si hay dirección de cuenta, vínculo (directa, habilitadora, protectora, exploratoria o «Sin vínculo») y enlace «Ver propósito»; acción «Cambiar» abre edición como en S-06. Debajo, la meta.
3. Cómo sabrás que lo lograste: criterio, con «Confirmado» o «Provisional» en `StatusText`; si es provisional, una línea «Sin criterio confirmado, el plan no puede marcarse como logrado.» y «Proponer un criterio». Si hay criterio confirmado y el plan está activo: botón secundario «Registrar el logro».
4. Lo que haces: cada acción con qué, cuándo y versión mínima. Botón «Ajustar el plan» (S-11).
5. Revisión: «Próxima revisión: 9 nov» y la señal acordada. Si toca revisar: «Revisar la semana».
6. Evidencia: lista de lo anotado con fecha y estado; «Anotar evidencia» abre un diálogo.
7. Historia: `details` cerrado «Ver la historia del plan»: transiciones y ajustes con fecha, motivo y qué cambió.
8. Si `territory` es nulo (cuentas anteriores): bloque arriba de todo «¿En qué ámbito está este plan?» con los cuatro `ChoiceCard`; si el servidor tiene una propuesta (B-15), aparece preseleccionada con «Propuesto porque todas sus acciones son de Finanzas.». Acción «Guardar ámbito».

**Diálogos.**
- Pausar: «Pausar este plan». Texto «Desde hoy dejan de programarse sus ocasiones. Lo registrado se conserva.» Campo opcional «Motivo». Acción «Pausar el plan».
- Cerrar: «Cerrar este plan». `ChoiceCard` de motivo: «Lo logré» (lleva a S-12), «Ya no me importa», «Lo reemplacé por otro», «Otro motivo» (texto). Acción «Cerrar el plan».
- Marcar como foco: «Este plan pasa a ser tu foco.» y la opción para el foco actual «Sigue activo» o «Queda en pausa». Acción «Cambiar el foco».

**Aceptación.** Las acciones del menú dependen de la etapa (tabla C.2 del plan maestro); un plan cerrado se ve en solo lectura con su logro o motivo.

### S-09 Semana y registro

**Objetivo.** Ver lo programado y registrar lo hecho en una interacción breve. [PLAN sección 5]

**Ruta.** `/semana?semana=&plan=&dia=`. Por defecto: semana actual, foco, hoy.

**Bloques en orden.**

1. Aviso de revisión, si hay una semana terminada sin revisar del plan elegido: `MemberNotice` de aviso «La semana del 5 al 11 oct está lista para revisar.» con «Revisar la semana».
2. Cabecera: H1 con el rango («12 al 18 oct»); navegación «Anterior», «Hoy», «Siguiente» (existente); selector de plan si hay más de un plan activo o en mantenimiento (`select` con etiqueta «Plan»).
3. Conteo (`WeekCount`, nuevo) en una línea, con la regla `conteo-semanal@1`:
   - Semana en curso: «1 hecha, 0 pendientes, 3 próximas.»
   - Terminada o revisada con porcentaje: «3 de 4 hechas (75 %).»
   - Sin porcentaje: «3 hechas, 1 sin información. No mostramos porcentaje porque falta un dato.» o «1 hecha, 3 con excepción. No mostramos porcentaje cuando hay excepciones.»
   - Sin ocasiones: «Sin ocasiones esta semana.»
4. Días: `.mk-week` existente; cada día muestra debajo del número un punto de 6 px si tiene ocasiones (forma, no color) y el lector de pantalla anuncia «3 ocasiones».
5. Ocasiones del día elegido: `OccasionRow` (nuevo, a partir de `TaskRow`).
6. Semanas cerradas: `details` «Ver semanas anteriores» con rango y conteo de cada una.

**`OccasionRow`.**
- Fila: título de la acción; debajo, «Versión mínima: …» en secundario; `StatusText` del estado.
- Acción principal: «La hice» (`.mk-member-btn`, alterna con `aria-pressed`). Un toque guarda.
- Secundaria visible: «No la hice» (`.mk-btn-ghost`).
- «Más» (`details`): «Quitar la marca» (si hay marca), «No se pudo, con motivo» (diálogo de excepción, motivo obligatorio), «Anotar un resultado» (diálogo).
- Resultado anotado: debajo de la fila, separado por un borde, «Resultado: [estado]. [texto]». Nunca dentro de los botones.
- Día futuro: botones deshabilitados con «Todavía no llega este día.».
- Semana cerrada: sin botones, «Semana cerrada. Lo registrado no se cambia.».

**Diálogo de resultado.** Título «¿Qué observaste?». `ChoiceCard`: «Vi un resultado», «Todavía no se ve», «No vi el resultado esperado», «No lo sé». Campo «Qué viste» (opcional, hasta 400). Acción «Guardar».

**Separación de las tres intenciones.** [PLAN corrección D, pedido de esta tarea] Hice la acción: botones de la fila. Observé un resultado: diálogo de resultado, accesible desde «Más» y desde la revisión. Quiero ajustar el plan: no está en la semana; se hace en la revisión o en «Ajustar el plan» desde S-08.

**Qué se guarda.** Cada marca con `POST /journey/records` al tocar (B-07). El resultado al guardar el diálogo.

**Aceptación.** Registrar una ocasión es un toque y no navega; el conteo cambia y se anuncia; R-05 muestra «1 hecha, 1 pendiente, 1 próxima» un viernes con lunes hecho, jueves sin marcar y sábado futuro; la excepción muestra su motivo en la fila.

### S-10 Revisión

**Objetivo.** Reconciliar la semana, mirar resultado y horizonte, y decidir un ajuste explícito. [PLAN sección 5 «Revisión», corrección C]

**Ruta.** `/semana/revision?semana=&paso=resolver|observar|leer|resumen`. Modo tarea. Cubre todos los planes con ocasiones en esa semana.

**P1 Lo que pasó.** H1 «Semana del 5 al 11 oct». Para cada ocasión sin marcar, una fila con tres `ChoiceCard` en línea: «La hice», «No la hice», «Sin información» (preseleccionada). Las ya marcadas se listan colapsadas «4 ya registradas» con «Ver». Conteo actualizado arriba. Acción «Continuar». Guarda las marcas en el servidor al continuar, en una sola petición (B-08 `resolve`).

**P2 Lo que observaste.** Por plan, una tarjeta:
- «¿Viste esto?: [criterio o pregunta del experimento]» con `ChoiceCard` «Sí», «Todavía no», «No», «No lo sé», y «Qué viste» opcional.
- «¿Apareció algo que limite o te haga daño?» con «Sí» (texto obligatorio) y «No».
- Si el plan tiene para qué confirmado: «¿Esto sigue sirviendo a: [para qué]?» con «Sí», «No del todo», «Ya no», «No lo sé». Si el para qué es provisional: «¿Esta meta sigue importándote?» con «Sí», «Ya no», «No lo sé» y enlace «Escribir para qué».
Acción «Ver la lectura». Guarda en borrador local hasta cerrar (`purposeServed`, B-21).

**P3 Lectura.** Por plan, `ReviewReading` (nuevo): la situación en una frase del servidor (`review-reading@1`), por ejemplo «Todavía es pronto: la revisión acordada es el 9 nov. Mantenemos el plan y anotamos lo observado.»; los datos que la sostienen en un desplegable «En qué nos basamos»; la propuesta. Si la situación es `PURPOSE_DRIFT`: opciones «Reescribir el para qué», «Replantear la meta», «Abrir Propósito», «Cerrar el plan con motivo». Tres `ChoiceCard` en el resto de situaciones: «Aplicar la propuesta» (preseleccionada si existe), «Dejarlo como está», «Hacer otro cambio» (lleva a la misma edición de S-11 en línea). Enlace «La lectura no es correcta» que muestra un campo «Qué no es correcto» (se guarda como corrección y no cambia la propuesta). Acción «Ver el resumen».

**P4 Resumen.** `EffectList` con lo que cambia y desde cuándo, agrupado por plan: «Desde el lunes 12 oct: …», «Se mantiene: …», «No cambia lo ya registrado.». Campo «Nota de la semana» opcional. `ActionFooter`: «Cerrar la revisión» y «Volver».

**Qué se guarda.** P1 en servidor al continuar; P2 y P3 en borrador local; todo lo demás en `POST /journey/weeks/close` (B-08) con digest.

**Destinos.** `/panel` con aviso «Revisión cerrada. Los cambios rigen desde el lunes 12 oct.» o «Revisión cerrada. Sin cambios en tus planes.».

**Estados.** Semana futura: no se puede abrir; redirige a `/semana`. Semana ya cerrada: solo lectura del resumen guardado.

**Aceptación.** R-06 (ejecución sin resultado, horizonte cumplido) muestra la alternativa con su motivo; R-05 antes del horizonte dice «Todavía es pronto» y no propone reemplazar; la ejecución parcial con resultado propone carga menor; el resumen lista fechas efectivas exactas; cerrar dos veces no duplica (plan maestro T6.1).

### S-11 Ajustar el plan

**Objetivo.** Cambiar un plan activo fuera de la revisión, con fecha efectiva visible.

**Ruta.** `/planes/[id]/ajustar`. Modo tarea.

**Bloques.** H1 «Ajustar [título]». Por acción, `ChoiceCard`: «Mantener», «Cambiar día o frecuencia» (muestra `DayPicker` y frecuencia «Cada semana», «Cada 2 semanas», «Cada 3 semanas»), «Cambiar lo que hago» (texto), «Quitar esta acción». «Agregar una acción». Criterio y fecha de revisión con «Cambiar». `EffectList` al final con lo que cambia y desde cuándo (vista previa B-09). Acción «Aplicar cambios».

**Aceptación.** Las ocasiones pasadas no cambian; el resumen coincide con lo aplicado.

### S-12 Logro y mantenimiento

**Ruta.** `/planes/[id]/logro?paso=evidencia|cierre|sigue`, y `/planes/[id]/mantener`. Modo tarea.

**P1 Evidencia.** H1 «¿Lograste esto?». El criterio confirmado en un bloque. Campo «Qué lo muestra» (obligatorio, hasta 600) y `ChoiceCard` de tipo: «Algo que terminé», «Una decisión», «La respuesta de otra persona», «Una medida», «Otro». Casilla obligatoria «Se cumplió el criterio acordado». Acción «Registrar el logro».

**P2 Cierre del ciclo.** Campos opcionales: «Qué conseguiste», «Qué funcionó», «Qué aprendiste»; si hay para qué confirmado, «¿Qué cambió en [para qué]?». Acción «Continuar».

**P3 Qué sigue.** `ChoiceCard`: «Terminar por ahora», «Mantener lo que funcionó», «Profundizar» (abre `/disenar?entrada=meta&ambito=` con la meta vacía), «Cambiar de prioridad» (abre `/disenar`). Proyecto: «Mantener» no se ofrece si el servidor no propone mantenimiento. Acción «Confirmar».

**P4 Mantenimiento.** H1 «Qué mantener». Propuesta del servidor (B-16) en `ProposalSummary` con tres filas: «Qué haces» (dosis menor), «Cuándo», «Cuándo lo miramos de nuevo» (señal). «Cambiar» por fila. Opciones: «Mantener sin ocasiones», que deja solo el logro y lo aprendido. Acción «Guardar el mantenimiento».

**Destinos.** `/panel` con «Logro registrado.» y la variante V8 o V9.

**Aceptación.** Sin criterio confirmado, S-08 no muestra «Registrar el logro» y la ruta redirige con aviso; descartar el mínimo no crea una tarea; logro en la primera semana permitido.

### S-13 Pausa y retorno

**P0 Panel de retorno (dentro de S-01.V7).** Bloques: «Lo último que acordaste» con la meta o la frase de logro, el último ajuste con fecha y lo que había que proteger. Tres preguntas en línea con `ChoiceCard`: «¿Cambió tu tiempo?» («Sí», «No»), «¿Cambió algo que limite lo que puedes hacer?» («Sí» con texto, «No»), «¿Esta meta sigue importándote?» («Sí», «Ya no», «No lo sé»). Acción «Ver cómo retomar». Línea fija: «Las ocasiones de estas semanas no quedan como deuda.»

**S-13 Retomar.** `/planes/[id]/retomar`. Propuesta del servidor (B-17) con `ChoiceCard`: «Retomar igual», «Retomar con menos carga» (muestra la versión mínima), «Replantear el plan» (abre `/disenar/[id]` del mismo plan en P3), «Cerrar el plan». `EffectList` «Desde hoy, 16 oct: …». Acción «Retomar desde hoy».

**Aceptación.** R-08 (26 días fuera) abre V7; no aparece ninguna ocasión vencida como pendiente; el panel recupera los tres datos.

### S-14 Propósito

**Objetivo.** Orientar los planes con una dirección de cuenta; no bloquea el resto del recorrido. [PLAN sección 7]

**Ruta.** `/proposito`.

**Bloques en orden.** H1 «Propósito». Línea «Orienta tus planes. No hace falta completarlo para empezar.». Dirección: estado en `ChoiceCard` «Explorando», «Tengo una dirección provisional», «La confirmé» (valores existentes `EXPLORANDO`, `PROVISIONAL`, `CONFIRMADO_POR_USUARIO`) y «Tu propósito, con tus palabras» (área de texto, edición libre conservada). Bloque «Planes que sirven a esto»: lista de planes con vínculo (directa, habilitadora, protectora, exploratoria) y enlace al plan; planes activos sin para qué con «Escribir para qué». IKIGAI: `details` «Cruzar lo que te mueve» con `IkigaiCross` existente; cada combinación con «Probar esto en un plan» (`/disenar?entrada=sin-direccion&combinacion=[id]`). Desarrollo y sentido: enlace «Responder Desarrollo y sentido» al player con ese tramo, sin suma visible. Acción principal de la página: «Guardar».

Se quitan: ficha de alineación, `IndexSummary`, firma y contrato.

**Aceptación.** Ninguna parte bloquea otra pantalla; la edición libre no se pisa al guardar el cruce [C prueba existente].

### S-15 Memoria

**Objetivo.** Recuperar lo logrado, lo aprendido, lo decidido y los documentos anteriores sin confundirlos con recomendaciones vigentes. [PLAN sección 7, último párrafo]

**Ruta.** `/memoria?vista=`.

**Estructura.** H1 «Memoria». Tres pestañas: «Logros» (por defecto), «Aprendizajes y decisiones», «Documentos anteriores».

| Vista | Contenido | Agrupación y orden | Carga |
|---|---|---|---|
| V1 Logros | Por logro: frase, plan, ámbito, fecha, evidencia en un desplegable | Por mes, más reciente primero | 10 por página, «Ver más» (B-10 cursor) |
| V2 Aprendizajes y decisiones | Planes cerrados con lo aprendido; ajustes aplicados con fecha y motivo; reconocimientos y rechazos de interpretaciones | Por plan, y dentro por fecha descendente; filtro por ámbito con cuatro casillas; filtro opcional por para qué del plan y por dirección de cuenta | 10 por página |
| V3 Documentos anteriores | Hojas firmadas con fecha de firma; lecturas del cuestionario anteriores con fecha | Documentos primero, luego lecturas; por fecha descendente | Lista completa (pocas filas) |

Toda vista lleva arriba una línea fija: «Esto es tu historial. No son recomendaciones actuales.»

**V4 Documento firmado.** `/memoria/documentos/[revisionId]`. Banner «Documento firmado el 7 oct 2026. Se muestra como quedó al firmarlo.» y `ContractSections` en solo lectura. Si existe una revisión posterior sin firmar, enlace «Ver el borrador posterior sin firmar».

**V5 Lectura anterior.** `/memoria/lecturas/[sessionId]`. Banner «Lectura de tus respuestas del 7 oct 2026. MK ya no la usa como perfil ni como índice.» y `ExcelProfile` en solo lectura, sin Índice de alineación, profundidad ni ficha declarada. [DISEÑO] Se conserva el acceso a lo que la persona ya recibió; los índices no se muestran.

**Vacío.** V1: «Todavía no hay logros. Aparecen aquí cuando confirmas uno.». V2: «Todavía no hay decisiones registradas.». V3: no se muestra la pestaña si no hay documentos ni lecturas.

**Aceptación.** R-09 muestra su hoja firmada idéntica a la guardada; ninguna vista mezcla historial con la decisión principal de Inicio.

### S-16 Cuenta

**Cambios.** Quitar «Miembro Fundador» y mostrar «Miembro». Mantener suscripción y cierre de sesión. **[BLOQUEA]** El texto sobre la prueba gratuita depende de D-COPY y D-COBRO; mientras tanto se conserva el actual.

### S-17 Admin

`components/admin/recorrido-view.tsx` agrega la vista «Planes» en solo lectura: por plan, ámbito, etapa, foco, criterio y su estado, horizonte, transiciones con fecha, propuestas con estado y razones. Alertas sin cambios. Ningún dato de esta vista entra en pantallas de miembros.

## 6. Borradores, errores y concurrencia

### 6.1 Almacenamiento

[DISEÑO]

- Clave: `mk:v1:{userId}:{flujo}:{id}` en `localStorage`. Valor con `savedAt`, `serverVersion` (versión del plan con la que se empezó) y los campos.
- Se descarta al leerlo si tiene más de 14 días.
- Al cerrar sesión, `logout` en `components/auth-session-provider.tsx` borra todas las claves `mk:v1:{userId}:`. Al iniciar sesión, se borran las claves `mk:v1:` de otros `userId`.
- El servidor es la única fuente entre dispositivos. El borrador local solo recupera en el mismo navegador.

### 6.2 Qué se recupera por flujo

| Flujo | Recargar | Atrás | Cerrar y reabrir pestaña | Volver a iniciar sesión | Otro dispositivo |
|---|---|---|---|---|---|
| S-06 antes de crear el plan (P1) | Sí, local | Sí | Sí, local | No (se borra al salir) | No |
| S-06 con plan creado | Sí: servidor más ediciones locales | Sí | Sí | Lo guardado en el servidor | Lo guardado en el servidor, en el último paso guardado |
| S-03 pregunta puntual | Respuesta guardada sí; sin guardar no | | | | Guardada sí |
| S-09 marcas | Servidor | | | | Sí |
| S-09 diálogos de resultado y excepción | Local mientras el diálogo está abierto | | Sí, se ofrece al reabrir el diálogo | No | No |
| S-10 P1 | Servidor | | | | Sí |
| S-10 P2 a P4 | Local | Sí | Sí | No | No: se vuelve a P2 |
| S-11, S-12, S-13 | Local hasta aplicar | Sí | Sí | No | No |
| S-14 | Servidor al guardar; texto sin guardar en local | Sí | Sí | No | Guardado sí |

Al recuperar un borrador local, la pantalla muestra «Recuperamos lo que estabas escribiendo en este dispositivo.» con «Descartar».

Salir con cambios sin guardar: no hay diálogo de confirmación al navegar dentro de la app, porque el borrador local ya existe. Al cerrar la pestaña con una escritura en curso, `beforeunload` pide confirmación.

### 6.3 Escrituras

Cada intención de escribir genera una `commandKey` en el cliente (UUID) que se guarda con el borrador y se reutiliza en los reintentos. Respuesta perdida: reintentar con la misma clave devuelve el resultado ya guardado (el servidor responde `repeated: true`).

| Operación | Mientras guarda | Controles disponibles | Fallo | Reintento | Versión desactualizada |
|---|---|---|---|---|---|
| Crear y guardar borrador de plan (B-03) | Botón «Guardando» | Campos editables | Conserva todo, aviso | «Reintentar» con la misma clave | 6.4 |
| Reconocer interpretación (B-14) | La opción elegida muestra «Guardando» | Resto de la propuesta | Desmarca y avisa «No se guardó tu respuesta» | Elegir otra vez | No aplica |
| Activar (B-05) | Pie «Activando» | Ninguno del paso | Conserva todo | Misma clave | `STALE_PREVIEW`: la propuesta nueva aparece en P3 con tus ediciones conservadas y las filas cambiadas marcadas «Cambió»; `STALE_PLAN`: 6.4 |
| Marcar ocasión (B-07) | El botón muestra «Guardando» y queda deshabilitado; los otros días y filas siguen | Otras filas | La fila vuelve al estado anterior y muestra «No se guardó. Reintentar» | En la fila | El servidor devuelve el registro actual; si coincide con lo pedido, se trata como guardado; si no, la fila muestra el estado del servidor y «Se actualizó desde otro lugar» |
| Resultado, excepción, evidencia | Pie «Guardando» | Campos | Conserva el diálogo abierto | Misma clave | Igual que marcar |
| Resolver semana (B-08) | Pie «Guardando» | Ninguno del paso | Conserva elecciones | Misma clave | Las ocasiones que cambiaron muestran el estado del servidor y la marca «Cambió» |
| Cerrar revisión (B-08) | Pie «Cerrando» | Ninguno | Conserva todo | Mismo digest | `STALE_REVIEW`: aviso «Esta semana se cerró desde otro lugar.» y se muestra el resumen guardado |
| Transiciones y foco | Pie del diálogo «Guardando» | Ninguno | Diálogo abierto con aviso | Misma clave | 6.4 |

### 6.4 Conflicto de versión del plan

[DISEÑO] El servidor responde 409 `STALE_PLAN` con el plan actual y su versión (B-11). El cliente compara campo por campo contra la versión con la que empezó (`serverVersion` del borrador):

- Campo cambiado solo en el servidor: se toma el del servidor.
- Campo cambiado solo aquí: se conserva lo tuyo.
- Campo cambiado en los dos lados: diálogo de conflicto «Este plan cambió en otro lugar». Por cada campo: etiqueta, «Lo que escribiste aquí» y «Lo que quedó guardado», en dos `ChoiceCard` (preseleccionada la tuya). Acción «Guardar con estas elecciones»; secundaria «Descartar lo mío».

Después se reintenta con la versión nueva y una clave nueva.

## 7. Copy de referencia

Texto final propuesto para la app. Requiere la revisión de Rafa antes de beta (D-COPY), sin bloquear la implementación. Sin guiones en copy.

### 7.1 Navegación y títulos

Inicio, Semana, Planes, Propósito, Memoria, Cuenta, Más, Salir. Fases: Descubre, Diseña, Actúa. Ámbitos: Mentalidad, Finanzas, Relaciones, Salud física.

### 7.2 Botones

| Contexto | Texto |
|---|---|
| Entradas | Empezar |
| Diseño P1 | Ver una prueba, Continuar |
| Diseño P2 | Ver la propuesta |
| Diseño P3 | Revisar y activar, Proponer otra cosa, Guardar para después, Cambiar, Listo, Volver a la propuesta, Descartar este plan |
| Diseño P4 | Activar el plan, Volver a la propuesta |
| Ocasión | La hice, No la hice, Quitar la marca, No se pudo, con motivo, Anotar un resultado |
| Revisión | Continuar, Ver la lectura, Ver el resumen, Cerrar la revisión, Volver |
| Plan | Ajustar el plan, Registrar el logro, Anotar evidencia, Proponer un criterio, Más acciones, Marcar como foco, Pausar, Cerrar el plan, Guardar ámbito |
| Logro | Registrar el logro, Continuar, Confirmar, Guardar el mantenimiento |
| Para qué | ¿Para qué te importa esto?, Escribir para qué, Guardar como inicio de tu dirección, Cambiar |
| Retorno | Ver cómo retomar, Retomar desde hoy |
| Errores | Reintentar, Ir a Inicio, Ir a Planes |

### 7.3 Vacíos

| Lugar | Texto |
|---|---|
| Planes | Todavía no tienes planes. |
| Semana sin plan | Esta semana no tiene ocasiones. Diseña un plan para empezar. |
| Semana sin ocasiones | Sin ocasiones esta semana. |
| Día sin ocasiones | Este día no tiene ocasiones. |
| Ámbito sin plan, Actúa | Todavía no hay un plan en Finanzas. |
| Memoria, logros | Todavía no hay logros. Aparecen aquí cuando confirmas uno. |
| Memoria, decisiones | Todavía no hay decisiones registradas. |

### 7.4 Errores por código del servidor

| Código | Mensaje en pantalla |
|---|---|
| `ACTIVATION_INCOMPLETE` | Falta completar algo para activar. Te llevamos al paso. |
| `STALE_PLAN` | Este plan cambió en otro lugar. Elige qué conservar. |
| `STALE_PREVIEW` | La propuesta cambió con tus datos más recientes. Tus cambios se conservaron. |
| `STALE_REVIEW` | Esta semana se cerró desde otro lugar. |
| `NOT_AN_OCCASION` | Ese día no tiene esta acción programada. |
| `OCCASION_FUTURE` | Todavía no llega este día. |
| `OCCASION_DONE` | Esa ocasión ya está marcada como hecha. |
| `CRITERION_NOT_CONFIRMED` | Para registrar un logro, primero confirma cómo sabrás que lo lograste. |
| `RESTRICTED` | El mensaje del servidor y «Puedes:» con sus alternativas [C] |
| `CLARIFICATION_REQUIRED` | El mensaje del servidor con las opciones de aclaración [C] |
| Red o 5xx | No pudimos guardar. Lo que escribiste sigue aquí. |
| Respuesta perdida | No sabemos si se guardó. Reintentar no lo duplica. |

### 7.5 Confirmaciones

Plan activado. La primera ocasión es el [día]. Guardamos tu plan en preparación. Para qué: sin escribir todavía (solo en Inicio cuando aplica). Revisión cerrada. Los cambios rigen desde el [fecha]. Revisión cerrada. Sin cambios en tus planes. Logro registrado. Plan en pausa desde hoy. Lo registrado se conserva. Plan retomado desde hoy. Foco cambiado.

## 8. Vinculación de estados con datos de referencia

Cada variante de pantalla tiene al menos un dato de referencia (sección 9). Las pruebas de componentes y la revisión visual usan los mismos datos.

| Pantalla y variante | Datos |
|---|---|
| S-01.V1 | R-01 |
| S-01.V2 | R-02 antes de elegir prueba |
| S-01.V3 | R-03 en preparación |
| S-01.V4 | R-04 activo (viernes con «Trotar 20 minutos» hoy) |
| S-01.V5 | R-05 |
| S-01.V6 | R-08 pausado antes del retorno |
| S-01.V7 | R-08 |
| S-01.V8 y V9 | R-07 |
| S-01.V10 | R-09 |
| S-06.P1A a P4 | R-02 |
| S-06.P1B a P4 | R-03 (propuesta general), R-10 (propuesta personalizada y rechazo de la interpretación) |
| S-06.P1C a P4 | R-04 |
| S-09 | R-05 |
| S-10 | R-05 (antes del horizonte), R-06 (en el horizonte sin efecto) |
| S-12 | R-07 |
| S-13 | R-08 |
| S-15 | R-07 y R-09 |

## 9. Datos de referencia

Ficticios. No son testimonios ni evidencia de eficacia. Fecha de referencia: viernes 16 oct 2026, zona America/Santiago. Correos `@fixtures.mk.invalid`.

| ID | Cuenta | Contenido |
|---|---|---|
| R-01 | `vacia@fixtures.mk.invalid` | Sin respuestas, sin planes |
| R-02 | `sin-direccion@fixtures.mk.invalid` | 8 respuestas de Mentalidad. Situación «Llego al domingo sin haber descansado y no sé por dónde empezar.» Ámbito «Todavía no lo sé». Elige la prueba de Mentalidad «Durante una semana, anota al final de dos días qué te dejó con energía y qué no». Mínimo «Una línea por día». Pregunta «¿Aparece algo que se repita?». Martes y jueves, 10 minutos. Revisión 30 oct |
| R-03 | `meta@fixtures.mk.invalid` | 15 de 15 respuestas de Finanzas. Ninguna regla existente usa esas respuestas para cambiar la propuesta, así que P3 muestra «Esta propuesta es general: no usa respuestas tuyas.» Meta «Ahorrar 100.000 pesos al mes». Tipo «Sostener algo en el tiempo». 2 veces por semana, 20 minutos, martes y jueves. Proteger «La cena con mi familia». Limitación «No». Paso «Revisar los gastos de la semana y anotar tres que podrías recortar». Mínimo «Revisar solo los del fin de semana». Criterio «Transferir 100.000 pesos a la cuenta de ahorro dos meses seguidos». Revisión 9 nov. Activado el lunes 12 oct |
| R-04 | `plan-propio@fixtures.mk.invalid` | Salud física, sin respuestas. Meta «Correr 5 kilómetros sin parar». Acciones «Trotar 20 minutos» lunes, miércoles y viernes; «Estirar 10 minutos» sin día fijo, 2 por semana. Marca esfuerzo físico, salud desconocida: aclaración «No limita lo que voy a hacer». MK propone criterio «Correr 5 kilómetros seguidos una vez», mínimo «Caminar 15 minutos» y revisión 6 nov. Estado activo: activado el lunes 12 oct, lunes y miércoles hechas, viernes 16 (hoy) sin marcar |
| R-05 | `semana@fixtures.mk.invalid` | Plan de R-03 con una segunda acción «Revisar la cuenta», lunes y sábado, 10 minutos. Semana 12 a 18 oct: lunes 12 «Revisar la cuenta» hecha; martes 13 «Revisar los gastos» hecha; jueves 15 «Revisar los gastos» sin marcar; sábado 17 «Revisar la cuenta» próxima. Hoy viernes: «2 hechas, 1 pendiente, 1 próxima». Semana 5 a 11 oct terminada sin revisar, con 2 hechas y 1 sin información |
| R-06 | `sin-efecto@fixtures.mk.invalid` | Finanzas. Activado 21 sep, revisión 12 oct. 6 de 6 hechas en tres semanas. Evidencia «No vi el resultado esperado: no pude transferir». Lectura «Hubo ejecución suficiente y el resultado no se movió». Alternativa propuesta «Programar la transferencia el día de pago» |
| R-07 | `logro@fixtures.mk.invalid` | Proyecto Mentalidad «Terminar la guía de bienvenida» logrado el 14 oct con evidencia «La guía quedó publicada y Marta la usó sola», cerrado. Práctica Relaciones «Llamar a mi madre los domingos» en mantenimiento desde 4 oct, cada 2 semanas, revisión 30 nov |
| R-08 | `retorno@fixtures.mk.invalid` | Salud física «Caminar 30 minutos» pausado el 20 sep. Último ajuste 13 sep «Pasó de 4 a 3 veces». Proteger «No caminar con dolor de rodilla». Último registro 19 sep |
| R-10 | `personalizada@fixtures.mk.invalid` | Mentalidad. R26 (planificación) con valor bajo. Meta «Terminar una primera versión de mi guía». Tipo «Terminar algo». P3 muestra el reconocimiento del candidato de `SOURCE_INVENTORY` R26; con «Sí, pasa», el paso cambia a la variante `PLANIFICACION_POR_ACLARAR` de `MEN-EST` («Protege las ocasiones que declaraste y empieza por una parte revisable…») y la razón cita R26; con «No es así», vuelve al paso general y la razón desaparece |
| R-09 | `historial@fixtures.mk.invalid` | Cuestionario completo en `formulario-completo@4` cerrado el 7 oct, hoja firmada el 7 oct, plan ACTIVE «Un ensayo usable» con acciones de dominio MENTE y `territory` MENTALIDAD en todas, sin ámbito de plan, semana cerrada 5 oct, semana abierta actual |
| R-11 | `meta-proposito@fixtures.mk.invalid` | Como R-03 con dirección confirmada «Tener margen para elegir sin miedo» y para qué del plan confirmado «Para dejar de vivir al día», vínculo directo |
| R-12 | `semilla@fixtures.mk.invalid` | Meta Finanzas sin dirección previa; para qué confirmado «Para dormir sin pensar en la cuenta»; tras activar acepta semilla `EXPLORANDO` |
| R-13 | `revision-deriva@fixtures.mk.invalid` | Plan activo con para qué confirmado; en revisión responde «No del todo» al para qué y «Sí» a la meta; lectura `PURPOSE_DRIFT` |

Ubicación: `apps/web/test/fixtures/journey-states.ts` (nuevo), con un objeto por ID con las respuestas exactas de `GET /journey/dashboard`, `GET /journey/territories/:t`, `GET /journey/plans`, `GET /journey/calendar` adaptado, vistas previas y memoria. La misma información, construida por la API, va en `apps/api/test/fixtures/ui-states.ts` (nuevo) para las pruebas HTTP, de modo que las formas coinciden.

## 10. Verificación

### 10.1 Revisión visual temprana

[DISEÑO] Antes de extender los patrones al resto de pantallas, se construyen y revisan cuatro pantallas con datos de referencia y API simulada:

1. S-01.V1 y S-01.V4.
2. S-06 en sus cuatro pasos con R-03.
3. S-09 con R-05.
4. S-10 con R-06.

Herramienta: `e2e/ui-states.spec.ts` (nuevo). Intercepta `/api/v1/auth/*` y `/api/v1/journey/*` con `page.route` y devuelve los datos de `journey-states.ts`. No usa base de datos ni recorre el cuestionario. Toma capturas a 320, 375 × 667, 390 × 844, 768 y 1440 × 900 en `tmp/ui-states/` y revisa: sin scroll horizontal; pie de acciones sin tapar el último campo con el teclado simulado (viewport de 375 × 400); texto al 200 % (zoom de CSS) sin cortes; foco visible al tabular; movimiento reducido.

Condición de salida: capturas revisadas y registradas en `MK_IMPLEMENTATION_PROGRESS.md`. Si algo falla, se corrige el patrón compartido (sección 3) y se repite antes de seguir.

### 10.2 Comprobaciones por pantalla

| Comprobación | Herramienta |
|---|---|
| Contenido y acción principal por variante | Componentes (`apps/web/test/*.test.tsx`) con datos de referencia |
| Teclado: orden de tabulación, pestañas con flechas, Escape en diálogos, foco devuelto | Componentes y `ui-states.spec.ts` |
| Anuncios: `role="status"` y `role="alert"` | Componentes |
| Texto largo: título de 180 caracteres, meta de 280, motivo de 400 | `ui-states.spec.ts` con un dato de referencia extendido |
| 320 px y 200 % | `ui-states.spec.ts` |
| Calidad visual | Capturas revisadas por una persona; las pruebas no lo demuestran |

## 11. Cambios de backend que pide la experiencia

Complementan C.9 del plan maestro. El frontend no calcula ninguno de estos datos.

| ID | Cambio | Pantallas | Tarea |
|---|---|---|---|
| B-01 | `GET /journey/dashboard` devuelve `decisions` ordenadas con `kind`, `priority`, `title`, `detail`, `href`, `planId`; `today`; `week` con el texto ya formado por la regla de conteo además de los números; `territories` con los valores de 5.1; `achievements`; `returnPanel` | S-01 | T3.8 |
| B-02 | `GET /journey/territories/:t` devuelve `defaultPhase`, tramos del ámbito con estado y número de preguntas, síntesis con procedencia | S-02 | T3.8, T5.3 |
| B-03 | `POST /journey/plans/draft` y `PATCH /journey/plans/:id/draft` con `expectedVersion`, `commandKey`, intención, semana y `edits` por fila | S-06 | T3.4 |
| B-04 | La vista previa por `planId` devuelve `parts` (seis filas incluida «Para qué y cómo se conecta»), `purpose` (`text`, `status`, `linkKind`, `linkReason`, `refs`), `reasons` con fuente, `recognitions` separadas, `questions` (hasta tres `sourceRef`), `load`, `requirements` con estado y `personalized` | S-06.P3 | T3.4, T3.5, B-19 |
| B-19 | Propuesta de para qué y vínculo en la vista previa (B-04), con procedencia; nunca fuentes `NOT_CONNECTED` | S-06.P1, P3 | T1.7, T3.4 |
| B-20 | `POST /journey/purpose/seed/preview` y `POST /journey/purpose/seed` con `commandKey`; solo sin dirección de trabajo y para qué confirmado | S-06.P4 | T3.9 |
| B-21 | `POST /journey/weeks/close` recibe `purposeServed` por plan (`YES`, `PARTLY`, `NO`, `UNKNOWN`) | S-10.P2, P3 | T6.1 |
| B-05 | `POST /journey/plans/:id/activate/preview` devuelve el `EffectList`; `POST /journey/plans/:id/activate` recibe digest, `edits`, reconocimientos, elección de foco y las tres respuestas, y escribe propuestas, transición y horario en una transacción. Reemplaza, para el diseño inicial, la decisión por parte | S-06.P4 | T3.3, T3.4 |
| B-06 | `GET /journey/plans` devuelve etapa, foco, ámbito, línea de contexto y última actividad | S-07 | T3.3 |
| B-07 | `POST /journey/records` con `commandKey`; el 409 devuelve el registro actual | S-09 | T3.7 |
| B-08 | `POST /journey/weeks/:weekStart/resolve` resuelve en lote; `POST /journey/weeks/preview` devuelve efectos estructurados (`planId`, `actionId`, `before`, `after`, `effectiveFrom`, `text`); `close` recibe evidencia, ajustes y corrección de lectura | S-10 | T6.1 |
| B-09 | `POST /journey/plans/:id/adjust/preview` y `apply` con la misma estructura de efectos | S-11 | T3.7 |
| B-10 | `GET /journey/memory?view=&cursor=&territory=`; `GET /journey/memory/documents/:revisionId` con el `contractView` congelado; `GET /journey/memory/readings/:sessionId` sin índice, profundidad ni ficha | S-15 | T7.1 |
| B-11 | Todo 409 de plan devuelve el plan actual y su versión | S-06, S-08, S-11 | T3.3 |
| B-12 | `GET /diagnostic/state?ambito=` devuelve progreso del ámbito y el cierre del ámbito | S-04 | T5.1 |
| B-13 | `GET /diagnostic/question?sourceRef=` devuelve la pregunta, sus excepciones y la frase «Esta respuesta puede cambiar…» | S-03 | T5.2 |
| B-14 | `POST /journey/interpretations` guarda «Sí, pasa», «No es así» o «No lo sé» como `MemberClarification` `INTERPRETATION` | S-02, S-06 | T3.5 |
| B-15 | Propuesta `TERRITORY` para planes sin ámbito, con su motivo | S-08 | T7.2 |
| B-16 | `POST /journey/plans/:id/maintenance/preview` y `apply` | S-12.P4 | T6.3 |
| B-17 | `POST /journey/plans/:id/resume/preview` y `apply` | S-13 | T6.4 |
| B-18 | El servidor mapea `goalClass` y ámbito a `goalKind` del motor existente (tabla 11.2) | S-06 | T3.4 |

### 11.1 Prioridad de `decisions`

[DISEÑO] El servidor ordena. La primera es la decisión principal de S-01. Las siguientes dos van a «También pendiente». Las ocasiones de hoy no compiten: siempre se muestran en el bloque Hoy con registro en línea, así que una revisión pendiente puede ganar sin esconder la ocasión.

| Prioridad | `kind` | Condición | Título | Acción |
|---|---|---|---|---|
| 1 | `RETURN` | 14 días o más sin registro con ocasiones programadas en ese período | Volviste | Panel en línea |
| 2 | `REVIEW_DUE` | Semana terminada sin revisar con ocasiones de un plan activo, o `reviewAt` alcanzado | La semana del [rango] está lista para revisar | Revisar la semana |
| 3 | `PROPOSAL_PENDING` con `INCOMPATIBILITY` | Restricción nueva sobre un plan activo | Hay algo que revisar antes de seguir | Ver qué cambia |
| 4 | `OCCASION_TODAY` | Ocasión de hoy sin marcar | Hoy toca: [acción] | Ver la semana |
| 5 | `OVERDUE_UNMARKED` | Ocasiones vencidas sin marcar en la semana actual | Tienes [n] ocasiones sin marcar | Marcar lo pendiente |
| 6 | `ACHIEVEMENT_NEXT` | Logro registrado sin elegir qué sigue | Lograste: [frase]. ¿Qué sigue? | Elegir qué sigue |
| 7 | `PROPOSAL_PENDING` | Otra propuesta persistida pendiente | MK te propone un cambio en [plan] | Ver la propuesta |
| 8 | `PLAN_PREPARING` | Plan en preparación | Tu plan está en preparación | Seguir diseñando |
| 9 | `TERRITORY_MISSING` | Plan activo sin ámbito | Elige el ámbito de este plan | Elegir ámbito |
| 10 | `PURPOSE_MISSING` | Plan activo con para qué provisional, pasó su primera revisión, sin otra decisión de mayor prioridad | Escribir para qué de [plan] | Escribir para qué |
| 11 | `PLAN_PAUSED` | Foco en pausa y ningún otro activo | Este plan está en pausa | Retomar |
| 12 | `NEXT_OCCASION` | Hay plan activo y nada más pendiente | Próxima ocasión: [día] | Ver la semana |
| 13 | `CHOOSE_START` | Sin planes | ¿Por dónde quieres empezar? | Las tres entradas |

Desempate dentro de la misma prioridad: el foco antes que los secundarios; luego la fecha más antigua.

### 11.2 Tipo de cambio a tipo de meta del motor

[DISEÑO, revisable por Rafa] La persona elige un tipo de cambio en palabras; el servidor lo traduce al `goalKind` de `accompaniment/vocab.ts`. Tabla en `apps/api/src/journey/accompaniment/goal-class.ts` (nuevo).

| Tipo de cambio | Mentalidad | Finanzas | Relaciones | Salud física |
|---|---|---|---|---|
| Terminar algo | ENTREGAR | ORDENAR | VINCULAR | CUIDAR |
| Sostener algo | SOSTENER | ORDENAR | VINCULAR | CUIDAR |
| Probar algo | CONSTRUIR_O_PROBAR | CONSTRUIR_O_PROBAR | CONSTRUIR_O_PROBAR | CONSTRUIR_O_PROBAR |
| Depende de otra persona | VINCULAR | VINCULAR | VINCULAR | VINCULAR |
| Que me lo propongan | Según `declarationToGoal` del texto; si no reconoce, ENTREGAR en Mentalidad, ORDENAR en Finanzas, VINCULAR en Relaciones, CUIDAR en Salud física | | | |

## 12. Tareas del plan maestro y esta especificación

| Tarea | Pantallas | Componentes | API | Se cierra cuando |
|---|---|---|---|---|
| T4.0 Patrones (nueva) | Sección 3 | `components/member/*`: `MemberPage`, `ChoiceCard`, `ActionFooter`, `MemberSheet`, `MemberNotice`, `StatusText`, `Tabs`, `DayPicker`, `EffectList`; bloque `.mk-m-` en `globals.css` | Ninguna | Pruebas de componentes de teclado, foco y anuncios; capturas de los patrones en una página de prueba de `ui-states.spec.ts` |
| T4.1 | Destino | `lib/auth-redirect.ts` | `/auth/me` | Prueba existente actualizada |
| T4.2 | S-01, 5.1 | `InicioDashboard.tsx`, `DecisionCard`, `TodayBlock`, `TerritoryMap`; `DESIGN.md` | B-01 | V1 a V10 con datos; revisión visual 10.1 |
| T4.3 | S-02, S-05, S-06 | `TerritoryScreen`, `DesignFlow` (nuevo, `components/member/design/*`: `IntentStep`, `WeekStep`, `ProposalStep`, `ConfirmStep`, `ProposalSummary`, `RecognitionBlock`, `ActivationChecklist`) | B-02 a B-05, B-14, B-18 | R-02, R-03, R-04 de punta a punta con API simulada; revisión visual 10.1 |
| T4.4 | S-07, S-08, S-11 | `PlanCard`, `PlanScreen`, `AdjustScreen` | B-06, B-09, B-11, B-15 | Menú por etapa; conflicto 6.4 probado |
| T4.5 | S-09 | `WeekScreen` (a partir de `CalendarScreen`), `OccasionRow` (a partir de `TaskRow`), `WeekCount` | B-07 | R-05; revisión visual 10.1 |
| T4.6 | Navegación 2.1 a 2.5 | `MemberSideNav`, `BottomTabBar`, `AppTopBar`, `AppShell` | Ninguna | Ninguna ruta anterior da 404; modo tarea |
| T4.7 | Pruebas de navegador | `e2e/ui-states.spec.ts` (nuevo), reescritura de `dashboard-ambitos.spec.ts` | Simulada | Capturas registradas |
| T5.1 | S-04 | Player | B-12 | Garantías del player intactas |
| T5.2 | S-03 | `QuestionSheet` (nuevo) con `QuestionCard` | B-13 | Respuesta cuenta en cobertura |
| T5.3 | S-02 síntesis | `DiscoverSynthesis` (nuevo) | B-02, B-14 | Parte no interpretativa; interpretativa bloqueada |
| T6.1 | S-10 | `ReviewFlow` (nuevo), `ReviewReading` | B-08 | R-05 y R-06; revisión visual 10.1 |
| T6.2, T6.3 | S-12 | `AchievementFlow`, `MaintenanceStep` | B-16 | R-07 |
| T6.4 | S-13, S-01.V7 | `ReturnPanel`, `ResumeScreen` | B-17 | R-08 |
| T7.1 | S-15 | `MemoryScreen`, vistas V4 y V5 | B-10 | R-09 |
| T7.2 | S-08 bloque de ámbito | `PlanScreen` | B-15 | R-09 |
| T8.2 | S-17 | `recorrido-view.tsx` | Admin existente ampliado | Solo lectura |
| T4.6 (además de la navegación) | S-14, S-16 | `PurposeScreen` adaptado, `CuentaContent.tsx` | Existentes | Propósito sin ficha ni firma; Cuenta con la etiqueta Miembro |

## 13. Pendientes que bloquean

| Pendiente | Parte bloqueada | Puede avanzar |
|---|---|---|
| D-SRC y D-SYN (plan maestro I) | Líneas interpretativas de la síntesis (S-02); reconocimientos con reglas nuevas (S-06.P3, más allá de R26 y las barreras existentes); pruebas por ámbito sin texto (S-06.P3A) | Todo el resto de S-02 y S-06 con las reglas y familias existentes |
| D-EXEC | Valor por defecto del horizonte que muestra «Cuándo lo revisamos» | Se muestra el valor provisional del servidor, editable |
| D-COPY | Publicar el copy de la sección 7 en beta; texto de prueba en Cuenta | Implementar con ese copy |
| D-COBRO | Cuenta: estado de suscripción y vencimiento | Todo lo demás |

No quedan pendientes de navegación, composición, acción principal ni interacción.

## 14. Comprobación

- Cada pantalla pedida tiene contrato: Inicio (S-01), ámbito y fases (S-02), Descubre y síntesis (S-02.V1, S-03, S-04), entrada sin dirección (S-05, S-06.P1A), diseño guiado (S-06), plan propio (S-06.P1C, P3C), lista y detalle (S-07, S-08), semana (S-09), revisión (S-10), logro y mantenimiento (S-12), pausa y retorno (S-08 diálogo, S-13), Propósito (S-14), Memoria (S-15), Cuenta y admin (S-16, S-17).
- Cada acción tiene una sola ruta (2.6).
- Cada escritura tiene estado, fallo, reintento y conflicto (6.3).
- Ningún dato que la pantalla necesita se calcula en el cliente sin endpoint (11).
- Las decisiones de diseño están marcadas y no se presentan como aprobadas por Rafa.
