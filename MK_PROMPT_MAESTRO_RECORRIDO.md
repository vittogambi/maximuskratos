# Prompt maestro: recorrido completo de la web de revisión

Este archivo es la especificación de ejecución. No es una auditoría ni un sustituto del producto. Quien lo implemente trabaja sobre el checkout real, encima de la Entrega 0, hasta que una cuenta de revisión pueda recorrer el producto de punta a punta con la interfaz de las referencias.

Fecha de esta especificación: 30 sep 2026. Base comprobada: rama `pilot/ikigai-lista`, commit `108f572`, con la Entrega 0 sin commitear. Registro: `MK_IMPLEMENTATION_PROGRESS.md`.

## 0. Cómo ejecutar

No reabrir plataforma, auth ni acceso anticipado. No pedir confirmación para decisiones técnicas que este documento ya cierra. Sí detenerse, y dejarlo escrito en el registro, cuando una regla del Excel cambie un resultado y este documento la marque como pendiente. En ese caso se guarda la respuesta, se muestra el estado pendiente y se sigue con el resto del recorrido.

Orden obligatorio. Cada bloque termina con su comprobación antes de pasar al siguiente. Un checkpoint en `MK_IMPLEMENTATION_PROGRESS.md` no cierra el encargo.

1. Historial y versión de catálogo.
2. Definición extraída del Excel, con reglas inequívocas y lista de las que no lo son.
3. Shell de miembro, escritorio y teléfono.
4. Player de fichas sobre `nextStep`.
5. Resultados y Perfil Maestro.
6. Hoja de Ruta de Propósito.
7. Planes y acciones.
8. Calendario y registros.
9. Revisión semanal, ajuste y semana siguiente.
10. Inicio conectado al estado real, más la verificación integral.

Fuera de este encargo: app Expo, tiendas, cobros, deploy, merge, commit, datos de producción, y cualquier cambio al módulo IKIGAI público.

## 1. Lo que ya existe y no se rehace

Comprobado en el checkout, no solo en el registro:

- `MEMBER_PREVIEW_USER_IDS` solo en el servidor. `resolveMemberAccess` y `DiagnosticOpenGuard` usan el `sub` del JWT. `/auth/me` devuelve `access`.
- Web: cookie `mk_refresh`, sin refresh en JSON. Nativo: `X-MK-Client` `ios` o `android`, refresh en el cuerpo, rotación en una transacción, `POST /auth/logout-all`. Los access JWT ya emitidos siguen vivos hasta 15 minutos.
- Guardar y salir persiste la selección válida. Si falla, no navega. Continuar deshabilitado explica el motivo.
- Cierre de módulo en una transacción. `buildState` no finaliza si queda un módulo bloqueado. La creación concurrente del perfil tolera `P2002`.
- El diagnóstico no usa el límite de 30 por minuto. Sigue el de 100 por ruta e IP.
- Tests: `apps/api/test/member-access.test.ts`, `auth-session-contract.test.ts`, `diagnostic-member-preview.test.ts`, `apps/web/test/member-access.test.ts`, `e2e/member-preview.spec.ts`.

Esas pruebas tienen que seguir pasando. Una cuenta normal sigue en el panel de fundador. Rafa no recibe rol ADMIN ni un cambio de suscripción.

## 2. Decisiones de arquitectura que quedan cerradas

### 2.1 Dos catálogos, ninguna mutación del primero

`DiagnosticVersion` `1.0` es el prototipo FASE1. En la base local tiene 24 preguntas. El JSON tiene 25. La que falta en la base, módulo `habitos-acciones`, es: "¿Con qué frecuencia utilizo comida, alcohol, sexo, compras, pantallas o entretenimiento para evitar emociones, conversaciones o responsabilidades?".

