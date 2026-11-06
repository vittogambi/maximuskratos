# Análisis de brechas funcionales

5 de noviembre de 2026. Investigación sobre el código vigente. No se modificó aplicación, esquema, datos ni configuración.

No repite la auditoría de viabilidad (`MK_PRODUCT_VIABILITY_AUDIT.md`). Aquel documento juzga si el ciclo puede crear valor y cobrarse. Este juzga si cada parte hace lo que la visión, la metodología y las decisiones de producto dicen que debe hacer.

## 1. Cómo se lee una afirmación

Tres orígenes, y no se mezclan:

| Origen | Qué cuenta como evidencia | Qué no cuenta |
|---|---|---|
| Acordado con Rafa | Un acta `DECIDIDO` con nombre y fecha, o una regla que el encargo de esta auditoría reporta como confirmada y el código puede contrastar | Un comentario de pack, un default de ingeniería, un test en verde |
| Propuesto por Vittorio | La lista de la sección 2.B del encargo. Todavía no es método firmado | Tratarlo como bug solo porque el código no lo hace |
| Introducido en desarrollo | Constantes, copys y contratos de noviembre (`PRODUCTO_VIABLE.md`, `DISENA_REDISENO.md`, packs `intervencion-*@0.1`) que el propio texto marca como no firmados | Una prueba que fija el número |

Jerarquía que sí está escrita, y está vieja. `docs/phase-2/MK_DECISIONS.md` (14 ago 2026) declara una sola decisión `DECIDIDO`: D12, operar las tiendas como persona. D1 a D11 y el bloque ALINEAR siguen abiertos. La frase de Rafa del 8 ago 2026 (profundizar en dirección y tratar los otros ámbitos como apoyo) está como norte candidato, no como firma. `docs/phase-2/meetings/` no está en el disco. El ciclo de miembro de noviembre no actualizó ese registro.

Consecuencia: el ciclo flexible de noviembre es el producto que el código ejecuta. No es, por el registro de agosto, un método firmado. El encargo de esta auditoría reporta como confirmados la no linealidad, el diagnóstico opcional, el propósito opcional, las seis formas, el objetivo personal como base, el contexto de diagnóstico y propósito, y la separación entre ejecución y resultado. Esos principios se contrastan aquí como visión reportada. Los pesos, las semillas y los umbrales no entran en ese paquete.

El catálogo activo se recontó en esta pasada: `formulario-completo@6`, 31 módulos, 239 preguntas (`packages/database/definitions/formulario-completo@6.json`). El conteo de la auditoría anterior sigue vigente.

Pruebas. No se reejecutó Vitest ni ninguna prueba HTTP. La pasada anterior del mismo día ejecutó 139 pruebas de dominio y 11 de interfaz. Esas pruebas fijan que el código hace lo que dice. No firman la metodología. Esta pasada releyó los caminos citados y recontó el catálogo con un script de lectura.

## 2. Pilares y ámbitos

No son el mismo modelo.

| Concepto | Dónde vive | Qué hace en la cuenta |
|---|---|---|
| Mente, Espíritu, Cuerpo | Copy público, marco, redirecciones `/mente`, `/cuerpo`, `/espiritu` | Esas rutas van a `/panel` (`apps/web/next.config.ts`). No hay una pantalla de pilar |
| Mentalidad, Relaciones, Finanzas, Salud física | Matriz, Diseña, packs de intervención | Son los cuatro ámbitos de trabajo. Misma estructura de fases |
| Propósito | `/proposito`, a nivel de cuenta | No es un ámbito ni un pilar. No bloquea un plan |
| Matriz v2 | Laboratorio admin y `packages/matrix-engine` | No la importa `apps/web`. No alimenta el plan |

Inferencia, no equivalencia firmada: Espíritu se parece a propósito en el lenguaje público. En el producto de miembro, propósito es optativo y los cuatro ámbitos se pueden trabajar sin él. No hay una tabla que diga «Espíritu = Propósito» o «Cuerpo = Salud física» dentro del ciclo.

## 3. Principios reportados como acordados

| Principio reportado | Comportamiento actual | Estado |
|---|---|---|
| A. Descubrirse y después planificar | Descubre abre el player del ámbito. Diseñar lee lecturas si existen | ALINEADO en el camino. La interpretación de cierre no existe (G2) |
| B. Plan directo, sin diagnóstico ni propósito | Paso 1 crea borrador. Sin lecturas, el paso 3 abre el catálogo y lo dice | ALINEADO |
| C. Plan y después diagnóstico | Se puede responder con un plan activo. Una respuesta no reescribe el plan | ALINEADO en la no reescritura. Roto en módulos compartidos (G1) |
| D. Incorporar un descubrimiento a un plan ya activo | La firma nueva deja de orientar un borrador. No hay sugerencia sobre el plan activo. La persona puede ajustar en la revisión, sin que el sistema nombre la respuesta nueva | NO IMPLEMENTADO como sugerencia. El ajuste manual sí existe |
| E. Propósito sin plan | `/proposito` no exige un plan. Hay salida a Diseñar sin dirección | ALINEADO |
| F. Objetivo de corto plazo no atado al propósito | El vínculo nace desmarcado. Se puede activar con `entry` `NO_DIRECTION` | ALINEADO |
| Seis formas de trabajo | Existen como semillas editables | La existencia está ALINEADA con el principio. Las semillas son REGLA PROVISIONAL (G6) |
| El objetivo personal es la base | El paso 1 es «qué quiero cambiar». La plantilla no sustituye ese texto | ALINEADO |
| Diagnóstico y propósito aportan contexto | Lecturas marcadas suman peso. La dirección se puede citar y no ordena el catálogo | PARCIALMENTE ALINEADO. El contexto de propósito no entra en la recomendación |
| Ejecución y resultado separados | Hecho no llena el indicador. El indicador no marca la acción | ALINEADO |

No hace falta un wizard único. El código ya no lo es. Conviene no construirlo.

