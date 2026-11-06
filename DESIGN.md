# Maximus Kratos: contrato de diseño del producto web

## Alcance y autoridad

Este contrato define identidad, jerarquía, navegación, estados y validación de UI/UX. Aplica a marketing, sesiones de producto, miembros y admin con las diferencias indicadas aquí.

Orden para resolver conflictos:

1. Instrucción actual del usuario y contratos funcionales vigentes.
2. Referencia visual aprobada para la superficie y este contrato.
3. Tokens y componentes compartidos que implementan el contrato.
4. CSS y componentes heredados, como evidencia de la implementación actual.

Cuando la implementación no cumpla el contrato, corregirla en el componente compartido y en los consumidores afectados. Un arreglo visual local no obliga a actualizar documentación. Si cambia este contrato, actualizarlo en el mismo cambio. Un screenshot nuevo no se convierte automáticamente en referencia aprobada.

El CSS no decide metodología, permisos, cálculos ni persistencia. Una regla visual tampoco puede eliminar una capacidad del producto.

## Identidad

MK combina fondo negro, blanco legible, rojo contenido, geometría fina y recursos clásicos usados con intención. En las páginas operativas, la identidad debe ayudar a leer y actuar. El inicio de miembros no tiene como contrato la escena de estatua ni tres métricas de pilar.

Las capturas antiguas de Inicio, diagnóstico y Ruta están en el repositorio como material de revisión, no como la interfaz vigente. Los números que contienen son ejemplos. No reponen el inicio de miembros.

Usar el componente `Logo` y los assets originales. Conservar proporciones. No reemplazar el escudo por texto MK ni por un icono genérico.

## Superficies

| Superficie | Shell | Navegación | Densidad y movimiento |
| --- | --- | --- | --- |
| Marketing público | `PublicLayout` en `apps/web/app/(public)/layout.tsx` | `PublicNav` y `PublicFooter` | Lectura editorial. Motion de landing solo aquí. |
| IKIGAI independiente | `IkigaiShell` (`apps/web/components/ikigai/shell.tsx`), scope `.ik-app` | Logo, salida, progreso y acciones de sesión | Una tarea principal. Transiciones breves. Sin nav ni footer de marketing dentro de la sesión. |
| App de miembros | `AppShell` (`apps/web/components/app-shell/AppShell.tsx`), clase `.mk-app-shell` | Sidebar en escritorio. En móvil, barra inferior y panel Más | Orientación, datos y acciones. Motion funcional. |
| Cuestionario | `.dk-shell` en `apps/web/app/diagnostico/layout.tsx`, escenario `PlayerStage` | Salida y progreso del cuestionario | Una tarea principal. No es la sesión IKIGAI ni marketing, aunque la URL no esté bajo `(member)`. |
| Admin y Lab | `AdminShell` (`apps/web/components/admin-shell.tsx`) | Navegación administrativa | Densidad de trabajo. Sin escenografía de landing. |

Una URL pública no implica que la pantalla sea marketing. Clasificar por la tarea del usuario. Cada superficie tiene un único shell compartido. Corregirlo cuando falle en vez de copiarlo.

No añadir IntroGate, scroll cinematográfico o footer comercial a sesiones y páginas operativas por una regla general de marca.

## Tokens

Una sola fuente de tokens: `apps/web/app/globals.css`, bloque `@theme`. Cuestionario e IKIGAI pueden ajustar alcance en `apps/web/app/ikigai/ikigai.css`, usando los mismos roles. No añadir una paleta local por módulo.

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

`--color-crimson` (`#ff0000`) queda como alias de marketing mientras sus consumidores no migren. No es el botón del cuestionario, de IKIGAI ni de miembros. Blanco sobre `#ff0000` no cumple contraste de texto normal.

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
- Controles frecuentes con área táctil de al menos 44 × 44 px. El primario del cuestionario y el de IKIGAI conservan min-height de 52 px.
- Barra inferior con safe area. El contenido scrollea encima de esa barra, sin un segundo hueco del mismo alto.
- Acciones sticky que no tapen el contenido, el foco o los campos al abrir el teclado.
- Navegación secundaria en el panel Más. En escritorio esas rutas están en el sidebar. Ninguna ruta desaparece por estar en móvil.
- Sin interacción que dependa exclusivamente de hover, drag o swipe.
- Texto largo, teclado, errores y datos ausentes deben funcionar en el layout base.

No ocultar overflow para disimular un componente que excede el viewport. Las tablas o diagramas que necesiten desplazamiento propio tienen un contenedor explícito. La página permanece legible.

No aplicar `height: 100vh` al contenido de páginas para acomodar una escena. El shell de miembros usa `100dvh` para mantener la barra. El contenido crece y scrollea dentro de `.mk-app-content`.

En escritorio, el área operativa de miembros puede alcanzar unos 1120 px. La lectura continua de marketing usa la medida que ya tiene esa superficie. No imponer una columna de 650 u 800 px a todas las páginas.

## Inicio de miembros

Objetivo: ver el estado del recorrido y la siguiente acción.

Quien puede usar el producto ve primero una tarjeta de siguiente paso y después el cruce. Filas: Mentalidad, Finanzas, Relaciones y Salud física. Columnas: Descubre, Diseña y Actúa. No hace falta cerrar los cuatro ámbitos ni el cuestionario para tener un plan. El cruce no es un índice y no diagnostica.

En móvil, la matriz se desplaza en horizontal dentro de su propio contenedor. Los nombres de los ámbitos permanecen visibles. La cabecera y las filas se desplazan juntas. En escritorio se muestra el cruce completo cuando hay espacio. La página conserva su scroll vertical. No sustituyas el cruce por tarjetas independientes ni por acordeones.