Causa: `ensureDiagnosticCatalog` en `packages/database/src/bootstrap-diagnostic.ts` no inserta preguntas nuevas si la versión ya tiene módulos. Solo reescribe textos cuando ya hay sesiones. Efecto: quien respondió `1.0` fue puntuado sin ese ítem. No se agrega la pregunta a `1.0`. No se vuelven a puntuar esas sesiones.

El Excel entra como una versión nueva, por ejemplo `formularios-x-paso`, con `definitionRef`, `definitionSha256` y el payload congelado. Una sesión guarda `versionId` y no cambia de definición. El hash identifica el archivo. El versionado es la fila de `DiagnosticVersion`: si el contenido cambia, se crea otra versión. No se edita la anterior.

La fuente es el archivo local `260529-FORMULARIOS-X-PASO.xlsx` (o la copia que ya esté en el repo si es el mismo libro). El xlsx no se commitea si contiene datos de un cliente. Se commitea el JSON curado, con hoja y celda de cada ítem, y el sha256 del archivo de origen en el registro.

### 2.2 Historial de sesión y de perfil, juntos

Hoy impiden historial, las tres a la vez:

- `User.diagnosticSession` es opcional 1:1.
- `DiagnosticSession.userId` es `@unique`.
- `MasterProfile.userId` es `@unique` y `MasterProfile.sessionId` es `@unique`.

Quitar solo el unique de la sesión no alcanza: el perfil tampoco puede haber más de uno por cuenta.

Migración aditiva, compatible con las filas actuales:

- `DiagnosticSession.status`: `ACTIVE`, `COMPLETED`, `ABANDONED`. Las filas existentes con `completedAt` pasan a `COMPLETED`. Las demás, a `ACTIVE`.
- Se quita el unique de `userId`. Índice único parcial: una sola `ACTIVE` por cuenta.
- `MasterProfile` pierde el unique de `userId` y conserva el de `sessionId`. Se agrega `isCurrent`. La fila existente de cada cuenta queda `isCurrent = true`. Índice único parcial: un solo perfil vigente por cuenta.
- Lectura del vigente: `isCurrent`. Lectura de uno anterior: por `sessionId`, sin volver a correr el motor.
- Reiniciar: la sesión activa pasa a `ABANDONED` o se deja `COMPLETED` si ya terminó. Se crea otra `ACTIVE` con la versión de catálogo vigente en ese momento. El perfil anterior permanece y deja de ser `isCurrent` solo cuando el nuevo se confirma. Hasta entonces el vigente sigue siendo el último confirmado.
- `onboardingStep` no es el historial. Puede seguir como atajo de navegación, pero la verdad es la sesión y el perfil.

Conservar las protecciones de la Entrega 0: upsert de respuesta, transacción del cierre de módulo, 409 si el estado está a medias, tolerancia a `P2002` al crear el perfil.

### 2.3 Dónde vive cada cosa

| Concepto | Dónde | Qué no es |
|---|---|---|
| Fichas del Excel | `DiagnosticVersion` nueva, módulos = secciones, `nextStep` en Nest | El array `FUTURE_AUDITORIAS` de `RutaContent.tsx` |
| Puntaje, alertas, bandas | Motor en servidor, solo con reglas de este documento | Promedios de `mk-system.ts` ni `scoreDeltas` de FASE1 |
| Perfil vigente | `MasterProfile` de la sesión confirmada, más resultados por ficha | Un JSON calculado en el cliente |
| Hoja de Ruta | Revisión propia, confirmada e inmutable | `DirectionVersion` del Lab, que cuelga de `LabCase` |
| Plan personal | Modelos nuevos de cuenta | `Plan` de Prisma, que es precio comercial |
| Calendario | Acciones del plan con fecha, en el servidor | Google Calendar y el cronograma de 12 meses de la HdRP v1 |
| IKIGAI público | `IkigaiSession` con token, sin tocar | La sección E-PER-008 del Excel |

Nest conserva la lógica. La web solo renderiza. No hay Server Actions para puntaje, plan ni semana.

### 2.4 Identidad visual, sin inventar otra