## 4. Propuestas de Vittorio, todavía sin firma

| # | Propuesta | Qué hace el código | Estado |
|---|---|---|---|
| 1 | Al completar el ámbito: fortalezas, dificultades, patrones, oportunidades | Al completar, la ficha dice «Completaste las preguntas de este ámbito en el cuestionario.» Hasta seis líneas de `discoverSynthesis`, que no son ese informe | NO IMPLEMENTADO |
| 2 | Desde esa lectura, crear un plan o relacionarla con uno existente | Crear un plan desde una lectura marcada, sí, en el paso 1 de un borrador nuevo. Relacionarla con un plan activo, no | PARCIALMENTE ALINEADO |
| 3 | No interpretar antes de terminar el ámbito | Las lecturas del paso 1 aparecen en cuanto hay una respuesta en banda, aunque la cobertura sea parcial | IMPLEMENTADO DIFERENTE |
| 4 y 5 | Un descubrimiento posterior puede sugerir un ajuste, ahora o en la revisión | No hay propuesta disparada por una respuesta nueva. `PRODUCTO_VIABLE.md` sección 14 lo deja fuera del ciclo | NO IMPLEMENTADO |
| 6 | La persona acepta o rechaza. MK no cambia el plan solo | Activar, reconocer y aplicar la revisión son confirmaciones. Una respuesta no muta el plan | ALINEADO en el «no automático». Falta la propuesta que habría que aceptar |
| 7 | Propósito orienta y no bloquea lo urgente | No bloquea. Tampoco reordena estrategias | ALINEADO en no imponer. Débil en orientar |
| 8 | Distinguir objetivo práctico y objetivo ligado al propósito | Si vincula, elige `DIRECT`, `ENABLING`, `PROTECTIVE` o `EXPLORATORY` (`apps/web/lib/plan-design.ts`). Si no vincula, el plan no lleva esa etiqueta | PARCIALMENTE ALINEADO |
| 9 | Control de la persona | Confirmaciones explícitas en activar y en aplicar | ALINEADO |
| 10 | El piloto estudia los dos recorridos | No hay instrumento de piloto. Los dos caminos se pueden abrir. G1 los contamina si comparten sesión | REQUIERE VALIDACIÓN DE RAFA en el diseño del piloto. G1 es corrección técnica |

## 5. Player de diagnóstico

### 5.1 Qué significa completar un ámbito

Hay dos cierres distintos.

Cobertura, la que pinta la matriz. `territoryCoverage` cuenta preguntas del catálogo activo asentadas para ese ámbito, excepciones incluidas. Estados: `NOT_STARTED`, `PARTIAL`, `EXPLORED`. No es un puntaje. Denominadores reimpresos por el test de catálogo en la pasada anterior y coherentes con el código de `territory-catalog.ts`: Mentalidad 11, Finanzas 19, Relaciones 17, Salud física 54.

Cierre del player con foco. `startOrResumeForTerritory` marca como `AVAILABLE` los módulos que tienen al menos una pregunta del ámbito y guarda `focusTerritory`. El estado `territory_complete` sale cuando todos esos módulos están `COMPLETE` y con `outroSeen` (`diagnostic.service.ts`, alrededor de las líneas 729 a 758). La web no muestra un informe: `DiagnosticPlayer` reemplaza la ruta por la ficha del ámbito con `?cuestionario=completo` (`diagnostic-continue.ts`). El texto es el de `TerritoryScreen.tsx`: «Completaste las preguntas de este ámbito en el cuestionario.»

`territory_pause` es otro final: «Por ahora no hay más preguntas de este ámbito en el módulo actual.» No es una interpretación.

### 5.2 Módulos y preguntas por ámbito

La pertenencia la decide `territoryForSourceRef` (`territory-catalog.ts`), no una etiqueta de pilar.

| Ámbito | Qué entra en la cobertura | Qué usa el pack para una lectura |
|---|---|---|
| Mentalidad | Escalas de auditoría R6, R7, R8, R9, R10, R19, R20, R26, R27, R29, R30. Once referencias | Diez escalas, sin R10, más dificultades del perfil y la frase de visión para coherencia. Pack `intervencion-mentalidad@0.1` |
| Finanzas | R37 a R40 de auditoría y la radiografía `F-RAD-003` que el catálogo asigna. Diecinueve | Un subconjunto de esas escalas. Cinco lecturas. No hay plan de inversión |
| Relaciones | R28, R46 a R49 y `F-RAD-002`. Diecisiete | Cuatro lecturas: pareja, familia, círculo, trabajo |
| Salud física | R16, R17, R18 y toda `F-RAD-001`. Cincuenta y cuatro | Tres lecturas de hábito. La indicación médica no abre lectura. Puede exigir aclaración |

Fuera de los 101 de cobertura: el perfil `e-per-*` y el sentido `e-aud-s6`. Entran en el cuestionario general. No eligen plantilla.

Dos módulos mezclan ámbitos. Conteo de esta pasada sobre el JSON:

| Módulo | Mezcla |
|---|---|
| `e-aud-s2` | 3 preguntas de Salud física y 2 de Mentalidad |
| `e-aud-s3` | 4 de Mentalidad y 1 de Relaciones |

El resto de módulos observados cae en un solo ámbito o fuera de la cobertura.

### 5.3 Resultados que sí se calculan

| Cálculo | ¿Lo ve el miembro? | Uso posterior |
|---|---|---|
| Cobertura por ámbito | Sí. «N de M» | No elige plantilla |
| Lectura de intervención si la banda es 1 o 2, o la dificultad es sí | Sí, en Diseñar, si no la rechazó | Peso 2 si la marca |
| Banda 4 o 5 como recurso | No como informe | No abre plan. Es deliberado en `band` |
| `ScoreSnapshot` con deltas vacíos en este catálogo | No | No discrimina |
| Cierre de auditoría `e-aud-s6` (suma y rótulo) | Sí, solo al pasar ese módulo | No entra al pack |
| Personalidad y sombra dentro del player | Sí, en esos módulos | No eligen plantilla |
| `MasterProfile` al cerrar el cuestionario general | No hay pantalla. `PerfilContent` no está importado | Arquetipo `sin-clasificar` en este catálogo |
| `DiagnosticFormResult` | Admin, en el recorrido | No el plan |
| `discoverSynthesis` / `devolutionOf` | Hasta seis líneas en la ficha, si Descubre se queda en pantalla | Visión, valor, estándar, postergación. No cita R26 |