El cumplimiento que ya aparece en Actúa es ejecución de la semana. No lo conviertas en otra fase ni en un índice. No vuelvas a una escena de estatua, a Mente, Espíritu y Cuerpo, ni a un índice de alineación.

La acción de la tarjeta sale del estado real del recorrido. No inventes progreso ni recomendaciones. No pintes los porcentajes de las referencias viejas.

La navegación de escritorio es Inicio, Semana, Diseñar, Planes, Propósito, Memoria y Cuenta. En móvil, la barra inferior es Inicio, Semana y Planes. Diseñar, Propósito, Memoria y Cuenta están en Más. Ninguna de esas rutas desaparece en móvil.

## Semana

Objetivo de `/semana`: elegir un día, entender sus acciones, cambiar un estado y revisar la semana. No es el inicio.

El selector semanal usa siete celdas de ancho equivalente (`grid-template-columns: repeat(7, minmax(0, 1fr))`). Seleccionar cambia color, no dimensiones. En 320 px se reducen gap y padding del bloque. El texto ampliado puede requerir otra presentación accesible sin perder los siete días.

Las fechas son civiles (`YYYY-MM-DD` de la API). Se formatean en UTC para que la zona del navegador no las corra un día. La zona del producto que devuelve la API se muestra en la pantalla. En copy, rangos como 28 sep a 4 oct.

Una acción muestra título, ámbito si aporta contexto, estado y acción principal. Las alternativas viven en «Otros estados». Conservar Pendiente, Hecho, Omitido y No aplica. El estado seleccionado se lee en texto, no solo por color.

Notas, historial y edición tienen una vía clara. La revisión semanal queda aparte de cada fila. Conservar las decisiones y endpoints existentes.

El fondo operativo es `#0a0a0a`. Sin la fotografía de columnas en el shell de miembros.

Agregar tarea usa un botón proporcionado. El estado vacío puede darle mayor protagonismo.

## Componentes y UX

Corregir o extender los componentes compartidos antes de crear copias. Se permiten componentes nuevos para capacidades o patrones que no existen. Deben usar tokens y documentar su alcance. Reutilizar no obliga a mantener defectos.

Cada pantalla identifica su tarea, su acción principal y sus destinos. Los botones tienen variantes claras: principal (`.mk-member-btn`, `.dk-shell .ag-btn-cta` o `.ik-app .ag-btn-primary`), secundaria, discreta y destructiva. No dar el mismo peso a cuatro acciones distintas.

Estados mínimos de operaciones asíncronas: disponible, en curso, completada y error. Los formularios conservan lo escrito al fallar. Los controles deshabilitados explican el motivo. Tras cerrar un diálogo, devolver foco al control que lo abrió. Guardar y salir conserva su garantía de persistencia.

Las métricas y estados informativos no se estilizan como botones. Los elementos interactivos deben parecer interactivos. No usar texto técnico de enums, IDs o timestamps como explicación al usuario.

Mantener copy de producto en español natural. La puntuación y el léxico siguen `.cursor/rules/voz-y-copy.mdc`. Las preguntas del cuestionario no se tratan como copy de interfaz.

## Motion

Marketing puede usar `PublicMotionProvider`, `ScrollReveal` y los patrones de `apps/web/components/motion/` donde pertenezcan a esa superficie.

Miembros, cuestionario, IKIGAI y admin usan motion funcional breve, normalmente 150 a 220 ms. El contenido útil no espera un intro ni un reveal al hacer scroll. No ocultar formularios mientras una animación termina. Con `prefers-reduced-motion`, la información y las acciones siguen disponibles de inmediato.

No añadir librerías de animación duplicadas. No introducir 3D para resolver una composición estática.

## Accesibilidad

Comprobar contraste sobre fondos reales: texto normal al menos 4.5:1, texto grande al menos 3:1. Revisar límites e indicadores de controles. La política de áreas táctiles de MK es 44 px, aunque el mínimo AA de WCAG 2.2 tiene otros tamaños y excepciones. En 320 px, siete días equivalentes no llegan a 44 px de ancho. Se usa todo el ancho del bloque y se mantiene el alto mínimo.

Usar semántica nativa, nombres accesibles, foco visible y mensajes asociados a sus campos. No anunciar cada cambio decorativo mediante aria-live. Loading, errores y cambios relevantes se anuncian con moderación.

Revisar texto al 200% y reflow a 320 CSS px. No declarar accesibilidad completa por pasar una sola prueba automática.

## Criterio de terminado

Una pantalla tocada queda lista cuando el recorrido afectado se puede completar, sin acciones tapadas ni overflow inesperado, y la composición sigue esta referencia. La verificación concreta está en `AGENTS.md`: móvil primero, tamaños según el componente, más cobertura si cambia el shell. Tests de componente no cierran la verificación visual.

## Inventario de rutas

Marketing: `apps/web/app/(public)/`.

Miembros: `apps/web/app/(member)/`, con panel, semana, semana/revision, disenar, planes, proposito, memoria, cuenta y ambito. El inicio de quien usa el producto es `StartDashboard`, montado desde `InicioDashboard`. `PerfilContent`, `RutaContent` y `AmbitStage` no son esa pantalla.

Cuestionario: `apps/web/app/diagnostico/`, shell `.dk-shell`.

IKIGAI independiente: `apps/web/app/ikigai/`. La página pública está en `(public)/ikigai`.

Admin: `apps/web/app/admin/`, incluido Lab.

Las imágenes `apps/web/public/images/landing/dashboard-*.png` son material de revisión. No reponen la escena de estatua ni un índice en el inicio vigente.

El export antiguo con `name: Aethelgard High-Performance System` y `primary: #ffb4a8` está en `docs/design-history/DESIGN-aethelgard.md`. Las reglas de `docs/design-history/rules/` no se cargan. No son el contrato activo.