Tokens que ya pinta el sitio: fondo `#0a0a0a`, acción `#c00100` y `#8b0000` en el player, texto claro, Bitte para títulos (`--font-display`), Hanken para cuerpo. `DESIGN.md` no manda si discrepa del CSS.

Recursos que sí existen y se usan:

- Stills de producto: `apps/web/public/images/landing/dashboard-alineacion-desktop.png`, `dashboard-diagnostico-desktop.png`, `dashboard-ruta-desktop.png`, `dashboard-panel-desktop.png`, `dashboard-proposito-desktop.png`. `DeviceShowcase` solo los muestra como fotos.
- Estatuas recortables: `apps/web/public/images/landing/statue-aligned.jpg`, `statue-clean.jpg`, `statue-broken.jpg`. Composición con capas, no una escena 3D.
- Escudo: el logo que ya usa `AppTopBar` y el sitio.

Los números de esas fotos (78, 82, 74, 65, +6) no son datos de una cuenta. No se hardcodean.

Escritorio, cerca de 1440 px: barra lateral fija, contenido ancho. Teléfono, cerca de 390 px: barra inferior con pocos destinos y el resto en un acceso secundario. No se encoge la barra lateral hasta dejar etiquetas ilegibles. Una anchura intermedia, cerca de 768 px, se comprueba aparte.

Controles del flujo que se toca: foco visible, área táctil de al menos 44 px, motivo en texto si el primario está deshabilitado, sin desborde horizontal, `prefers-reduced-motion` respetado.

## 3. Navegación

La barra de las referencias y el producto no son la misma lista. Se mapea así, y el rótulo visible puede ser el de la referencia si el contenido es el de la columna derecha.

| En la referencia | En el producto | Contenido |
|---|---|---|
| Escudo / inicio | Inicio | Estado real y una sola acción siguiente |
| Espíritu, Mente, Cuerpo | Esas tres entradas | Lectura del perfil por pilar, cuando haya regla. Si no hay regla, la entrada existe y dice que la lectura está pendiente. No se calcula un porcentaje para llenar el hueco |
| Planes | Planes personales | Planes y acciones de la cuenta. Nunca precios |
| Perfil | Perfil Maestro | Resultados, ficha, historia |
| Calendario / Tareas | Calendario | Acciones del plan, semana y lista |
| Asesores | Asesores | Solo lo que la sección 12 de este documento permite |
| (no está en la barra, sí en el producto) | Ruta MK | Fichas del diagnóstico con estado real, y el vínculo al plan vigente |
| (hoy en Cuenta) | Cuenta | Sesión, suscripción comercial, salir |

Precios siguen en Cuenta y en el sitio público. No entran en Planes.

En teléfono los destinos principales son Inicio, Ruta, Calendario y Perfil. Espíritu, Mente, Cuerpo, Planes, Asesores y Cuenta salen de un acceso secundario. Las mismas pantallas existen en los dos tamaños.

## 4. Catálogo: qué se implementa y qué queda pendiente

Extraer con un script que lea el xlsx y deje un JSON revisable. Una persona revisa el JSON contra la hoja antes de activar la versión. El script no es el catálogo.

### 4.1 Reglas que sí se implementan, porque el Excel las cierra

Auditoría E-AUD-001, secciones 1 a 5. Ítems 1 a 23, escala 1 a 5. El máximo del resumen es 115: cinco ítems por 5, más cinco por 5, más cinco por 5, más cuatro por 5, más cuatro por 5. Cada ítem suma su valor. El total de sección es la suma. El avance de sección es el promedio de "respondido" (1 o 0). La alerta de las secciones 1 y 2 es valor igual a 1. La de las secciones 3, 4 y 5, en la fórmula de la hoja, es valor menor o igual a 2. El diagnóstico del total, celda RESUMEN C16, es: sin desarrollo si el total es 0; CRÍTICO por debajo de 46; INESTABLE por debajo de 69; SÓLIDO por debajo de 92; DOMINANTE hasta 115.