### 5.4 Qué solo se guarda

El 3 de una escala. El no de una dificultad. Las excepciones. R10. La radiografía de salud salvo el efecto de seguridad de la indicación. Personalidad, sombra, arquetipo elegido, casi todo el texto libre que no esté en las pocas filas que alimentan dirección o coherencia. Los 4 y 5, guardados como recurso y no narrados.

### 5.5 Qué puede ver y qué no entiende como siguiente paso

Puede ver la pregunta, su progreso, el rótulo de auditoría al cerrar la sección 6, etiquetas de personalidad y sombra en el camino general, y después una frase de ámbito completado. No recibe fortalezas, dificultades, patrones y oportunidades como informe de ámbito.

Puede seguir a Diseñar. Si alguna lectura está en banda, el paso 1 le pregunta si le representa. Si no hay ninguna, la ficha dice que no hay lecturas y ofrece un plan. Eso no equivale a «esto es lo que descubriste».

Al terminar el general, `/diagnostico/resultado` redirige a `/memoria?vista=documentos`. `MemoryScreen` no lee `vista`. El destino es historial de planes, no un perfil.

### 5.6 Retomar

La sesión activa se reabre. Las respuestas quedan con revisión. Entrar por un ámbito vuelve a poner `focusTerritory`. Entrar al general lo quita (`diagnostic.service.ts`, rama `options.general`). Una excepción no se convierte en sí. Si cambia una respuesta que sostenía una lectura, la firma caduca (`STALE_READING`).

### 5.7 Reglas de Rafa y reglas sin fuente verificable

De Rafa, en el instrumento: el texto de las preguntas y las escalas del catálogo. El registro de agosto no firma cómo se interpretan.

Sin fuente metodológica verificable, ya en código: la banda 1 y 2 abre y el 3 no. Qué dificultades abren lectura. Los textos «Puede que…». Que R10 cuente para Explorado y no para una lectura. Que completar el subconjunto de un módulo mixto cierre el módulo entero (G1). Los rótulos de auditoría, sombra y personalidad del player, que vienen de código de lectura de hoja y no están conectados al plan.

Los índices de la Matriz v2 no se usan en este ciclo. No están «mal aplicados» aquí. Están fuera. Usarlos en la cuenta sería otro producto. No se propone.

### 5.8 Respuestas directas

1. Completar el ámbito, en el player, es cerrar los módulos que contienen alguna pregunta suya. En la matriz, Explorado es otro conteo. Ninguno de los dos entrega el informe de fortalezas y dificultades.
2. La tabla 5.2.
3. Cobertura, lecturas de banda, snapshots que no discriminan, cierre de la sección 6, personalidad y sombra, perfil al cerrar el general.
4. Las que el pack declara y caen en banda candidata o en sí. El miembro las ve solo si entra a Diseñar y no las rechazó.
5. El resto del catálogo, más los recursos 4 y 5.
6. Frases de lectura en Diseñar, líneas de síntesis en la ficha, rótulos sueltos dentro del player, y la frase de ámbito completado. No un informe de ámbito.
7. `MasterProfile`, `ScoreSnapshot`, `DiagnosticFormResult`, otro de módulo que el cliente no muestra salvo `e-aud-s6`.
8. El texto del instrumento. No la banda ni los pesos.
9. Banda, listas de lectura, textos de interpretación, cierre de módulo compartido, pesos.
10. El perfil se crea al cerrar el general y no se muestra. No orienta el plan.
11. Los índices de matriz no participan. Los snapshots de este catálogo no informan una decisión.
12. Vuelve a la ficha con una frase de finalización. Si la cobertura no está explorada, la ficha puede reabrir el cuestionario (`TerritoryScreen`, `emptyDiscover`).
13. Retoma la sesión, conserva revisiones y puede cambiar de foco.
14. No, si «comprender» significa un cierre de ámbito. Sí, de forma estrecha, si entra a Diseñar y reconoce una lectura.

## 6. De la respuesta al plan

Cadena que el código sí recorre:

```text
Response
  → answerLedger
  → band o sí / más o menos / no
  → buildReadings
  → reconocimiento REPRESENTS o PARTIAL
  → casilla contextReadingIds
  → recommendStrategies (+2, y +1 si el tipo de cambio coincide)
  → elige plantilla o forma propia
  → semillas editables
  → activar
```

Dónde se corta siempre:

- No hay pantalla de «oportunidad de mejora» distinta de la lectura.
- El 4 y el 5 no entran.
- Una lectura no se cuelga de un plan que ya está activo.
- El propósito no es un eslabón de esta cadena.
- Si la persona no marca la casilla, la cadena termina en «dato guardado».

### Mentalidad

Ejemplo. R26, «¿Planifico mi semana o, en su mayoría, solo reacciono a ella?», valor 2. Referencia `formulario-v1:E-AUD-001!R26`. La lectura `planificacion` cita el 2 de 5 y declara `MEN-A1` y `MEN-A2` (`mentalidad.ts`). Si la reconoce y la marca, esas dos plantillas suman 2. El motivo visible incluye la interpretación. Elegirlas siembra la acción. No activa solo.

R26 en 4 o 5 no abre esa lectura. R10 está en la cobertura y no está en `SCALES`. No hay consecuencia de plan.

### Finanzas

