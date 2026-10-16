# Maximus Kratos: contrato de diseño del producto web

## Alcance y autoridad

Este contrato define identidad, jerarquía, navegación, estados y validación de UI/UX. Aplica a marketing, sesiones de producto, miembros y admin con las diferencias indicadas aquí.

Orden para resolver conflictos:

1. Instrucción actual del usuario y contratos funcionales vigentes.
2. Referencia visual aprobada para la superficie y este contrato.
3. Tokens y componentes compartidos que implementan el contrato.
4. CSS y componentes heredados, como evidencia de la implementación actual.

Cuando la implementación no cumpla el contrato, corregirla en el componente compartido. Actualizar documentación y referencias en el mismo cambio. Un screenshot nuevo no se convierte automáticamente en referencia aprobada.

El CSS no decide metodología, permisos, cálculos ni persistencia. Una regla visual tampoco puede eliminar una capacidad del producto.

## Identidad

MK combina fondo negro, blanco legible, rojo contenido, geometría fina y recursos clásicos usados con intención. En Inicio de miembros, la referencia es la escena integrada de estatua, geometría y tres métricas. En las páginas operativas, la identidad debe ayudar a leer y actuar.

Las capturas originales de Inicio, diagnóstico y Ruta son referencias visuales. Están en el repositorio como material de revisión, no como imágenes aplanadas de la interfaz. Los números que contienen son ejemplos.

Usar el componente `Logo` y los assets originales. Conservar proporciones. No reemplazar el escudo por texto MK ni por un icono genérico.

## Superficies

| Superficie | Shell | Navegación | Densidad y movimiento |
| --- | --- | --- | --- |
| Marketing público | `PublicLayout` en `apps/web/app/(public)/layout.tsx` | `PublicNav` y `PublicFooter` | Lectura editorial. Motion de landing solo aquí. |
| Player IKIGAI y otras sesiones inmersivas | `IkigaiShell` (`apps/web/components/ikigai/shell.tsx`), scope `.ik-app` | Logo, salida, progreso y acciones de sesión | Una tarea principal. Transiciones breves. Sin nav ni footer de marketing dentro de la sesión. |
| App de miembros | `AppShell` (`apps/web/components/app-shell/AppShell.tsx`), clase `.mk-app-shell` | Sidebar en escritorio. En móvil, barra inferior y panel Más | Orientación, datos y acciones. Motion funcional. |
| Diagnóstico en sesión | `.dk-shell` en `apps/web/app/diagnostico/layout.tsx` | Salida y progreso del recorrido | Una tarea principal. No es marketing aunque la URL no esté bajo `(member)`. |
| Admin y Lab | `AdminShell` (`apps/web/components/admin-shell.tsx`) | Navegación administrativa | Densidad de trabajo. Sin escenografía de landing. |

Una URL pública no implica que la pantalla sea marketing. Clasificar por la tarea del usuario. Cada superficie tiene un único shell compartido. Corregirlo cuando falle en vez de copiarlo.

No añadir IntroGate, scroll cinematográfico o footer comercial a sesiones y páginas operativas por una regla general de marca.

## Tokens

Una sola fuente de tokens: `apps/web/app/globals.css`, bloque `@theme`. El player puede ajustar alcance en `apps/web/app/ikigai/ikigai.css`, usando los mismos roles. No añadir una paleta local por módulo.