Esas cuatro etiquetas ya viven en `SystemReport.classify`, pero ahí los cortes están pasados a 40, 60 y 80 sobre un promedio. Para esta versión mandan los cortes del Excel sobre la suma de 115, calculados en el servidor. No se reutiliza `classify` como si fuera la misma regla.

F-RAD-002. Doce afirmaciones, cuatro secciones de tres, escala 1 a 5. Alerta si el valor es menor o igual a 2. Puntaje de sección = suma. Total = suma de secciones, máximo 60. Bandas del total en RESUMEN: por debajo o igual a 28, detrimento; por debajo o igual a 48, alerta; hasta 60, propulsor. Si la sección de pareja se omite, no se rellena con ceros. El total y las bandas de esa ficha quedan en estado pendiente, porque el Excel dice que "el sistema adaptará el puntaje" y no trae la fórmula. Las secciones respondidas sí muestran su suma.

F-RAD-003, bloque cuantitativo. Misma estructura de doce ítems y cuatro secciones. Total máximo 60. Bandas del resumen: por debajo o igual a 24, crítico; por debajo o igual a 44, alerta; hasta 60, óptimo. Los tres textos de proyección (ítems 13 a 15) se guardan como texto y cuentan solo para el avance, no para el puntaje.

F-RAD-001. Cada respuesta cuenta para el avance. Las alertas se implementan solo donde la fórmula de la celda es legible y coincide con la lista de `NO BORRAR` (enfermedad distinta de No, alimentación Desordenada, actividad No, y las demás condiciones que se puedan citar con celda). Donde el comentario de la columna Observación contradice la fórmula, no se elige uno en silencio: se registra y el ítem se guarda sin alerta hasta la decisión.

E-PER, lo inequívoco: textos, listas de `NO BORRAR`, elección de hasta 10 valores y luego 3 de esos mismos, estándares como texto, ítems de identidad de 1 a 4, ítems de sombra Sí / Más o menos / No con puntaje 2 / 1 / 0, Big Five de 1 a 5 con ítems inversos (6 menos el valor) marcados en la hoja. La frase de propósito del Excel no se completa sola: se arma solo con los fragmentos que la persona eligió, y se muestra el hueco si falta uno.

### 4.2 Reglas que no se implementan como si estuvieran cerradas

Cada una se registra con hoja, celda, alternativa e impacto. La respuesta de la persona se guarda igual.

| Discrepancia | Fuente | Por qué cambia el resultado | Mientras tanto |
|---|---|---|---|
| Alerta de S4 y S5 escrita a veces como igual a 2, y la fórmula como menor o igual a 2 | E-AUD-001, columnas de alerta | Incluye o excluye el valor 2 | Se usa la fórmula de la celda y se deja constancia. No se presenta como errata ya aprobada |
| Pareja omitida "adapta el puntaje" | F-RAD-002, nota de la sección 1 | Cambia el máximo y las bandas del total | Sumas de lo respondido visibles. Banda del total: pendiente |
| Textos de nivel corridos de sección | F-RAD-002, diagnósticos de sección | El párrafo de familia, amigos o trabajo puede ser el de otra sección | Se muestra el nivel numérico. El párrafo se omite si la celda no corresponde al título de esa sección |
| Identidad, hueco entre cortes | E-PER-000, fórmula de D88 | Un puntaje concreto puede quedar sin etiqueta | Se muestra la suma. La etiqueta solo si cae en un tramo que la fórmula nombra |
| Horas de sueño: el texto y la fórmula no coinciden | F-RAD-001 | Cambia quién recibe alerta | Sin alerta hasta citar cuál de las dos manda |
| Plan financiero de la HdRP y diagnóstico general de Sombra | Fórmulas largas, parte de ellas cortadas en el archivo | Un texto derivado sería una invención | No se genera ese párrafo. La persona ve los insumos y un estado pendiente |
| Índices 78, 82, 74, 65 y la curva de cuatro semanas | Solo las fotos de `DeviceShowcase` | No hay fórmula ni serie histórica | El espacio visual existe. El número y la curva no, hasta que haya observaciones reales o una definición firmada |
| E-AUD sección 6 (Brooks, ítems 24 a 33) | Está en la hoja y no entra en el total de 115 ni en RESUMEN | Meterla en el total rompe las bandas | Se responde y se muestra aparte, sin sumarla a las 115 |