Ejemplo. Radiografía R8 en 1 o 2 sostiene la lectura `margen` junto con otras escalas de margen (`finanzas.ts`). Interpretación: «Puede que el dinero del mes no te esté dejando margen.» Planes declarados: `FIN-A1`, `FIN-B1`. No recomienda un producto ni una deuda. `INVESTMENT` y `DEBT` se rechazan en `decideAction`. Las filas de inversión no tienen plantilla. Eso es un límite de seguridad, no una personalización a medias.

### Relaciones

Ejemplo. La escala de pareja en 1 o 2 abre la lectura `pareja` y puede sugerir `REL-A1` o `REL-A2` (`relaciones.ts`). Pide con quién. No redacta la respuesta de la otra persona. La forma propia `CONVERSATION` en este ámbito marca `CONFRONTATION` y pide viabilidad. Las plantillas de catálogo de Relaciones no traen esa marca en la ficha de plantilla. Una conversación difícil escrita solo en el título puede no disparar el control. Límite conocido. No lo afloja esta auditoría.

### Salud

Ejemplo. R16 en 1 o 2 abre `entrenamiento` y `SAL-A1` (`salud.ts`). La acción trae `PHYSICAL_EXERTION`. La indicación médica «Sí» no crea una cuarta lectura. Si el texto de salud no es un no claro, `healthFactFromAnswers` lo trata como ambiguo y `decideAction` pide aclaración antes de permitir la marca. No prescribe ejercicio.

Personalización que existe: la cita de la respuesta, el tipo de cambio, el foco que la persona escribe, el uso anterior mencionado sin cambiar el orden. No existe un modelo que combine a la vez objetivo, todas las respuestas y el propósito.

Recomendaciones genéricas: el catálogo completo cuando `basis` es `NONE`. Las seis formas, que no miran respuestas, salvo `EXPLORE` si el modo es exploración. El texto de `recommendStrategies` cuando nadie suma: «Con lo que tenemos hasta ahora, no hay una estrategia que destaque.»

Crear un plan desde un resultado: sí, desde una lectura marcada, hacia un borrador nuevo. Relacionar ese resultado con un plan ya activo: no hay flujo. Lo que sí se preserva: registros, indicador y acciones ya vividas. Un ajuste posterior crea sucesora desde un lunes futuro y no reescribe la semana cerrada (`action-review.ts`).

## 7. Propósito e IKIGAI

Qué obtiene. Una frase propia, un estado (`CONFIRMADO_POR_USUARIO`, `PROVISIONAL`, `EXPLORANDO`) y el historial de versiones. En respuestas, el literal de visión, valores e IKIGAI, y un cruce que ella valora. La exploración guiada no le inventa la frase (`direction-exploration.ts`).

Qué se guarda. `PurposeRevision` por cada guardado. Síntesis del cruce en el contenido. Fuentes copiadas por el servidor si partió de una respuesta.

Qué se usa después. Copiar texto al cambio o al motivo, si pulsa el botón. Vincular `purposeRevisionId` y un `linkKind`, desmarcado. Al activar, si la dirección cambió, elige conservar, actualizar o desvincular. `recommendStrategies` no recibe la dirección.

IKIGAI real, tres piezas:

| Pieza | Cuenta de miembro | Efecto en el plan |
|---|---|---|
| Módulo `e-per-ikigai` y cruce en `/proposito/respuestas` | Sí | Ninguno automático |
| `/ikigai` con `@mk/ikigai-engine` | No. Token, sin `userId` | Ninguno |
| `IkigaiExperiment` y `IkigaiCross` | No montados. Solo tests y acompañamiento | El cruce viejo creaba planes por la API anterior |

Objetivo no ligado al propósito. Se activa igual. No hay castigo ni aviso de incoherencia que bloquee. Orienta sin imponer en el sentido débil: ofrece vínculo y no obliga. No orienta en el sentido fuerte: no sugiere qué plan se acerca a la frase.

Incompleto respecto de la visión de «conocer propósito»: no hay hoja de ruta firmada, ni IAD, ni contrato HDRP en pantalla. `docs/product/PROPOSITO.md` (local, `docs/` no está en git) los deja fuera y lista pendientes de Rafa: la regla del par, la plantilla de frase, la fila de vocación, qué visión es el punto de partida. Esas piezas no deben volverse requisito.

Validación metodológica: si la dirección confirmada debe pesar. Si el par de la exploración es admisible. Si la plantilla «Mi propósito es…» se puede ofrecer de nuevo. Hoy no se ofrece armar una nueva desde Propósito, a la espera de esa firma.

## 8. Diseña y Actúa: de dónde sale cada regla

Cinco pasos, alineados con el contrato `diseno-plan@1`: cambio, resultado, estrategia, acciones, activar. El objetivo del paso 1 es la base. Ejecución y resultado siguen separados en la semana.

| Regla | Clase | Fuente |
|---|---|---|
| Diagnóstico y propósito no obligatorios | A, reportada como acordada | El código la cumple. No hay acta D en `MK_DECISIONS.md` |
| Seis formas como maneras de armar acciones | A en la existencia. C en veces, minutos y textos de semilla | `WORK_PATTERNS`, `patternSeeds`. `DISENA_REDISENO.md` sección 12 |
| Peso 2, peso 1, máximo 3, explorar primero | C | `recommendStrategies`. El mismo documento dice que no está firmado |
| Aviso a los 300 minutos o más de 3 acciones, no bloquea | C | `DEMANDING_WEEKLY_MINUTES` |
| Tope 6 acciones y 1680 minutos | D, límite técnico revisable | `MAX_ACTIONS`, `MAX_WEEKLY_MINUTES` |
| Rechazo de inversión, deuda, esfuerzo incompatible y conversación insegura | D | `restrictions.ts`, `decideAction` |
| Sin día fijo. Disparador que no se vuelve ocasión semanal. Plantilla que se conserva al reemplazar | Decisión de alcance ya escrita, no es desalineación | `DISENA_REDISENO.md` |
| Hecho distinto del indicador | A, reportada | `recordIndicator` no marca la acción |
| Un sí con una sola medida no es avance | C, y además el markdown de producto todavía dice lo contrario | `progressFrom` en `engine.ts`. `PRODUCTO_VIABLE.md` sección 9 |
| 75 % y 40 % sobre hecho y no hecho. Huecos → `NO_RECORDS` | C | `executionFrom`, `executionStats`, `reviewProposal` |
| La persona puede no seguir la propuesta | A en el control. C en si la propuesta debe poder desobedecerse | `followsProposal` |
| La revisión no reescribe lo vivido y entra el lunes futuro | D de integridad, coherente con el control de la persona | `action-review.ts` |