| Rol semántico | Token | Valor | Uso |
| --- | --- | --- | --- |
| Fondo | `--color-bg` | `#0a0a0a` | Fondo principal. `--color-obsidian` apunta al mismo valor. |
| Superficie | `--color-surface` | `#141414` | Agrupaciones que necesitan separarse del fondo. |
| Superficie elevada | `--color-surface-raised` | `#1c1c1c` | Menús, diálogos y paneles. |
| Texto principal | `--color-text` | `#f5f5f5` | Títulos y texto principal. |
| Texto secundario | `--color-text-secondary` | `#b5b5b5` | Contexto y metadatos. `--color-text-muted` usa este rol. |
| Borde decorativo | `--color-border-decorative` | `#2d2d2d` | Separaciones y tarjetas. No identifica un control por sí solo. |
| Borde funcional | `--color-border-functional` | `#6b6b6b` | Límite de controles. Verificar contraste real. |
| Acción principal | `--color-action` | `#c00100` | Botón primario con texto blanco. Alias: `--color-action-red`. |
| Acción hover | `--color-action-hover` | `#a50000` | Hover del primario. |
| Foco | `--color-focus` | `#f5f5f5` | Contorno visible, separado del componente. |

`--color-crimson` (`#ff0000`) queda como alias de marketing mientras sus consumidores no migren. No es el botón del player ni el de miembros. Blanco sobre `#ff0000` no cumple contraste de texto normal.

Estas propuestas se validan en contexto. Un borde decorativo tenue no puede ser el único modo de identificar un input. Un rojo adecuado como fondo con texto blanco puede fallar como texto pequeño sobre negro.

Estados de éxito, advertencia y error usan `--color-success`, `--color-error` y texto o icono. No convertir cada estado en una variante de rojo ni comunicar significado solo por color.

## Tipografía por función

| Rol | Fuente y criterio | Uso |
| --- | --- | --- |
| Marca y display de marketing | Bitte BC. No es una serif. El archivo activo es `apps/web/public/fonts/bitte-bc.woff`, declarado en `apps/web/app/brand-fonts.css`. Si no carga, el fallback es Barlow Condensed 600, 700 y 800 (`--font-bitte-fallback` en `apps/web/app/layout.tsx`). | Identidad de marca y piezas donde esta fuente pertenece a la referencia de marketing. |
| Editorial de miembros | Noto Serif, ya en el repo (OFL), token `--font-editorial`. No hay un archivo serif de BrandCrowd. Georgia es el fallback. `--font-greek` apunta a este mismo rol. | Títulos principales de Inicio, Ruta y perfil, encabezados del diagnóstico y métricas destacadas. |
| Interfaz y cuerpo | Hanken Grotesk, `apps/web/app/fonts/hanken-grotesk-latin.woff2`, token `--font-body`. | Navegación, formularios, botones, estados, tablas y texto corrido. |
| Microtexto | La fuente de interfaz, 12 px. | Etiquetas cortas, sin tracking excesivo. |

Definir un rol editorial compartido, no una fuente nueva por página. El alias Bitte no certifica que el recurso original de BrandCrowd esté disponible y no significa serif. Bauhaus BC (`apps/web/public/fonts/bauhaus-bc.woff`) sigue reservada a la línea de marca «Alíneate».

Base móvil: cuerpo 16 px con line-height cercano a 1.5. Secundarios 14 px. Microetiquetas 12 px solo para información no principal. Controles de texto a 16 px. Títulos de página 28 a 34 px. En escritorio los títulos pueden crecer a 40 a 48 px según composición. Estos rangos se ajustan a la fuente cargada. No son una obligación para cada H1.

Mayúsculas y tracking solo en eyebrows breves y marca. Navegación, instrucciones y estados usan escritura normal. No abreviar contenido para ocultar un problema de layout. No truncar títulos esenciales sin una vía para leerlos.

## Mobile first

Diseñar e implementar primero el flujo a 390 px. El CSS base debe resolver la pantalla pequeña y sus estados. Añadir columnas, sidebar y composición de escritorio mediante mejoras a anchos mayores.

Revisar 320 px para reflow, 375 × 667 para un teléfono de poca altura, 390 × 844 para el caso principal, 768 px para transición y 1440 × 900 para escritorio. La selección final de breakpoints depende del contenido.

En móvil:

- Una columna principal y orden de lectura coherente con el DOM.
- Gutter base de 16 px, ajustable hasta 20 px si el contenido lo permite. El selector de siete días puede usar menos gutter para caber.
- Controles frecuentes con área táctil de al menos 44 × 44 px. Primarios del player conservan min-height de 52 px.
- Barra inferior con safe area. El contenido scrollea encima de esa barra, sin un segundo hueco del mismo alto.
- Acciones sticky que no tapen el contenido, el foco o los campos al abrir el teclado.
- Navegación secundaria en el panel Más. En escritorio esas rutas están en el sidebar. Ninguna ruta desaparece por estar en móvil.
- Sin interacción que dependa exclusivamente de hover, drag o swipe.
- Texto largo, teclado, errores y datos ausentes deben funcionar en el layout base.

No ocultar overflow para disimular un componente que excede el viewport. Las tablas o diagramas que necesiten desplazamiento propio tienen un contenedor explícito. La página permanece legible.

No aplicar `height: 100vh` al contenido de páginas para acomodar una escena. El shell de miembros usa `100dvh` para mantener la barra. El contenido crece y scrollea dentro de `.mk-app-content`.

En escritorio, el área operativa de miembros puede alcanzar unos 1120 px. La lectura continua de marketing usa la medida que ya tiene esa superficie. No imponer una columna de 650 u 800 px a todas las páginas.

## Inicio de miembros

Objetivo: entender el estado personal y encontrar la siguiente acción.

La escena central integra estatua, círculo, cuadrado, triángulo y líneas en un sistema de coordenadas (`viewBox` 0 0 100 100). Los tres indicadores se mantienen dentro del encuadre en escritorio. En móvil, si el texto superpuesto no se lee, los tres valores y nombres pasan debajo de la escena y las líneas de anclaje no apuntan al vacío. La estatua es `apps/web/public/images/landing/statue-standing.png` (RGBA, sin caja opaca). `statue-aligned.jpg` y `statue-clean.jpg` son bustos, no esta figura.

La referencia de composición es `apps/web/public/images/landing/dashboard-alineacion-desktop.png`. Los porcentajes de esa imagen son ejemplos. No pintarlos.

La acción depende del estado real de `GET /journey/state`: empezar, continuar, revisar resultado o seguir la ruta. No inventar progreso, histórico ni recomendaciones.

No convertir null en 0 o 100. Mientras la API no entrega un índice de Mente, Espíritu o Cuerpo: «Por completar» si el paso siguiente es el diagnóstico, «No disponible» si ya no lo es, «Cargando» y «Error» en esos estados. La placa y los tres círculos usan la misma lectura. No mostrar el porcentaje de tareas de la semana como índice de alineación.

## Calendario y tareas

Objetivo: elegir un día, entender sus tareas, cambiar un estado y revisar la semana.

El selector semanal usa siete celdas de ancho equivalente (`grid-template-columns: repeat(7, minmax(0, 1fr))`). Seleccionar cambia color, no dimensiones. En 320 px se reducen gap y padding del bloque. El texto ampliado puede requerir otra presentación accesible sin perder los siete días.

Las fechas son civiles (`YYYY-MM-DD` de la API). Se formatean en UTC para que la zona del navegador no las corra un día. La zona del producto que devuelve la API se muestra en la pantalla. En copy, rangos como 28 sep a 4 oct.

Una tarea muestra título, pilar si aporta contexto, estado y acción principal. Las alternativas viven en «Otros estados». Conservar Pendiente, Hecho, Omitido y No aplica. El estado seleccionado se lee en texto, no solo por color.

Notas, historial y edición tienen una vía clara. La revisión semanal queda aparte de cada fila. Conservar las decisiones y endpoints existentes.

El fondo operativo es `#0a0a0a`. Sin la fotografía de columnas en el shell de miembros.

Agregar tarea usa un botón proporcionado. El estado vacío puede darle mayor protagonismo.

## Componentes y UX