Alineación y Profundidad no se calculan. El espacio de la referencia se conserva con un estado visible de resultado pendiente. No se reetiquetan `mk_global` ni `clarity`. Esos índices siguen existiendo solo para sesiones FASE1, con los nombres ya corregidos en la Entrega 0.

## 5. Player y Ruta

El cliente pide `nextStep` y renderiza el tipo de ítem. No puntúa.

Tipos que el player tiene que aprender, además de los que ya tiene: número con unidad y rango, lista de `NO BORRAR`, selección múltiple con tope, texto largo, lista de textos, seguimiento condicional ("si la respuesta es Otra, escribir"), y omisión explícita. Omitir no es responder 0. La fila guarda `skipped` o el equivalente, y el motor la excluye del promedio y de la alerta.

Salir sigue la regla de la Entrega 0: si hay una respuesta válida sin enviar, se envía; si falla, no se navega. No se inventa una respuesta para poder salir.

Al cerrar una sección se muestra su resultado real (suma, avance, alertas) y una acción para seguir. Al cerrar una ficha, el resultado de la ficha y el enlace al perfil o a la ficha siguiente, según `nextStep`.

Ruta MK lee el estado del servidor: pendiente, disponible, en progreso, terminada, bloqueada. El motivo del bloqueo es la ficha anterior sin terminar, que es la única regla de orden que este documento autoriza. Se borra el uso de `FUTURE_AUDITORIAS` como si fuera progreso. Esas filas estáticas no se presentan como etapas que se desbloquean solas.

La nota de versión de revisión de la Entrega 0 se mantiene mientras el catálogo no esté firmado para el público.

## 6. Perfil Maestro e Inicio

Perfil, para una sesión de la versión nueva:

- Fecha y nombre de la definición.
- Resultado de cada ficha que ya tenga regla cerrada.
- Alertas con el ítem que las originó.
- Textos que la persona escribió (visión, valores elegidos, estándares, huella), separados de cualquier síntesis.
- Arquetipo de linaje marcado como elegido por la persona, desde la lista de `NO BORRAR`. No se mezcla con el arquetipo que FASE1 calcula por dimensiones. Una sesión FASE1 sigue mostrando el calculado, con esa procedencia escrita.
- Perfiles anteriores, por sesión, sin recalcular.
- Acción siguiente: seguir la ficha, abrir la hoja de ruta, o ir al plan, según lo que falte.

La composición de la estatua usa `statue-aligned.jpg` (o la variante ya recortada que mejor se integre al fondo `#0a0a0a`) y tres anclajes en las posiciones de la referencia. Si no hay regla de pilar, el anclaje dice que la lectura está pendiente. No se pone un porcentaje inventado.

Inicio no es un segundo perfil. Lee el mismo estado y muestra una sola acción:

- Sin sesión, o sesión vacía: comenzar la auditoría.
- Sesión a medias: continuar en la pregunta que devuelve `nextStep`.
- Fichas terminadas y hoja sin confirmar: abrir la hoja de ruta.
- Hoja confirmada y sin plan vigente: crear el plan.
- Plan con acciones de este periodo sin registro: abrir el calendario.
- Periodo con registros y sin cierre: revisar la semana.
- Periodo cerrado y el siguiente aún no abierto: continuar.