Una prueba en verde demuestra que la regla está implementada. `intervention-mentalidad.test.ts` incluso nombra «la tabla de revisión acordada». Ese acuerdo es interno del código de noviembre. No es una firma de Rafa en el registro de agosto.

## 9. Admin: ¿puede Rafa validar el método sin tocar código?

Puede consultar. No puede gobernar el método del ciclo.

| Puede | No puede, sin un cambio de código |
|---|---|
| Listar cuentas, leads y un conteo de altas a 7 días (`admin.service.ts` `stats`) | Ver planes activados, registros o revisiones aplicadas como métrica |
| Abrir el recorrido de una cuenta, respuestas y alertas de cuestionario | Editar una lectura, un peso, una semilla o un umbral |
| Editar el catálogo de precios y los días de prueba | Encender un cobro. No hay cliente de Mercado Pago |
| Usar el laboratorio: casos, hallazgos, cobertura de reglas de la Matriz, readiness, comparaciones | Hacer que ese laboratorio cambie `intervencion-mentalidad@0.1`. La Matriz está congelada y el ciclo no la llama |

El laboratorio sirve para validar la Matriz, no las seis formas ni el paso del diagnóstico al plan de miembro. Cada cambio de interpretación del ciclo es un cambio en TypeScript. Para el piloto, Rafa no necesita un editor metodológico. Necesita ver casos: esta respuesta, esta lectura, esta sugerencia, esta decisión de la persona. Eso hoy se puede leer en base o en el recorrido admin de a una cuenta. No hay una vista de «reglas provisionales del ciclo» ni un interruptor para apagar el peso 2.

Métricas que faltan para el piloto, y que no justifican un editor: activación, primer registro, indicador guardado, revisión aplicada. Son consultas o eventos sobre tablas que ya existen.

Herramientas legado o de otro producto: pantallas de perfil no montadas, `PlansScreen`, acompañamiento, laboratorio de matriz como si fuera el admin del ciclo. El admin de precios es real y comercial. No valida metodología.

## 10. Recorridos en la web de miembro

Detalle de navegación, vacíos y sesión: la auditoría de viabilidad, secciones 3 y 4. Aquí solo el contraste funcional. Navegador: NO VERIFICADO en esta pasada.

### A. Diagnóstico y después plan

Pasos: matriz o ficha → player con `focusTerritory` → al cerrar, ficha con la frase de completado → Diseñar → lecturas si las hay → cinco pasos → `POST .../activate`. APIs: `POST /diagnostic/territory/:territory/start`, `POST /diagnostic/response`, `GET /journey/intervention/:territory/design-context`, `POST .../designs`, `PATCH .../design`, `POST .../activate`. Persistencia: `Response`, luego `PersonalPlan` y `PlanProposal`. Resultado: un plan, no un informe de ámbito. Bloqueo: G1 si ese ámbito comparte módulo. Falta: el cierre de fortalezas y oportunidades (propuesta de Vittorio, no firmada).

### B. Plan y después diagnóstico

Pasos: Diseñar sin lecturas → activar → más tarde Descubre. El plan sigue. Las respuestas nuevas no proponen un ajuste. Si el módulo compartido se cierra por el otro ámbito, preguntas de este pueden no volverse a preguntar (G1). Resultado: el plan no se entera. Falta, si Rafa confirma D: una sugerencia que la persona acepta en el momento o deja para la revisión.

### C. Diagnóstico, propósito y plan

Suma de A más `/proposito`. El cruce IKIGAI no crea el plan. El vínculo es optativo. No hay síntesis única de los tres. Fricción de expectativa, no un bloqueo técnico, salvo G1.

### D. Plan sin diagnóstico ni propósito

Es el camino B de la sección 3. Resultado posible: plan de catálogo o propio, con criterio de hecho. Sin lectura, no hay personalización por respuestas. Eso es coherente con el principio, no un defecto.

### E. Descubrimiento nuevo y plan existente

No hay pantalla. La revisión semanal permite mantener, aligerar, cambiar, reprogramar, reemplazar o retirar, y no nombra la respuesta nueva como motivo. Las semanas anteriores quedan. Falta la propuesta. No falta el freno: nada se aplica solo.

### F. Propósito no relacionado con el objetivo

Deja el vínculo sin marcar, o elige `PROTECTIVE` / `ENABLING` si quiere decir que el objetivo cuida otra cosa. No hay tipo «práctico, ajeno al propósito». No hace falta para cumplir F. Sí haría falta si Rafa quiere ver esa distinción en la ficha.

Enlaces que no llegan. Excepciones de la matriz con `?excepciones=1`: la ficha no muestra un destino de excepciones en el código leído de `TerritoryScreen`. `vista=documentos` no lo lee Memoria. Prioridad menor. No inventar ahí un perfil.

Coherencia visual y móvil. NO VERIFICADO en navegador en esta pasada. El contrato de shell está en `DESIGN.md` y en las reglas de superficie. No se auditó pixel a pixel.

## 11. Web pública