Corregir o extender los componentes compartidos antes de crear copias. Se permiten componentes nuevos para capacidades o patrones que no existen. Deben usar tokens y documentar su alcance. Reutilizar no obliga a mantener defectos.

Cada pantalla identifica su tarea, su acción principal y sus destinos. Los botones tienen variantes claras: principal (`.mk-member-btn` o `.ik-app .ag-btn-primary`), secundaria, discreta y destructiva. No dar el mismo peso a cuatro acciones distintas.

Estados mínimos de operaciones asíncronas: disponible, en curso, completada y error. Los formularios conservan lo escrito al fallar. Los controles deshabilitados explican el motivo. Tras cerrar un diálogo, devolver foco al control que lo abrió. Guardar y salir conserva su garantía de persistencia.

Las métricas y estados informativos no se estilizan como botones. Los elementos interactivos deben parecer interactivos. No usar texto técnico de enums, IDs o timestamps como explicación al usuario.

Mantener copy de producto en español natural. Aplicar el léxico vigente. La restricción de guiones en copy sigue vigente. No aplica a IDs, nombres de clases ni código.

## Motion

Marketing puede usar `PublicMotionProvider`, `ScrollReveal` y los patrones de `apps/web/components/motion/` donde pertenezcan a esa superficie.

Miembros, player y admin usan motion funcional breve, normalmente 150 a 220 ms. El contenido útil no espera un intro ni un reveal al hacer scroll. No ocultar formularios mientras una animación termina. Con `prefers-reduced-motion`, la información y las acciones siguen disponibles de inmediato.

No añadir librerías de animación duplicadas. No introducir 3D para resolver una composición estática.

## Accesibilidad

Comprobar contraste sobre fondos reales: texto normal al menos 4.5:1, texto grande al menos 3:1. Revisar límites e indicadores de controles. La política de áreas táctiles de MK es 44 px, aunque el mínimo AA de WCAG 2.2 tiene otros tamaños y excepciones. En 320 px, siete días equivalentes no llegan a 44 px de ancho. Se usa todo el ancho del bloque y se mantiene el alto mínimo.

Usar semántica nativa, nombres accesibles, foco visible y mensajes asociados a sus campos. No anunciar cada cambio decorativo mediante aria-live. Loading, errores y cambios relevantes se anuncian con moderación.

Revisar texto al 200% y reflow a 320 CSS px. No declarar accesibilidad completa por pasar una sola prueba automática.

## Criterio de terminado

Una pantalla se considera terminada cuando:

1. Se recorrió en navegador a los tamaños indicados, con sus estados reales.
2. No tiene acciones ocultas por barras, recortes esenciales ni overflow inesperado.
3. El contenido móvil tiene jerarquía y permite completar la tarea.
4. Cumple la referencia de su superficie en composición, tipografía y densidad.
5. Sus interacciones, errores y persistencia funcionan.
6. Las comprobaciones técnicas afectadas pasan o las limitaciones previas están identificadas.
7. Hay capturas revisadas y registro de evidencia.

Build y tests funcionales no certifican calidad visual. Los snapshots ayudan a detectar regresiones respecto de una referencia revisada. No determinan por sí solos si el diseño es bueno.

## Inventario comprobado en esta base

Rutas de miembros en `apps/web/app/(member)/`: panel, ruta, perfil, cuenta, calendario, planes, proposito, asesores, mente, espiritu, cuerpo, diagnostico/resultado. El player del diagnóstico vive en `apps/web/app/diagnostico/`, fuera de ese grupo.

Referencias de revisión, no de producción: `apps/web/public/images/landing/dashboard-alineacion-desktop.png`, `dashboard-diagnostico-desktop.png`, `dashboard-ruta-desktop.png`, `dashboard-panel-desktop.png`, `dashboard-proposito-desktop.png`.

El export antiguo con `name: Aethelgard High-Performance System` y `primary: #ffb4a8` está en `docs/design-history/DESIGN-aethelgard.md`. No es el contrato activo.