Sin dos observaciones comparables no hay curva. El espacio de `dashboard-panel-desktop.png` muestra el estado vacío y dice qué falta para que aparezca una evolución. No se dibujan cuatro semanas ficticias.

## 7. Hoja de Ruta de Propósito

Pantalla editorial, no un formulario genérico. La referencia es `dashboard-proposito-desktop.png`: fondo negro, título en Bitte, una columna de bloques y el propósito en un recuadro. Los bloques salen de lo que la persona ya respondió y de lo que todavía puede editar: visión, valores, estándares, identidad, prioridades y el propósito armado con fragmentos elegidos.

Separar en la interfaz, no solo en el modelo:

- Respuesta original, editable mientras la hoja no esté confirmada.
- Dato derivado, con la celda o la ficha de origen, no editable.
- Compromiso propuesto (horas, pauta). No se guarda como decisión de la persona hasta que ella lo confirme. Si la fórmula que lo genera está en la lista pendiente, el compromiso no aparece.

Confirmar guarda una revisión inmutable: contenido, fecha, definición. Editar después crea otra revisión. La confirmada anterior se puede leer y no se reescribe.

Desde la hoja confirmada, la acción siguiente es crear un plan. El IKIGAI público no se abre, no se vincula y no se modifica. La sección E-PER-008, si se responde, se rotula como ejercicio dentro del perfil, no como el módulo público ni como un propósito calculado por círculos.

## 8. Planes y acciones

Modelos nuevos, de la cuenta, no de `Plan`:

- Plan: título, resultado buscado, vínculo opcional a una prioridad o a una revisión de la hoja, estado (borrador, vigente, archivado), periodo.
- Acción: enunciado, criterio de realización, fecha o frecuencia, relación al plan, estado.

No se impone un máximo de una acción principal y dos de apoyo. Ese número era una propuesta de un documento anterior, no una regla del Excel ni una decisión de Rafa. El servidor limita lo que haga falta para integridad (texto vacío, fecha imposible, plan archivado), no la cantidad por una regla que no existe.

Editar una acción futura no borra registros ya hechos. Archivar un plan no borra sus semanas cerradas.

Las acciones del plan vigente aparecen en Calendario y en Inicio cuando les toca.

## 9. Calendario

Vista de semana y lista, en la misma información. Cada acción muestra la fecha, el plan, y el registro: pendiente, realizado, omitido, no aplicable. Omitido y no aplicable son estados que la persona marca. La falta de registro no se interpreta.

Corregir un registro del periodo abierto se puede. Reprogramar cambia la fecha de una acción futura y deja constancia. No reescribe un periodo ya cerrado.

Zona: la cuenta guarda una zona IANA. Si no hay ninguna, el default de esta versión es `America/Santiago`, visible en la pantalla, no escondido. Los instantes se guardan en UTC. Una tarea de día completo se guarda como fecha civil en esa zona, no como medianoche UTC. Comprobar un cambio de día y la transición de horario de verano de Chile.

No hay integración con calendarios externos en este encargo.

Cuerpo, en la navegación, muestra los registros que correspondan a lo que el método ya guardó (hábitos o acciones vinculadas). No genera rutinas de entrenamiento.

## 10. Revisión semanal

Una revisión compara el plan vigente con los registros de ese periodo. La persona ve acciones y registros, escribe una nota, y elige mantener, modificar o retirar cada acción. Confirmar cierra el periodo.

El cierre guarda una fotografía: acciones tal como estaban, registros tal como estaban, nota y decisiones. Un cambio posterior del plan no altera esa fotografía. Reintentar el cierre no crea otra revisión del mismo periodo.

Si el Excel no trae un cuestionario de revisión, no se inventan preguntas psicológicas. La nota libre y la decisión por acción alcanzan.

Al cerrar, se puede abrir el periodo siguiente con el plan ya ajustado. El anterior se consulta en modo lectura.

La métrica que sí se puede mostrar es concreta: acciones previstas, registradas como realizadas, omitidas y sin registro. No se le pone el nombre Alineación ni Profundidad.