| Promesa | Dónde | Contra la cuenta | Clase |
|---|---|---|---|
| Un plan con acciones y una revisión | Hero, en parte. El ciclo lo hace | El ciclo lo entrega | Respaldada, si se dice así |
| Separar hacer la acción y ver el resultado | No es el titular del sitio. Sí el producto | Implementado | Respaldada en producto, poco dicha |
| Propósito editable y opcional | El sitio habla de hoja de ruta que ordena prioridades | Hay una frase y un vínculo optativo. No hay hoja que ordene los planes | Parcial |
| IKIGAI | Existe herramienta pública y cruce de cuenta | No produce el plan | Parcial. Son dos productos |
| Personalización | «Detecta la distancia…» | Solo lecturas marcadas, con pesos provisionales | Parcial |
| Perfil Maestro, arquetipo, índices | `product-stages.ts`, beneficios del seed, marco central | No hay pantalla de miembro. El perfil guardado no clasifica en este catálogo | No implementada como experiencia |
| Índice de alineación en el panel | Etapa 05 de `PRODUCT_STAGES` | El panel es la matriz de ámbitos. El porcentaje, si sale, es ejecución | No implementada. El mensaje describe otro producto |
| Transformación y propósito trascendental | Manifiesto y hero | El ciclo prueba un cambio de pocas semanas | Hipótesis comercial. Riesgo de expectativa |
| Planes de suscripción y beneficios de perfil | `/precios`, seed | No hay cobro. El acceso no distingue pago. Los beneficios nombran el perfil | Hipótesis comercial. Engañoso si se lee como lo que la cuenta recibe hoy |
| Acceso anticipado sin cobro | Copy de early access | Cierto: no cobra | Respaldada |

No se propone apagar Descubre, Propósito o IKIGAI porque estén incompletos. Se propone no anunciar como entregado el perfil, el índice y la hoja que ordena la vida. Corregir la promesa, implementar el informe de ámbito y validar si ese informe aporta valor son tres trabajos distintos. El primero no necesita el segundo. El segundo no debería escribirse antes de que Rafa diga qué conclusiones están justificadas.

## 12. Seguridad y piloto

Sin relajar controles.

| Tema | Estado | Efecto en un piloto real |
|---|---|---|
| Sesión | Access sin `expiresIn`. Refresh por cookie. Fila de refresh sin caducidad de calendario | Aceptable para un círculo chico. No para cuentas abiertas sin una decisión técnica de expiración |
| Términos | `TERMS_PENDING` no pide aceptación. El registro no tiene casilla | Falta consentimiento explícito antes de respuestas sensibles |
| Privacidad | Respuestas, dirección y planes por `userId`. Admin con rol lee el recorrido y queda `AdminAccessLog` | Hay que decirlo en la invitación. El contraste fino con `/privacidad` no se rehízo aquí |
| Salud, relaciones, dinero | `decideAction` rechaza inversión y deuda, y pide aclaración de esfuerzo o conversación | No aflojar. El texto libre de una plantilla puede no marcar la conversación |
| Integridad | Revisiones de respuesta, firma de lectura, sucesora de acción, lunes futuro | G1 es el agujero: un ámbito puede dar por cerrado un módulo que todavía tiene preguntas de otro |
| Histórico | `ResponseRevision`, `PurposeRevision`, acciones con `effectiveTo` | Sirve para no reescribir el pasado |
| Eventos de uso | No hay embudo del ciclo. Stats: cuentas y leads | El piloto no se puede leer solo con el admin |

Pruebas de integración no ejecutadas. Exigen la base `mk_journey_it` y el script de aceptación la borra al salir. Quedan NO EJECUTADAS.

## 13. Matriz de brechas

| ID | Área | Requisito esperado | Origen | Comportamiento actual | Evidencia | Estado | Brecha | Impacto | Prioridad | Esfuerzo | Responsable | Criterio de aceptación |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| G1 | Player | Cada ámbito pregunta lo suyo sin cerrar preguntas de otro | Integridad del instrumento. Afecta los recorridos C y D | En foco, el módulo se marca `COMPLETE` cuando se responden solo las preguntas filtradas del ámbito | `diagnostic.service.ts` filtro y update `COMPLETE`. JSON: `e-aud-s2` mezcla Salud y Mentalidad. `e-aud-s3` mezcla Mentalidad y Relaciones | IMPLEMENTADO DIFERENTE | El módulo compartido no se reabre | Quien hace los dos recorridos pierde preguntas | P0 | Medio | Desarrollo | Un caso con `e-aud-s2`: Salud primero no marca respondidas las de Mentalidad del mismo módulo, y Mentalidad después las pregunta. El módulo no queda `COMPLETE` para el otro ámbito |
| G2 | Descubre | Al completar el ámbito, un informe de fortalezas, dificultades, patrones y oportunidades | Propuesta de Vittorio, no firmada | Frase de completado y, como máximo, seis líneas de otra síntesis | `TerritoryScreen.tsx`, `discoverSynthesis`, `devolution.ts` | NO IMPLEMENTADO | No hay ese informe | La persona no ve «qué descubrí» | P1 | Alto si se redactan conclusiones. Bajo si solo se cita la pregunta y el valor | Rafa para el texto. Desarrollo después | No se muestra antes de terminar el ámbito. Cada frase cita la pregunta. No abre ni cambia un plan sola |
| G3 | Descubre | No interpretar el ámbito antes de terminarlo | Propuesta de Vittorio. Choca con usar el diagnóstico en cuanto haya datos | El paso 1 muestra lecturas con cobertura parcial | `buildReadings`, `StepChange` | IMPLEMENTADO DIFERENTE | Interpreta por respuesta, no por ámbito cerrado | Puede ser lo correcto para la flexibilidad, y lo incorrecto para la propuesta 3 | P1 | Bajo | Rafa | Rafa elige: lectura en cuanto existe la respuesta, o solo con el ámbito `EXPLORED` |
| G4 | Plan activo | Un descubrimiento posterior puede sugerirse, ahora o en la revisión, y solo se aplica si la persona acepta | Visión D reportada y propuestas 4 a 6 | No hay sugerencia. El ajuste manual no cita la respuesta nueva. Lo ya vivido no se reescribe | `PRODUCTO_VIABLE.md` sección 14. `action-review.ts` | NO IMPLEMENTADO | La cadena se corta en el plan activo | El recorrido D no se siente | P1 | Medio, después del texto que Rafa permita | Rafa, luego desarrollo | Con un plan activo y una lectura nueva reconocida, aparece una propuesta. Rechazarla no cambia acciones ni registros |
| G5 | Diseña | Sugerencias explicables y, si se usan números, números firmados | Principio de contexto. Los pesos son de desarrollo | +2 lectura marcada, +1 tipo de cambio, máximo 3 | `recommendStrategies` en `plan-design.ts` | REGLA PROVISIONAL | El orden parece método | El piloto puede confirmar una regla no firmada | P1 | Bajo para rotular o dejar de destacar tres | Rafa | O firma los pesos para el piloto, o la pantalla dice que el orden es provisional, o no destaca tres |
| G6 | Diseña | Seis formas de trabajo | Existencia reportada como acordada. Semillas no | Semillas con veces y minutos fijos | `WORK_PATTERNS`, `patternSeeds` | REGLA PROVISIONAL en el detalle | La forma está. El contenido inicial no está firmado | Un piloto de «la forma» mezcla andamio y método | P1 | Nulo si se aceptan como andamio | Rafa | Lista firmada o marcada provisional de las seis semillas |
| G7 | Propósito | Puede orientar sin bloquear un objetivo urgente | Acordado en el encargo. Propuestas 7 y 8 | No bloquea. No ordena plantillas. El vínculo es optativo | `StepChange`, `LINK_OPTIONS`, `recommendStrategies` | PARCIALMENTE ALINEADO | Orientar está reducido a copiar texto y vincular | Quien espera que el propósito elija el plan no lo ve | P1 | Nulo hasta que Rafa diga si debe pesar | Rafa | Decisión explícita: contexto voluntario, o peso. Mientras, no se añade peso |
| G8 | Descubre | Las fortalezas también se comprenden | Propuesta 1. El código trata 4 y 5 como recurso y no los narra | Se guardan y no abren lectura ni informe | `band` en `engine.ts` | NO IMPLEMENTADO | No hay lectura de recurso para la persona | Solo ve dificultades potenciales | P1 | Medio | Rafa | Si se muestran, es cita del valor, no un plan de carencia, y no reordena el catálogo por gravedad |
| G9 | Web pública | Lo que se anuncia es lo que la cuenta puede hacer | Confianza del piloto | Perfil, índice y hoja que ordena la ruta siguen en etapas, marco y beneficios del seed | `product-stages.ts`, `landing-copy.ts`, `seed.ts` `PLAN_BENEFITS` | IMPLEMENTADO DIFERENTE | Promesa de otro producto | Reclutar con el sitio mide la expectativa, no el ciclo | P0 para un piloto público. P1 si el piloto no usa el sitio | Bajo en copy, cuando se sepa la frase | Rafa y negocio | La invitación del piloto no nombra perfil, índice ni hoja de ruta. El sitio no llama «entregado» a lo que no tiene pantalla |
| G10 | Piloto | Poder observar activación y retorno | Operación del piloto | Stats de cuentas y leads. Sin eventos del ciclo | `admin.service.ts` | NO IMPLEMENTADO | No hay lectura de cohorte | No se sabrá si volvieron | P0 para declarar el piloto. No bloquea programar el ciclo | Bajo | Desarrollo | Cuatro hechos recuperables por cuenta de prueba: activó, registró, guardó indicador, aplicó revisión |
| G11 | Actúa | El criterio de progreso que se explica es el que corre | Integridad de la explicación | Un solo sí queda `UNKNOWN`. El markdown del ciclo dice que el último sí basta | `progressFrom`. `PRODUCTO_VIABLE.md` sección 9 | IMPLEMENTADO DIFERENTE | Documento atrasado | Se explica mal la segunda semana | P2 | Bajo | Rafa si quiere cambiar el motor. Si no, desarrollo corrige el documento | El documento cita `progressFrom` o Rafa pide el otro criterio y se cambia con prueba |
| G12 | Admin | Rafa puede supervisar la metodología del ciclo | Pregunta de esta auditoría | Supervisa la Matriz y lee cuentas. Las reglas del ciclo están en código | `lab.controller.ts`, packs en `intervention/` | PARCIALMENTE ALINEADO | No hay gobierno del ciclo sin desarrollo | Cada texto de lectura es un deploy | P2 para el piloto. No construir un editor ahora | Bajo una vista de lectura. Alto un editor | Rafa para el proceso. Desarrollo no abre un editor | Rafa revisa un caso exportado o una cuenta. Un cambio de peso sigue siendo un cambio de código con su nombre |
| G13 | Navegación | Un enlace llega a lo que nombra | Corrección técnica | `vista=documentos` no se lee. El enlace de excepciones no tiene destino de excepciones en la ficha | `next.config.ts`, `MemoryScreen.tsx` | IMPLEMENTADO DIFERENTE | Destino equivocado | Después del cuestionario cae en memoria vacía | P2 | Bajo | Desarrollo | El fin del diagnóstico no promete un resultado que la pantalla no tiene. Las excepciones, si se enlazan, se listan |
| G14 | IKIGAI | Una herramienta, o varias con frontera clara | Visión. No es requisito | Tres contratos. Solo el cruce está en la cuenta, sin efecto de plan | `IkigaiSession`, `PurposeIkigaiCross`, `IkigaiCross` sin ruta | PARCIALMENTE ALINEADO | Redundancia | Formularios que no deciden | P2 | Nulo si se dejan separados | Rafa | Siguen separados en el piloto. No se unen cuentas |
| G15 | Confianza | Consentimiento antes de datos sensibles | Preparación de piloto | No hay aceptación de términos en el registro | `register` y `onboardingStep` por defecto | NO IMPLEMENTADO | Falta consentimiento | Riesgo al salir del círculo | P1 si el piloto es externo. P2 si es interno | Bajo | Desarrollo y negocio para el texto legal | La cuenta de prueba no envía la primera respuesta sin un acepto registrado |
| G16 | Carga | Aviso de exigencia con umbral firmado o claramente provisional | Desarrollo | Aviso no bloqueante a 300 minutos o más de 3 acciones. 1680 sí bloquea | `designLoad`, `designReadiness` | REGLA PROVISIONAL el aviso. ALINEADO el tope como límite técnico | El aviso parece criterio de conducta | Puede asustar o pasar desapercibido | P2 | Nulo hasta la firma | Rafa | El piloto anota si el aviso salió y qué decidió la persona. No se cambia el número antes |