Inicio, al volver, ofrece la acción del periodo nuevo.

## 11. Asesores

No hay directorio, reservas ni mensajes. No se inventan personas.

Lo que sí puede existir: si una ficha produjo una alerta cuya propia fórmula o texto pide orientación especializada, Asesores lista esa alerta, el ítem de origen, y permite a la persona guardar una solicitud ("quiero que alguien de MK lo vea") ligada a su cuenta. Estado real: enviada, vista, cerrada, si se usa el admin que ya existe para lo mínimo. Sin profesionales ficticios.

Si no hay ninguna alerta de ese tipo, la pantalla lo dice y no muestra tarjetas vacías con fotos.

Nada de esto comparte respuestas con un tercero por sí solo. La solicitud es el acto de la persona.

## 12. Verificación que cierra el encargo

Cuenta de desarrollo, nunca la de Rafa y nunca producción. `MEMBER_PREVIEW_USER_IDS` con esa cuenta. Otra cuenta normal del mismo entorno.

El recorrido, en el navegador, a 390 px, a 768 px y a 1440 px:

1. Entrar y ver en Inicio la acción de comenzar.
2. Responder una parte, Guardar y salir, volver.
3. Abrir otro navegador con la misma cuenta y caer en la misma pregunta.
4. Terminar fichas y ver el resultado de sección que el servidor calculó, no uno pintado en el cliente.
5. Abrir el perfil y reconocer esos mismos números, con la fecha y la versión.
6. Construir la hoja, confirmarla, y comprobar que una edición posterior no reescribe la confirmada.
7. Crear un plan y acciones.
8. Verlas en el calendario.
9. Registrar una como realizada y corregir el registro.
10. Cerrar la revisión.
11. Cambiar el plan y comprobar que la revisión cerrada sigue igual.
12. Abrir el periodo siguiente.
13. Volver a Inicio y ver una sola acción siguiente.
14. Con la cuenta normal, comprobar que el panel de fundador y el 403 siguen igual.
15. Con una tercera cuenta, comprobar que no lee sesiones, planes ni revisiones de la primera.
16. Repetir un cierre y un alta de registro: no se duplican.
17. Cortar la red al guardar: la pantalla no dice que se guardó.

Además: una sesión FASE1 vieja, si existe en la base local de prueba, se lee con su perfil original después de activar la versión nueva. Crear una sesión nueva no le cambia los puntajes.

Pruebas automáticas nuevas para las reglas de la sección 4.1 (totales 115, 60 y 60, alerta, omisión que no es cero, fotografía de semana). Las pruebas de la Entrega 0 siguen en verde. Los tests de Matrix, Experience e IKIGAI no cuentan como prueba de este recorrido.

Build, typecheck de API y de web. Los errores de typecheck que ya existían en tests de Lab se informan aparte y no se mezclan.

Capturas del recorrido real, no de los stills, en `tmp/`, a 390, 768 y 1440, con estado vacío y con estado completo. Si una pantalla no se parece a la referencia en jerarquía, fondo, rojo y tipo, no se da por terminada.

## 13. Qué no se declara terminado

- El diagnóstico solo, el perfil solo o la hoja sola.
- Una pantalla que diga Próximamente para calendario, planes o revisión.
- Un porcentaje de pilar o un 78 sin regla.
- Expo, por haber probado el contrato HTTP en la Entrega 0.
- El catálogo nuevo como publicación. Sigue siendo la versión de revisión hasta que Rafa firme el contenido. La nota discreta permanece.

## 14. Al terminar

Actualizar `MK_IMPLEMENTATION_PROGRESS.md` con lo implementado, lo probado, las discrepancias de la sección 4.2 que siguieron pendientes, cómo designar la cuenta real de Rafa (`users.id` en `MEMBER_PREVIEW_USER_IDS`, reiniciar la API), y las capturas. No commitear salvo que se pida.