Lo que no entra como brecha: ausencia de día fijo, disparador que no genera ocasiones semanales, conservación de la plantilla al reemplazar, opcionalidad de Descubre y de Propósito, cinco pasos, cuatro ámbitos, y que el sistema no aplique una revisión solo.

## 14. Orden de implementación

No está implementado nada de esta lista.

### A. Correcciones que no necesitan una decisión nueva de Rafa

1. **G1. No cerrar el módulo compartido.** Objetivo: Salud no consume las preguntas de Mentalidad que viven en `e-aud-s2`, ni Mentalidad las de Relaciones en `e-aud-s3`. Comportamiento: el progreso de módulo no pasa a `COMPLETE` para preguntas de otro ámbito. Esas preguntas siguen disponibles al entrar por el otro foco o por el general. Archivos: `apps/api/src/diagnostic/diagnostic.service.ts`, `diagnostic-territory.ts`, tests de territorio. Riesgo: reabrir módulos ya marcados completos en cuentas de prueba. No migrar producción en silencio. Esfuerzo medio. Prueba: el caso de aceptación de G1, en dominio y en una sesión HTTP sobre base desechable. Criterio: el de la matriz.

2. **G13. Enlaces que prometen un resultado.** Objetivo: quitar o redirigir el fin del diagnóstico y el enlace de excepciones hacia una pantalla que diga lo que hay, sin inventar perfil. Archivos: `next.config.ts`, `DiagnosticPlayer.tsx`, `JourneyMatrix.tsx`, `TerritoryScreen.tsx`, `MemoryScreen.tsx`. Esfuerzo bajo. Prueba de componente del destino. Criterio: el de G13.

3. **G11, solo el documento, si Rafa no pide cambiar el motor.** Objetivo: `PRODUCTO_VIABLE.md` describe `progressFrom` y la cobertura incompleta como están en `engine.ts`. No es código de producto. Esfuerzo bajo.

4. **G10 en forma mínima.** Objetivo: poder contar, para cuentas de prueba, activación, primer registro, indicador y revisión aplicada. No hace falta un producto de analytics. Sirve una consulta repetible o un evento de servidor sobre escrituras que ya existen. Archivos alrededor de `activateDesign`, `POST /records`, `recordIndicator`, `applyInterventionWeekReview`. Esfuerzo bajo. Criterio: de una cuenta fixture se recuperan los cuatro hechos sin leer código.

5. **Expiración del access.** Objetivo: el JWT deja de vivir para siempre. El comentario de `auth.constants.ts` y el módulo JWT no ponen `expiresIn`. Esfuerzo medio. No bloquea un piloto interno. Criterio: un token viejo no llama a `/auth/me`. No es metodología.

G15, el texto legal exacto, necesita a negocio para la frase. El mecanismo de guardar un acepto sí lo puede preparar desarrollo cuando exista esa frase.

### B. Comportamiento ya bastante definido, mal o a medias conectado

Poco entra aquí. La flexibilidad, la separación ejecución y resultado, y el no modificar el plan solo ya están conectados.

Lo más cercano: **mostrar en la ficha del ámbito la misma lectura que Diseñar ya sabe construir**, citando pregunta y valor, sin conclusiones nuevas. El comportamiento de cita ya está en `buildReadings`. Falta el momento «ámbito completado» y la regla de no mostrarlo antes. Esa regla es la propuesta 3, todavía no confirmada. Por eso no se implementa en A. Si Rafa responde G3 a favor de «solo al completar», esta tarea pasa a B y usa textos que ya existen, sin redactar fortalezas nuevas.

### C. Bloqueado por metodología

- G2 y G8. Qué se puede decir de una fortaleza, una dificultad, un patrón y una oportunidad. Hacen falta ejemplos de Rafa sobre una respuesta real, no adjetivos.
- G3. Cuándo aparece la lectura.
- G4. Si una respuesta nueva sugiere un ajuste, qué puede decir, y si es inmediata o queda para la revisión.
- G5 y G6. Pesos y semillas.
- G7. Si el propósito pesa.
- G11. Si el criterio de un solo sí debe volver.
- G16. Si 300 minutos y 3 acciones se quedan.

Ninguna de estas se adelanta «para que el piloto se vea completo».

### D. Solo se sabe con usuarios

- Si el plan sin diagnóstico se entiende en una sesión.
- Si la sugerencia con motivo se usa o se ignora.
- Si la gente vuelve a la semana sin aviso.
- Si buscan un perfil aunque no se les prometa.
- Si pagarían. Eso no se pregunta como sustituto de un pago.

El diseño de esa prueba está en la auditoría de viabilidad, sección 9. No se duplica aquí. El piloto no empieza por el sitio mientras G9 siga abierto, y no estudia los dos recorridos en la misma sesión mientras G1 siga abierto.

### Secuencia

1. Corregir G1 y comprobarlo.
2. Cerrar con Rafa las preguntas del documento de reunión. Mientras tanto, no redactar el informe de ámbito ni cambiar pesos.
3. Ajustar la invitación del piloto a la frase que salga de esa reunión (G9).
4. Dejar los cuatro hechos observables (G10).
5. Recién ahí, sesiones de los dos recorridos en cuentas distintas, no en una sesión contaminada.
6. Con casos reales, Rafa firma, cambia o retira pesos, semillas y umbrales. No al revés.
