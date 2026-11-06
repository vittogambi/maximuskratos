# Producto viable, de principio a fin

27 oct 2026, con correcciones del 4 nov 2026. Describe el recorrido que una cuenta puede completar en local, sin inventar un índice ni esperar a que Rafa firme el método. No es la Matriz v2. No es la hoja de propósito. Es el ciclo que ya une una situación, un plan concreto, la semana y una revisión.

Referencias vigentes junto a este archivo: diseño en [DESIGN.md](DESIGN.md), ejecución de trabajo en [AGENTS.md](AGENTS.md), revisión que decide en [ENTREGA_REVISION_MEN_A1.md](ENTREGA_REVISION_MEN_A1.md). El prompt del 7 oct 2026 es antecedente, no instrucción actual.

Lo que aquí se llama viable es esto: una persona entra, elige un ámbito, puede responder o no el cuestionario, elige un plan que entiende, lo ajusta a su semana, lo activa a propósito, registra si hizo la acción y, aparte, responde un indicador de resultado. Cuando llega la fecha, el producto propone qué hacer con la estrategia y ella decide. Nada de eso se aplica solo.

## 1. El ciclo

Hay cuatro ámbitos: Mentalidad, Finanzas, Relaciones y Salud física. Cada uno se recorre con las mismas tres fases.

| Fase | Pregunta | Dónde |
|---|---|---|
| Descubre | ¿Qué hay ya dicho en este ámbito? | `/ambito/[territorio]?fase=descubre` y el cuestionario |
| Diseña | ¿Con qué plan voy a probar? | `/disenar` |
| Actúa | ¿Qué hice y qué pasó? | `/semana` |

No hace falta cerrar los cuatro ámbitos ni terminar el cuestionario para tener un plan. Un solo ámbito puede ser la experiencia completa. El panel muestra los cuatro para que se vea el mapa, no para cobrar una deuda de preguntas.

El orden no está fijo. Se puede diseñar sin haber respondido nada. Se puede responder y volver después. Se puede tener un plan activo y seguir contestando. Lo que no ocurre es que una respuesta cambie el plan sola.

## 2. Entrada

La cuenta entra por `/login` o se crea en `/register`. Después del acceso cae en `/panel`. No hay una puerta que obligue a completar el formulario antes de ver el recorrido.

En escritorio el menú izquierdo tiene Inicio, Semana, Diseñar, Planes, Propósito, Memoria y Cuenta. En el teléfono la barra inferior tiene Inicio, Semana y Planes. Diseñar, Propósito, Memoria y Cuenta están en Más.

Propósito (`/proposito`) es **Mi dirección**: texto editable, cambio deseado y tres modos (claro, explorar, aún no lo sé). Cada guardado crea una versión en `PurposeRevision`; los planes guardan la revisión vigente al activarse. Con una dirección guardada, la pantalla muestra su estado, de dónde salió, los planes vinculados y las versiones anteriores. `/proposito/respuestas` muestra Visión, Valores e IKIGAI del cuestionario tal como se respondieron y el cruce IKIGAI que hace la persona. La exploración guiada no compone frases: muestra lo escrito y, como mucho, pone dos respuestas de la persona lado a lado para que diga si se relacionan. Detalle en [docs/product/PROPOSITO.md](docs/product/PROPOSITO.md). La firma de la hoja de ruta completa sigue fuera del recorrido. Memoria muestra historial de dirección y aprendizajes.

## 3. Inicio

`/panel` se llama «Tu recorrido». Primero hay una sola tarjeta de siguiente paso. Después, la matriz de cuatro filas por tres fases. El cumplimiento de la semana, cuando se muestra, va dentro de Actúa. No es una cuarta columna.

La tarjeta no inventa una prioridad entre ámbitos. Mira, en este orden, si hay algo concreto que hacer:

1. Si la persona lleva siete días o más fuera y hay una lectura de retorno, la tarjeta propone ver la semana.
2. Si el plan en foco está activo o en mantenimiento y a la semana le faltan registros, propone revisar esa semana.
3. Si el foco está en pausa, abre ese plan.
4. Si el foco está activo o en mantenimiento, dice la próxima ocasión, o cuántas quedan, y abre la semana. El día lo elige la persona.
5. Si no hay foco, repite esa lógica con cualquier plan activo, en mantenimiento, en pausa o en preparación.
6. Si todo está cerrado, ofrece ver el cierre.
7. Si los cuatro ámbitos están explorados y no hay plan, pide elegir un ámbito en la matriz.
8. Si no hay nada de eso, dice que se puede explorar un ámbito o preparar un plan, sin un orden obligatorio.

Debajo hay un enlace a `/diagnostico?alcance=general` para quien no sabe qué quiere cambiar. Eso abre el cuestionario general. No crea un plan.

### La matriz

Cada fila es un ámbito. Las columnas son Descubre, Diseña y Actúa.

Descubre muestra Sin empezar, En curso o Explorado, y «N de M preguntas completadas». Explorado significa que las preguntas de ese ámbito en el catálogo activo están respondidas o con excepción. No es un puntaje. No es un estado de la Matriz v2. Si hay excepciones, hay un enlace para verlas.

Diseña dice Sin plan, En preparación, Activo, En pausa, En mantenimiento o Cerrado. Sin plan abre Diseñar con ese ámbito. Un borrador abre ese borrador. Un plan ya creado abre su ficha.

Actúa, si el plan está activo o en mantenimiento, abre la semana de ese plan. Si está en pausa o cerrado, abre la ficha. Si todavía no hay plan, no hay acción.

Actúa puede mostrar el estado de las ocasiones de la semana (pendientes, hechas o registros faltantes) y textos como «En curso» o «Registros incompletos». Eso es ejecución de la semana. No es otra fase ni un índice de alineación. No mide si el resultado mejoró. Eso va en el indicador del plan, más abajo. El payload puede traer un porcentaje. La matriz no lo pinta como columna.

La matriz es una tabla. En móvil se desplaza en horizontal dentro de su contenedor: los nombres de los ámbitos quedan visibles y la cabecera se mueve con las filas. En escritorio se muestra el cruce completo cuando hay espacio. La página sigue con su scroll vertical. No se sustituye por tarjetas independientes ni por acordeones.

## 4. Descubre

Desde la matriz, o desde el ámbito, Descubre abre el player del cuestionario de ese ámbito. También se puede entrar al cuestionario general.

El catálogo activo en local es `formulario-completo@6`. El corte por ámbito, el que usa la cobertura, es este:

| Ámbito | Qué cuenta como sus preguntas |
|---|---|
| Mentalidad | Identidad y las escalas de auditoría de evitación, hábitos, planificación, entorno, corrección y orgullo del camino. El perfil de propósito queda fuera de la matriz. |
| Salud física | Radiografía `F-RAD-001`, más entrenamiento, alimentación y sueño de la auditoría. |
| Relaciones | Radiografía `F-RAD-002`, la escala corta de calidad de relaciones y la pregunta del entorno que sube o baja el estándar. |
| Finanzas | Radiografía `F-RAD-003` y la escala corta de soberanía financiera. |

Responder no calcula un índice y no diagnostica personalidad. Guarda la respuesta, con revisión. Si la persona marca que no sabe, que no aplica o que no quiere responder, eso queda como excepción. Una excepción no se lee como un «sí» ni como un «no».

En la ficha del ámbito, Descubre puede mostrar hasta seis líneas de síntesis de lo ya respondido, marcadas como lectura parcial cuando corresponde. Si no hay nada usable, lo dice. Desde ahí se sigue el cuestionario o se pasa a Diseñar.

No hace falta explorar el ámbito para diseñar. La cobertura solo dice cuánto hay respondido. En Diseñar, la elección de ámbito muestra esa cobertura en una línea: sin empezar, en curso o explorado.

## 5. Diseñar

En Mentalidad, Finanzas, Relaciones y Salud física, `/disenar` empieza por el cambio de la persona, no por el catálogo. Hay un solo recorrido para todos los planes, con plantilla o propios. El contrato completo, las validaciones y los límites están en [DISENA_REDISENO.md](DISENA_REDISENO.md).

Cinco pasos:

1. **Tu cambio**: qué quiero cambiar, tipo de cambio opcional y por qué importa, también opcional. Si existen, aparecen plegados: la dirección (vínculo opcional), las lecturas de Descubre (se reconocen ahí y solo cuentan si se eligen) y lo ya probado en el ámbito. Continuar crea el borrador en el servidor.
2. **Resultado**: un resultado con su criterio y evidencia opcional, o una exploración con lo que se quiere saber. También la fecha de revisión en semanas.
3. **Estrategia**: hasta tres sugerencias, cada una con el dato que la sostiene. Además, el catálogo completo y una estrategia propia con seis formas de trabajo.
4. **Plan de acción**: acciones editables sembradas por la estrategia. Se pueden agregar, quitar y reordenar. Cada acción va cada semana o una vez en una semana del ciclo, con cuándo y dónde, criterio de hecho, versión mínima y marcas de contenido. Aquí también van los obstáculos (si pasa esto, haré aquello), los recursos, lo que hay que cuidar y la confirmación de que la carga cabe.
5. **Revisar y activar**: ficha completa con edición por sección, lo que falta, las aclaraciones de salud o conversación y la confirmación explícita.

`DesignStudio` elige el ámbito y monta `PlanDesignFlow`. `camino=OWN` ya no es otro formulario: la estrategia propia es una opción del paso 3.

### 5.1 Plan del catálogo

En el paso 3 el catálogo es la estrategia, no la puerta de entrada. Cada tarjeta dice qué busca, qué propone, qué pregunta hace cada semana y a cuántas semanas suele revisarse. Elegir una no activa nada: siembra su acción en el paso 4, donde se puede editar.

Si la plantilla pide una línea (el hábito, la comida, la hora, el monto, la persona, la decisión), ese campo se rellena con el cambio escrito en el paso 1 y la etapa con el criterio del paso 2. La persona los ajusta. No sale de una interpretación.

Sin respuestas ni tipo de cambio elegido, el paso 3 dice que todavía no hay datos para recomendar una en particular y abre el catálogo completo. La cuenta `sim.mentalidad.vacia` sirve para probarlo.

### 5.2 Lo que ya respondiste (Descubre)

Ya no hay un camino aparte «Usar mis respuestas». Las lecturas aparecen en el paso 1, plegadas bajo «Desde tus respuestas», solo si el ámbito tiene respuestas que las abren. Cada lectura muestra, en literal:

- la pregunta y lo que se marcó, por ejemplo «marcaste 2 de 5»;
- una frase corta de interpretación;
- la pregunta «¿Te representa hoy?», o «¿Esto ocurre actualmente?» cuando la fuente fue un «Más o menos».

Hay tres respuestas: Me representa, En parte (se guarda como parcial) y No me representa. Con las dos primeras aparece la casilla «Quiero tenerlo en cuenta en este plan». Solo las lecturas marcadas ahí entran al plan (`contextReadingIds`). Si el cambio estaba vacío, marcarla propone como texto el tipo de cambio de esa lectura, que la persona reescribe. «No me representa» aparta la lectura hasta que cambien las respuestas que la sostienen.

Las lecturas no tienen orden de prioridad y no se filtran por meta en pantalla. Una lectura elegida y reconocida suma a las plantillas que declara en las sugerencias del paso 3, con el motivo visible. Al activar se vuelven a leer: si una respuesta cambió y la firma caducó, esa lectura deja de orientar el plan.

Escalas de 1 a 5: 1 y 2 son candidatas, 3 queda en el medio y no abre lectura, 4 y 5 se tratan como recurso y no abren lectura. En dificultades de sí / más o menos / no, el «sí» abre lectura, el «más o menos» pregunta si ocurre ahora, y el «no» no se usa. Una excepción no se convierte en señal.

Las notas internas del evaluador no se muestran. No se usan arquetipos, personalidad ni la Matriz v2. R8 y R19 de Mentalidad respondidas con etiquetas genéricas, antes del catálogo `@6`, no se leen.

### 5.3 Plan propio

La persona elige una forma de trabajo en el paso 3 y escribe sus acciones en el paso 4. El texto se conserva y no se reemplaza por una plantilla. Pasa por la misma carga, el mismo cuidado y la misma activación que un plan del catálogo. El seguimiento de la semana registra cada acción. No lleva indicador versionado: el resultado se revisa con el criterio propio del paso 2.

## 6. Cómo se arma una lectura, paso a paso

Esta sección es el mecanismo. Las tablas de más abajo son el contenido que ese mecanismo usa.

### 6.1 De dónde sale el número

Cada respuesta guardada tiene un `sourceRef` (`formulario-v1:E-AUD-001!R26`), un valor, una revisión, la versión del catálogo y, si existe, una excepción (no sé, no aplica, no quiero responder).

El motor del ámbito busca solo las filas que declaró. Si la fila no está, no inventa un valor medio. Si hay excepción, la deja fuera y anota el motivo. Si el valor no es un entero de 1 a 5 en una escala, también la deja fuera.

En una escala, 1 y 2 son candidatas, 3 es intermedio, 4 y 5 son recurso. Solo la banda candidata puede abrir una lectura. El 3 no se promociona a problema ni a fortaleza. El 4 y el 5 no se usan para proponer un plan de carencia.

En una dificultad del perfil, el valor `2` es sí, `1` es más o menos, `0` es no. El sí entra como candidato. El más o menos no abre la lectura por sí solo: si la lectura no tiene ninguna escala candidata ni ningún sí, y solo tiene más o menos, el estado pasa a «por confirmar» y la pregunta cambia a «¿Esto ocurre actualmente?». El no se guarda, pero no orienta.

Una elección suelta, como la indicación médica de salud, no es una escala. Solo cuenta si el valor está en la lista que el ámbito declaró. En salud, «Sí» a «¿Has recibido indicaciones médicas de evitar ciertos esfuerzos?» no crea una lectura. Solo puede sugerir la versión mínima.

### 6.2 Cómo se junta una lectura

Cada lectura declara qué escalas y qué dificultades la sostienen. Aparece si al menos una de esas fuentes está en banda candidata, o es un sí, o es un más o menos que queda por confirmar.

El texto que ve la persona no resume el puntaje. Cita la pregunta y el número: «En «¿Planifico mi semana o, en su mayoría, solo reacciono a ella?» marcaste 2 de 5.» Si la fuente es una dificultad: «A «…» respondiste «Sí».» o «Más o menos». Debajo va una frase de interpretación, corta, y la pregunta de reconocimiento.

Si varias fuentes de la misma lectura están bajas, se citan todas las que se usaron. Las que están en 3, 4 o 5 no se citan dentro de esa lectura, porque no la sostienen.

La lectura de coherencia de Mentalidad es la única que exige además un texto de visión (perfil, fila 33, no la escala R30 de la auditoría). Sin esa frase, R6 o R30 bajos no producen la lectura. La frase se muestra entre comillas. No se reescribe.

### 6.3 Reconocimiento

Tres botones, y solo esos:

| Respuesta | Efecto |
|---|---|
| Me representa | La lectura puede orientar un plan. |
| Me representa parcialmente | Igual. En el resumen de activación se dice «te representa parcialmente». |
| No me representa | La lectura sale de la lista. No orienta planes mientras esas respuestas no cambien. |

«Quiero tenerlo en cuenta en este plan» aparece solo después de las dos primeras.

El reconocimiento se guarda con la firma de las fuentes: referencia, versión del catálogo y revisión de cada respuesta, ordenadas. Si la persona cambia una de esas respuestas, la firma ya no coincide, el reconocimiento caduca y la lectura vuelve a preguntar. No se arrastra un «me representa» de hace un mes sobre números nuevos.

Se muestran todas las lecturas que no fueron rechazadas, sin orden de prioridad. El 1 no pasa delante del 2 por ser más grave. En el paso 3 las sugerencias se ordenan por lecturas elegidas, después por tipo de cambio y después por el orden del catálogo, nunca por gravedad.

> Histórico. El filtro por meta con un máximo de dos lecturas (`GET /:territory?meta=`) sigue en la API, pero la pantalla de Diseñar ya no lo usa.

### 6.4 Qué se guarda al crear el borrador

El borrador se crea al continuar el paso 1 (`POST /journey/intervention/:territory/designs`), antes de elegir estrategia. Guarda el cambio como título del plan, el motivo, el vínculo opcional con la dirección (`purposeRevisionId`, `linkKind`), el tipo de cambio (`design.goal`) y las lecturas elegidas. Cada paso siguiente escribe su sección con `PATCH .../plans/:planId/design`: resultado y ciclo, estrategia, acciones. El contrato completo está en [DISENA_REDISENO.md](DISENA_REDISENO.md).

Elegir una plantilla en el paso 3 no activa nada. Guarda la plantilla en la propuesta (`templateId`, `templateSnapshot`), siembra su acción y marca el plan como orientado si una lectura elegida declara esa plantilla. La fecha de revisión se calcula al activar: hoy más el ciclo del paso 2.

Repetir la misma orden no crea un segundo borrador: `POST /designs` usa `commandKey`.

Un plan orientado solo acepta lecturas que la persona reconoció y que esa plantilla declara. No se puede colgar MEN-C1 de una lectura de deudas.

> Histórico. Antes, el borrador se creaba al pulsar «Continuar con este plan» sobre una tarjeta (`POST /:territory/plans`), con el título de la plantilla y el foco. Esa ruta sigue para clientes anteriores y los borradores que dejó se leen como diseño al abrirlos.

## 7. Catálogo completo

Cada ficha de abajo es lo que la persona puede leer en la tarjeta de la plantilla y en la semana. Donde una ficha dice «paso 2» o «paso 3», es la numeración histórica de la activación anterior: en el flujo vigente la carga es el paso 4 y activar el paso 5. La acción y la carga de la ficha son lo que la plantilla siembra en el paso 4. No quedan aceptadas hasta que la persona confirma que caben.

Horizonte inicial de la plantilla: entre 2 y 4 semanas. En el paso 2 se puede dejar en 1, 2, 3, 4, 5, 6 u 8. La fecha es «dentro de N semanas», no un día de la semana fijo.

### 7.1 Mentalidad, `intervencion-mentalidad@0.1`

Preguntas de escala que el motor sabe leer. 1 es la dificultad y 5 el recurso.

| Clave | Pregunta que se cita |
|---|---|
| R6 | ¿Mis decisiones diarias reflejan al hombre que digo que quiero llegar a ser? |
| R7 | Cuando siento presión o una emoción intensa, ¿puedo reconocer lo que siento y elegir una respuesta coherente con mis principios? |
| R8 | ¿Qué tan seguido uso excusas que suenan razonables, pero no lo son? Si la respuesta es anterior al catálogo `@6`, no se usa: esas etiquetas eran genéricas. |
| R9 | ¿Confío en mí mismo para terminar lo que empiezo? |
| R19 | Frecuencia de usar comida, alcohol, sexo, compras, pantallas o entretenimiento para evitar algo. Misma regla de etiquetas que R8. |
| R20 | ¿Mis hábitos me están haciendo avanzar con claridad o drenando mi energía? |
| R26 | ¿Planifico mi semana o, en su mayoría, solo reacciono a ella? |
| R27 | ¿Mi entorno está configurado para apoyar la disciplina o la comodidad? No abre una lectura propia. Si está en 1 o 2, ofrece un cambio de entorno opcional. |
| R29 | Cuando me desvío del rumbo, ¿qué tan rápido corrijo el curso? |
| R30 | Si siguiera viviendo de esta manera durante un año más, ¿me sentiría orgulloso del lugar al que me lleva? |

Dificultades del perfil. Sí, más o menos, no.

| Clave | Afirmación | Uso |
|---|---|---|
| PR4, fila 98 | Abandono los proyectos o metas justo cuando estoy a punto de consolidarlos. | Lectura sostener, si es sí. |
| PR5, fila 99 | Siempre encuentro una distracción de última hora que me aleja de mis tareas clave. | Lectura distracción. |
| ER3, fila 109 | Prefiero explotar en silencio antes que mostrar incomodidad ante los demás. | Lectura contención. |
| D1, fila 133 | Justifico mi falta de acción diciendo que no tengo tiempo. | No abre lectura. Si es sí, sugiere la mínima. |
| D2, fila 134 | Pospongo decisiones esperando el momento perfecto. | Lectura postergación. |
| D3, fila 135 | Lleno la agenda de tareas secundarias para no enfrentar lo importante. | Lectura desplazamiento. |
| D4, fila 137 | Creo que necesito otra certificación, maestría o más dinero antes de empezar. | Lectura postergación. |
| D6, fila 139 | Siento que mis ideas no son lo suficientemente buenas y por eso no las ejecuto. | Lectura postergación. |
| IN3, fila 148 | Reservo tiempo innegociable para descanso y desarrollo. | No abre lectura. Si es no, sugiere la mínima. |

Visión: texto libre del perfil, fila 33. Solo entra en coherencia.

Metas del desplegable: organizar mejor mi semana, avanzar algo que estoy postergando, sostener lo que empiezo, cambiar un hábito, responder mejor bajo presión, acercar mis decisiones a mi visión.

**MEN-A1. Una semana con tus prioridades.** Busca que al final de la semana hayan avanzado las prioridades que la persona eligió. Acción: una vez por semana, 20 minutos, elegir tres prioridades y ponerle a cada una un momento. Hecho cuando quedaron escritas, cada una con su momento. Indicador de resultado: «¿Cuántas de tus tres prioridades avanzaron esta semana?», un entero de 0 a 3. Subir es avance. Horizonte inicial: 3 semanas. Mínima: una sola prioridad, 10 minutos, y el indicador pasa a «¿Avanzó tu prioridad de esta semana?», sí o no. Lecturas: planificación y desplazamiento.

**MEN-A2. Proteger un bloque para lo importante.** Busca un tiempo semanal que no ocupe lo urgente. Acción: dos bloques de 45 minutos, sin las interrupciones que se puedan evitar. Hecho cuando el bloque ocurrió y se sabe en qué se usó. Indicador: texto, «¿Qué entregable, decisión o avance permitieron tus bloques esta semana?». Los bloques marcados hechos son la ejecución. El avance se escribe aparte. Horizonte: 3 semanas. Mínima: un bloque de 25 minutos. Nota visible: los bloques hechos muestran la ejecución. El avance se anota aparte.

**MEN-B1. Avanzar lo que estás postergando.** Pide dos líneas antes de seguir: qué decisión o proyecto, y qué tendría que existir para decir que pasó a la siguiente etapa. La segunda la define la persona. Si todavía falta información para decidir, puede decirlo así. Acción: dos veces por semana, 25 minutos, una versión imperfecta (borrador, llamada o dato). Hecho cuando existe algo que antes no existía. Indicador: «¿Pasó a la etapa que definiste?», sí o no. Horizonte: 2 semanas. Mínima: escribir el siguiente paso, 10 minutos. Lectura: postergación.

**MEN-B2. Preparar una decisión postergada.** Pide qué decisión y qué significaría resolverla. Acción: una vez, 30 minutos, anotar qué información falta, cómo conseguirla y cuándo volver a mirarla. Hecho cuando eso quedó escrito. Indicador de elección: «La resolví», «Todavía falta información relevante» o «Sigue pendiente». Solo «La resolví» cuenta como avance en la revisión. Las otras dos no se leen como fracaso. Horizonte: 3 semanas. Mínima: anotar solo el dato que falta, 15 minutos. Nota: no hace falta decidir si todavía falta información relevante.

**MEN-C1. Una promesa pequeña cumplida.** Busca volver a contar con uno mismo para terminar lo que se empieza. Acción: cinco veces por semana, 10 minutos, un compromiso pequeño que la persona elige al hacerlo. Hecho cuando se hizo ese día, completo aunque sea pequeño. Resultado: «¿Terminaste esta semana algo que empezaste?», sí o no. Percepción, opcional: «Esta semana, ¿cuánto confiaste en terminar lo que empiezas?», de 1 a 5. La percepción no decide la propuesta de revisión. Horizonte: 4 semanas. Mínima: tres compromisos de 5 minutos. Lecturas: sostener, y también puede salir junto a retomar.

**MEN-C2. Retomar después de una interrupción.** No tiene ocasiones fijas. El disparador es «cuando se interrumpe tu rutina». Ese día, 10 minutos, la versión mínima. Hecho cuando, después del corte, se hizo esa versión. Indicador: «Si esta semana hubo una interrupción, ¿cuántos días pasaron hasta retomar?», de 0 a 14. Bajar es avance. Si no hubo interrupción, se marca «No hubo interrupción» y esa semana no es incumplimiento. Horizonte: 4 semanas. Mínima: solo anotar cuándo se va a retomar, 5 minutos. En la revisión, la ejecución de un plan por disparador no se juzga como si faltaran días del calendario.

**MEN-D1. Cambiar el entorno de un hábito.** Pide nombrar el hábito. Busca usarlo menos. Acción: tres veces por semana, 5 minutos, un cambio de entorno concreto y una alternativa preparada. Hecho cuando el cambio siguió puesto ese día. Resultado: «¿Cuántas veces usaste ese hábito esta semana?», de 0 a 99. Bajar respecto de la primera respuesta es avance. La primera respuesta es solo el punto de partida, no se compara con R19 ni con R20. Percepción: «Esta semana, ¿cómo estuvo tu energía?», de 1 a 5. La nota dice que la energía tiene muchas causas y no se atribuye a ese hábito. Horizonte: 3 semanas. Mínima: un cambio de entorno, revisado una vez. Lecturas: distracción, evitación y energía.

**MEN-E1. Una pausa antes de responder.** Acción: cuatro veces por semana, 5 minutos, anotar una situación, lo que se sintió y la respuesta que se eligió. Puede ser después y en privado. No hace falta hablar con nadie. Hecho cuando quedó anotado eso. Resultado: «Esta semana, ¿en cuántas situaciones difíciles pudiste elegir cómo responder?», de 0 a 30. Percepción: calma al responder, de 1 a 5. Horizonte: 4 semanas. Mínima: dos registros de 3 minutos. Nota: si aparece un malestar intenso, buscar ayuda. Esto no es una terapia. Lecturas: respuesta y contención.

**MEN-F1. Una decisión hacia tu visión.** Acción: cinco veces por semana, 5 minutos, elegir una decisión para el día siguiente que vaya hacia la visión y, al día siguiente, anotar qué cambió. Hecho cuando se hizo la decisión. Anotarla no basta. Resultado en texto: «¿Qué cambio concreto hiciste esta semana que va hacia tu visión?». Si hay texto, la revisión lo toma como avance. Percepción: «¿cuánto se parecieron tus decisiones a tu visión?», de 1 a 5. Horizonte: 4 semanas. Mínima: dos decisiones. Lectura: coherencia, y solo si la visión sigue escrita.

Sugerencias de Mentalidad, ninguna automática:

- D1 sí, o IN3 no: «Señalaste que el tiempo es escaso. Puedes empezar con la versión mínima; decides tú.»
- R27 en 1 o 2: casilla opcional, «Si quieres, puedes sumar un cambio de entorno, por ejemplo dejar el teléfono fuera del lugar donde trabajas.»

### 7.2 Finanzas, `intervencion-finanzas@0.1`

Escalas. En la radiografía, 1 es nunca y 5 es siempre. En la auditoría, 1 es la dificultad y 5 el recurso. El motor trata igual el 1 y el 2.

| Clave | Pregunta que se cita | Lectura |
|---|---|---|
| Auditoría R40 | ¿En qué medida tus ingresos cubren tus necesidades, obligaciones y objetivos? | Margen |
| Radiografía R7 | Los ingresos estables que generas, ¿cubren tus costos y te dejan un margen? | Margen. Si está en 1 o 2, también sugiere la mínima. |
| Radiografía R8 | ¿Vives libre de la sensación de asfixia financiera o de llegar justo a fin de mes? | Margen. Igual, puede sugerir la mínima. |
| Radiografía R9 | ¿Tus ingresos vienen de estructuras predecibles, sin ansiedad constante por la supervivencia? | Margen |
| Auditoría R38 | ¿Qué tan constante es tu capacidad de separar una parte de tus ingresos? | Ahorro |
| Radiografía R17 | ¿Ahorras de forma sistemática antes de otros gastos? | Ahorro |
| Radiografía R18 | ¿Tienes un fondo de emergencia líquido de varios meses de costos? | Ahorro |
| Radiografía R19 | ¿Tus hábitos de consumo están controlados, sin compras impulsivas ni usar el dinero para calmarte? | Gastos. Pide qué tipo de gasto mirar. |
| Auditoría R37 | ¿En qué medida tus deudas actuales están bajo control y no comprometen tu estabilidad? | Deudas |
| Radiografía R35 | ¿Estás libre de deudas de consumo de alto interés? | Deudas |
| Auditoría R39 | ¿Cuentas con un presupuesto escrito o un plan para tus finanzas? | Presupuesto |

No entran al motor las filas de inversión de la radiografía (poner dinero en depósitos, fondos, acciones o bienes raíces, educarse en instrumentos, diversificar). Tampoco la fila de cobrar honorarios. No hay un plan que diga en qué invertir ni qué deuda pagar primero.

Metas: que el mes deje margen, apartar antes de gastar, ver en qué se va el dinero, tener claras las deudas, escribir un plan simple.

**FIN-A1. Ver qué queda en el mes.** Una vez por semana, 25 minutos: anotar ingresos del período, costos fijos y lo que queda. Hecho aunque el margen sea cero, si los tres números quedaron escritos. Indicador: «¿Los ingresos de este período cubrieron los costos fijos?», sí o no. Horizonte: 3 semanas. Mínima: anotar solo los costos fijos, 10 minutos. Nota: no propone un producto ni una inversión. El número lo mira la persona. Lecturas: margen y también puede ofrecerse desde deudas o presupuesto.

**FIN-B1. Apartar antes de gastar.** Pide qué monto y para qué. Una vez por semana, 10 minutos, apartar ese monto antes de otros gastos. Hecho cuando quedó separado del dinero del día a día. Indicador: «¿Apartaste esta semana el monto que definiste, antes de otros gastos?», sí o no. Horizonte: 4 semanas. Mínima: apartar una sola vez, aunque el monto sea menor. No hay un porcentaje obligatorio. Lecturas: margen y ahorro.

**FIN-C1. Registrar lo que no estaba decidido.** Pide qué tipo de gasto mirar. Cinco veces por semana, 5 minutos: cuando aparezca un gasto no previsto, anotar qué fue y cuánto, el mismo día. Indicador: «¿Cuántos gastos no previstos anotaste esta semana?», de 0 a 30. Ese número no se lee como «menos es mejor» en la revisión automática: la dirección está en ninguna. La nota dice que anotar no es un juicio y que la primera semana solo deja ver el número. Horizonte: 3 semanas. Mínima: tres días. Lectura: gastos, y también el presupuesto.

**FIN-D1. El próximo pago, por escrito.** Una vez, 30 minutos: cada deuda conocida, el próximo vencimiento y si el pago está al día. Hecho cuando quedó escrito qué se paga, cuándo y si está al día. Indicador: «¿Sabes cuál es el próximo pago y de qué deuda es?», sí o no. Horizonte: 3 semanas. Mínima: solo la deuda del próximo vencimiento, 15 minutos. Nota: no dice cuál pagar primero ni recomienda un crédito. Lectura: deudas.

**FIN-E1. Un presupuesto de una página.** Una vez por semana, 20 minutos: lo fijo, lo variable y lo que se aparta. Hecho cuando la página existe y se miró antes de un gasto de esa semana. Indicador: «¿Usaste ese presupuesto al decidir un gasto esta semana?», sí o no. Horizonte: 3 semanas. Mínima: tres líneas. Lecturas: ahorro, gastos y presupuesto.

### 7.3 Relaciones, `intervencion-relaciones@0.1`

Todas las escalas de abajo abren lectura en 1 o 2. No hay dificultades de perfil en este contrato.

Pareja, lectura `pareja`: auditoría «¿Qué tan sólida y de apoyo es tu relación de pareja, o tu preparación para tener una?», y de la radiografía el apoyo a lo que se quiere construir, el espacio para decir cansancio o miedo, y si la carga diaria se siente equilibrada. Pide con quién.

Familia, lectura `familia`: vínculo y presencia, límites con la familia de origen, si las interacciones aportan paz, y si la persona se siente libre de resolver la vida de otros a costa de la suya. Pide con quién y sobre qué.

Círculo, lectura `circulo`: si las amistades impulsan, si las personas del tiempo libre estimulan, si se puede estar sin fachada, si el entorno está libre de la queja, y si las personas alrededor suben o bajan el estándar (auditoría R28). Pide qué encuentro cambiar.

Trabajo, lectura `trabajo`: lugar en el trabajo o la comunidad, respeto y colaboración, red a la que recurrir, y si un conflicto laboral desordena por días. Pide qué situación.

Metas: cuidar la relación de pareja, ordenar un vínculo familiar, elegir mejor con quién estoy, tratar una situación de trabajo.

**REL-A1. Una conversación que tú defines.** Pide con quién y de qué. Una vez, 30 minutos: preparar qué decir y tener la conversación, o dejar escrita la fecha si hoy no se puede. Hecho en cualquiera de los dos casos. Indicador: «¿Tuviste la conversación que definiste?», sí o no. Horizonte: 2 semanas. Mínima: escribir qué se quiere decir, 10 minutos, aunque la conversación sea otro día. Nota en todos los planes de este ámbito: no indica terminar una relación ni cómo debe responder la otra persona.

**REL-A2. Un tiempo protegido.** Pide con quién. Dos momentos de 45 minutos en la semana, sin pantallas si se puede. Hecho cuando el momento ocurrió y se sabe en qué se usó. Indicador: «¿Cuántos de esos momentos ocurrieron esta semana?», de 0 a 7. Subir es avance. Horizonte: 3 semanas. Mínima: un momento de 20 minutos.

**REL-B1. Un límite dicho una vez.** Pide con quién y sobre qué. Una vez, 20 minutos: escribir el límite en una frase y decirlo una vez. Hecho si se dijo, o si quedó la fecha para decirlo. Indicador: «¿Dijiste el límite que definiste?», sí o no. Horizonte: 3 semanas. Mínima: escribir la frase, 10 minutos. Nota extra: un límite no es un ultimátum.

**REL-C1. Con quién pasas un momento.** Pide qué encuentro cambiar. Una vez, 15 minutos: nombrar un encuentro que resta y uno que suma, y cambiar uno de los dos esta semana. Hecho si se hizo el cambio o si quedó anotado qué se interpuso. Indicador: «¿Hiciste el cambio de encuentro que definiste?», sí o no. Horizonte: 3 semanas. Mínima: solo nombrar los dos, 10 minutos. Nota: no pide dejar de ver a alguien para siempre.

**REL-D1. Una situación de trabajo, preparada.** Pide la situación. Una vez, 25 minutos: anotar la situación, lo que se quiere pedir, y tener la conversación o dejar la fecha. Indicador: «¿Tuviste la conversación de trabajo que definiste?», sí o no. Horizonte: 3 semanas. Mínima: el pedido en tres líneas, 10 minutos.

Este ámbito no sugiere mínima por otra respuesta. No hay casilla de entorno.

### 7.4 Salud física, `intervencion-salud@0.1`

Solo tres lecturas, las tres escalas de hábito de la auditoría.

| Clave | Pregunta | Lectura |
|---|---|---|
| R16 | ¿Qué tan seguido realizas entrenamiento físico? | Entrenamiento, si está en 1 o 2. |
| R17 | ¿Qué tan constante has sido con la alimentación, de forma honesta? | Alimentación. Pide qué comida ordenar. |
| R18 | ¿Tu calidad de sueño está apoyando tu progreso o lo está frenando? | Sueño. Pide a qué hora acostarse. |

La radiografía del cuerpo se usa para una sola cosa: la fila 27, «¿Has recibido indicaciones médicas de evitar ciertos esfuerzos o actividades?». Si el valor es «Sí», el paso 2 dice: «Señalaste una indicación de evitar ciertos esfuerzos. Puedes empezar con la versión mínima y no contradecir esa indicación. Decides tú.» Si es «No», no aparece. Enfermedad, lesión, medicación, dolor, peso, sexo, suplementos y la meta de arquitectura física no abren plantilla y no se citan en una lectura.

Metas: entrenar con más constancia, ordenar una comida del día, cuidar la hora de dormir.

**SAL-A1. Sesiones en días que eliges.** Tres sesiones de 30 minutos de la actividad que la persona elige al hacerlas. Hecho cuando la sesión ocurrió, completa aunque sea corta. Indicador: «¿Cuántas sesiones hiciste esta semana?», de 0 a 7. Horizonte: 4 semanas. Mínima: dos sesiones de 20 minutos. Notas: si hay dolor o una indicación médica, se sigue esa indicación. No dice qué ejercicio ni con qué intensidad.

**SAL-B1. Una comida con estructura.** Pide qué comida y qué estructura. Cinco veces por semana, 10 minutos, respetar esa comida. Hecho cuando esa comida siguió la estructura escrita. Indicador: «¿Cuántos días respetaste esa comida?», de 0 a 7. Horizonte: 3 semanas. Mínima: tres días. Nota: no es una dieta ni una pauta nutricional.

**SAL-C1. Una hora para acostarte.** Pide la hora. Cinco noches, 10 minutos: a esa hora, dejar la pantalla y acostarse. Hecho si se cumplió la hora, o si quedó anotado qué lo impidió. Indicador: «¿Cuántas noches te acostaste a la hora que elegiste?», de 0 a 7. Horizonte: 3 semanas. Mínima: tres noches, 5 minutos. Nota: no es un tratamiento del sueño.

## 8. Plan de acción y activación, con las validaciones

La carga y la activación ocurren en los pasos 4 y 5. La lista completa de validaciones del servidor está en [DISENA_REDISENO.md](DISENA_REDISENO.md), sección 6. Lo esencial:

- Cada acción va cada semana (de 1 a 21 veces, de 1 a 600 minutos) o una vez en una semana del ciclo. Las acciones por disparador solo existen si las siembra una plantilla que funciona así (MEN-C2).
- Un plan admite hasta seis acciones. La carga se suma semana por semana: lo recurrente todas las semanas, lo de una vez solo en su semana. Más de 1680 minutos en una semana bloquea. Más de 300 o más de tres acciones muestra un aviso de plan exigente.
- Una acción sembrada por plantilla puede empezar con la carga mínima de esa plantilla. En MEN-A1 eso cambia el indicador a la pregunta de una sola prioridad.
- «Esto cabe en mi semana» y lo que hay que cuidar son obligatorios. «Por ahora no hay nada que cuidar.» vale como respuesta.
- Si se cambia el cambio o el resultado después de editar acciones, hay que confirmar que siguen sirviendo.

El paso 5 muestra la ficha por secciones, cada una con «Editar», y la lista de lo que falta. Pide las aclaraciones que correspondan: límite de salud si una acción declara esfuerzo, alimentación, suplementos o medicación; viabilidad de la conversación si declara una conversación difícil; la carga mínima frente a lo que hay que cuidar (`MINIMUM_PROTECT_CONFIRM`); qué dirección vincular si cambió desde el borrador. La casilla «Confirmo que quiero activar este plan.» habilita el botón.

Al activar se crea una `PlanAction` por acción, con su orden (`position`), su cuándo (`cue`), su versión mínima y sus marcas. Una tarea de una vez recibe una `ActionSchedule` válida solo en su semana. `activatedAt` y la fecha de revisión salen del reloj del recorrido (`JourneyClock`). Repetir la misma clave no duplica nada.

Pantalla de éxito: «El plan quedó activo.», con qué se empieza, cuántas ocasiones hay esta semana y el recordatorio de que hacer las acciones no cuenta solo como resultado. Dos enlaces: la semana de ese plan y la ficha.

> Histórico. Antes, la carga tenía tres botones («Sí, mantener», «Necesito reducirlo», «Quiero ajustarlo») sobre una sola acción de plantilla, y el plan propio activaba por `activatePlanDraft`. Esas rutas siguen en el servidor para planes anteriores.

## 9. La semana, ocasión por ocasión

La semana civil empieza el lunes y termina el domingo, en `America/Santiago`. Anterior, Hoy y Siguiente cambian el período. La URL puede traer `planId`. Si ese id no es de la cuenta, se dice y no se inventa la fila.

Un plan con «3 ocasiones por semana» no fija lunes, miércoles y viernes. La persona elige el día y marca. Mientras la semana está abierta, lo no marcado de días futuros no es un fallo. El cumplimiento del panel, en una semana abierta, dice «En curso» y no publica un porcentaje.

Cuando la semana ya se cerró, o cuando el domingo ya pasó, lo que no tiene registro pasa a «sin información». El panel entonces dice «Sin completar registros» y no calcula un porcentaje. Si hay una excepción o un «no aplica», tampoco hay porcentaje: «Hay excepciones. Sin porcentaje». El porcentaje solo sale cuando todo lo que contaba quedó en hecho o en no hecho, sin huecos. Hecho dividido entre (hecho + no hecho), redondeado. Omitir es no hecho. No aplica no entra en ese cociente.

En la fila del día, los estados que se pueden guardar son hecho, omitido, no aplica y pendiente. Hecho no acredita el resultado. Esa frase está en la fila. El criterio de hecho se lee debajo del título de la acción.

El bloque del indicador, debajo de las filas, solo se monta en la semana actual, y solo para planes activos de Mentalidad, Finanzas, Relaciones o Salud física. Si el plan es propio, o de otro origen, el bloque no aparece: la llamada no encuentra una plantilla y la pantalla sigue con las tareas.

Dentro del bloque:

- título de la plantilla;
- ejecución acumulada desde el día de activación: hechas, sin hacer, sin registro, sumando las semanas desde entonces, hasta doce;
- una caja por indicador, resultado primero y percepción después;
- si ya hay una primera medida, «Tu punto de partida: …». Si hay una posterior, «Última respuesta: …»;
- si esta semana ya tiene medida, «Ya respondiste esta semana. Si cambió, puedes actualizarlo.»;
- controles según el tipo: sí o no, 1 a 5, opciones con su etiqueta, un texto, o un entero;
- «Guardar respuesta».

La medida se guarda con la referencia del indicador, la semana (el lunes) y el día de hoy. Dos guardados con la misma clave de orden no crean dos filas. Una respuesta de otro indicador, o un número fuera de rango, se rechaza y el texto que la persona escribió sigue en la caja.

La lectura puede mostrar una propuesta con uno de estos textos. Esa propuesta no cambia el plan sola. La persona puede confirmar una decisión y aplicarla. El efecto vale desde la semana siguiente y no reescribe los registros ya cerrados. El recorrido vigente de esa confirmación está en [ENTREGA_REVISION_MEN_A1.md](ENTREGA_REVISION_MEN_A1.md).

| Código | Cuándo | Texto |
|---|---|---|
| KEEP | Ejecución suficiente y avance | Hiciste el plan y hubo avance. Puedes mantenerlo así; no hace falta subir la carga. |
| CHECK | Ejecución suficiente, sin avance | Hiciste el plan y todavía no se ve avance. Antes de cambiar la estrategia, revisemos si el plazo alcanza, si falta información y si el indicador mide lo que te importa. |
| LIGHTER_OK | Ejecución parcial o baja, con avance | Hubo avance aunque no hiciste todas las ocasiones. Puede que una carga menor te alcance. |
| EXPLORE | Ejecución parcial o baja, sin avance | Todavía no se ve avance. Revisemos tu capacidad, las oportunidades que tuviste, lo que se interpuso y la estrategia. Reducir la carga es una opción, no la única. |
| NO_RECORDS | No hay ejecución contable, o hay ocasiones sin registro | Si no hay nada resuelto: «Todavía no hay registros suficientes…». Si hay huecos: el porcentaje de lo registrado y cuántas ocasiones quedaron sin registro. |
| COMPATIBILITY | Reservado si aparece una restricción o un efecto no esperado | Apareció una restricción o un efecto que no esperabas. Revisemos si el plan sigue siendo compatible, sin esperar a la fecha de revisión. Hoy la semana no marca sola ese caso. El código existe. |

El código separa cumplimiento y cobertura. Eso está implementado en `executionFrom`, `executionStats` y `reviewProposal`. No es una regla firmada por Rafa.

Cumplimiento: hecho dividido por hecho + no hecho. Lo sin registro no entra en ese cociente. Cero resuelto es `NONE`. Un disparador de plantilla es `NOT_APPLICABLE` y la propuesta lo trata como ejecución suficiente, mirando el indicador. Desde 0,75 el nivel es `SUFFICIENT`. Desde 0,40 y por debajo de 0,75 es `PARTIAL`. Por debajo de 0,40 es `LOW`.

Cobertura: `NONE` si no hay nada resuelto, `COMPLETE` si no hay huecos, `INCOMPLETE` si hay hecho o no hecho y además ocasiones sin registro. Si la cobertura es `INCOMPLETE`, la propuesta es `NO_RECORDS` aunque el cociente de lo resuelto llegue a suficiente. El texto dice el porcentaje de lo registrado y cuántas ocasiones quedaron sin registro. No pasa a KEEP, CHECK, LIGHTER_OK ni EXPLORE hasta que la cobertura esté completa.

Qué cuenta como avance, solo con el indicador de resultado, nunca con la percepción. Tampoco está firmado por Rafa. El código hace esto:

| Tipo | Avance |
|---|---|
| Sí o no | Hacen falta dos respuestas utilizables. Si la última es sí y la primera no lo era, hay avance. Si las dos son sí, se mantiene. Una sola respuesta, aunque sea sí, queda desconocida, no avance. Un no final es sin avance. |
| Entero o escala 1 a 5 | Hacen falta al menos dos respuestas utilizables. Si la dirección es subir, la última tiene que ser mayor que la primera. Si es bajar, menor. Igual es sin avance. Una sola respuesta es desconocido, no avance. Si la última toca el máximo o el mínimo según la dirección y la primera también, se mantiene. |
| Texto | El código guarda conseguido, no conseguido o no se sabe. Conseguido con una sola medida es desconocido. Con dos, si la primera no estaba conseguida, hay avance. Si ambas lo están, se mantiene. No conseguido es sin avance. Un texto suelto, sin ese resultado, no cuenta como avance. |
| Elección | Solo el valor `RESUELTA` («La resolví» en MEN-B2), y hacen falta dos medidas para decir avance o que se mantiene. El resto queda desconocido, no sin avance. |
| No aplica | Esa fila no entra en la serie. |

La primera medida usable es la línea de base. No se resta el 2 que la persona marcó en el cuestionario.

`/semana/revision` monta `WeekReviewScreen`. En un plan de los cuatro ámbitos muestra, en este orden:

1. **Qué ocurrió**: la ejecución acumulada y, acción por acción, lo previsto y lo registrado en la semana revisada. Una tarea de una vez dice si se hizo, si se marcó como no hecha o si quedó sin registro. Sin registro no se presenta como hecha ni como no hecha.
2. **Resultado**: el indicador de la plantilla, si lo hay, y la comprobación del resultado propio o, en un plan exploratorio, lo aprendido.
3. **Qué conviene hacer**: la propuesta (los códigos de la tabla de arriba). Desde la fecha de revisión pregunta si el resultado sigue importando y ofrece cerrar con lo aprendido.
4. **Tus acciones desde la semana siguiente**: una tarjeta por acción con «Se mantiene» por defecto. «Ajustar esta acción» abre las opciones: mantener, aligerar, cambiar (descripción, criterio, cuándo, frecuencia, duración, cada semana o una vez), reprogramar una tarea de una vez, reemplazarla por otra o retirarla con un motivo. También se puede agregar una acción. Antes de la fecha de revisión este panel está plegado, salvo que haya una tarea sin hacer que espera decisión.
5. **Lo que cambiará**: el resumen de cada cambio y los minutos que tendría la semana siguiente, antes de guardar.

Guardar deja la decisión pendiente. El panel «Revisar y aplicar» lista los cambios acción por acción de todos los planes y los aplica juntos. Entran en vigor el próximo lunes desde el día en que se confirman, nunca en una semana que ya pasó. Nada cambia hasta ese momento. El detalle está en [DISENA_REDISENO.md](DISENA_REDISENO.md), sección 11.

## 10. Un recorrido, con números

Estos tres casos son los que las cuentas de fixture dejan listos. La contraseña es `SimMentalidad2026`.

### 10.1 Sin cuestionario, plan general

Cuenta `sim.mentalidad.vacia@fixtures.mk.invalid`. En Inicio la matriz está sin empezar y sin plan. La tarjeta dice que se puede explorar o preparar un plan.

En Diseñar, ámbito Mentalidad: paso 1 sin bloques de contexto (no hay dirección, respuestas ni planes anteriores). Paso 2 con un resultado y su criterio. En el paso 3, sin tipo de cambio elegido, el texto dice que todavía no hay datos para recomendar una estrategia y el catálogo queda abierto. MEN-A1 siembra una acción: «Una vez por semana, elige tres prioridades y ponle a cada una un momento.», 1 vez por semana, 20 minutos. Con «Por ahora no hay nada que cuidar.» y «Esto cabe en mi semana» se puede revisar y activar.

En la semana hay una acción con su criterio de hecho. El indicador todavía no tiene punto de partida. Marcar la acción hecha no rellena el indicador. Responder «2» en el indicador no marca la acción.

### 10.2 Con respuestas, plan orientado

Cuenta `sim.mentalidad.respuestas@fixtures.mk.invalid`. Tiene, entre otras, R26 en 2, R9 en 2, R29 en 2, R6 en 2, R27 en 2, D2 en sí, D3 en más o menos, D1 en sí, y una frase de visión. R7 está en 4 y no abre la lectura de respuesta. R30 está en 3 y no sostiene coherencia por sí solo. R6 en 2 más la visión sí la sostienen.

En el paso 1, bajo «Desde tus respuestas», aparecen sin orden de prioridad lecturas como planificación (cita el 2 de R26), desplazamiento en modo «¿Esto ocurre actualmente?» porque D3 fue más o menos, postergación por el sí de D2, sostener por R9, retomar por R29, y coherencia con la frase de visión. D1 no es una lectura: en el paso 4 dirá que el tiempo es escaso y que se puede empezar con la carga mínima. R27 ofrecerá el cambio de entorno opcional.

Si reconoce postergación y la marca para este plan, en el paso 3 MEN-B1 y MEN-B2 aparecen primero con el motivo «Parte de una lectura que reconociste». Si después cambia el sí de D2, la firma caduca: al activar esa lectura ya no orienta el plan.

### 10.3 Seguimiento ya corrido

Cuenta `sim.mentalidad.seguimiento@fixtures.mk.invalid`. Plan activo MEN-C1, «Una promesa pequeña cumplida», no es general. Lo reconoció como «me representa» a partir de la confianza para terminar lo que empieza. Carga acordada: 5 ocasiones de 10 minutos, 50 minutos en la semana. Cuidado escrito: el sueño. Horizonte de la propuesta: 3 semanas. La fecha de revisión está puesta en el día de hoy, así el recuadro de revisión ya se ve.

La acción lleva dos semanas cerradas y la semana en curso. Hechos sembrados: 2 en la primera, 4 en la segunda, 1 en la actual, de 5 ocasiones por semana. El resto de esas ocasiones, al quedar atrás, cuenta como sin registro. En la semana se lee una ejecución del estilo «7 hechas, 4 sin registro». El cociente de lo resuelto es 7 de 7, suficiente. Como hay ocasiones sin registro, la cobertura queda incompleta y la propuesta es `NO_RECORDS`, no un nivel parcial ni `LIGHTER_OK`.

Indicador de resultado, sí o no, «¿Terminaste esta semana algo que empezaste?». Primera semana: no. Segunda: sí. Con dos medidas, la última es sí y la primera no, así que hay avance. Una sola respuesta sí no bastaría. Percepción: 2 de 5 y luego 3 de 5. No entra en la propuesta.

Ese avance no cambia la propuesta mientras siga habiendo registros vacíos: la cobertura incompleta se queda en `NO_RECORDS`. Si más adelante la cobertura está completa, el nivel de lo resuelto y el avance sí eligen KEEP, CHECK, LIGHTER_OK o EXPLORE. Si entonces la última respuesta del indicador es no, el avance desaparece. La línea de base sigue siendo el no de la primera semana.

### 10.4 Los otros tres ámbitos, qué se ve al entrar

`sim.finanzas.respuestas`: R37 en 2, R39 en 2, radiografía R8 en 2. Lecturas: margen, deudas y presupuesto. El R8 bajo hace aparecer la sugerencia de mínima.

`sim.relaciones.respuestas`: R46 en 2, R28 en 2, radiografía de familia R16 en 2. Lecturas: pareja, familia y círculo. R28 entra en círculo, no en una lectura aparte.

`sim.salud.respuestas`: R16 en 2, R18 en 2, indicación médica en sí. Lecturas: entrenamiento y sueño. No hay lectura de alimentación porque R17 no está respondido. La indicación solo aparece en el paso 2, como sugerencia de mínima, no como una cuarta tarjeta.

## 11. Después del plan activo

La matriz muestra un plan por ámbito, no la lista. Si hay varios, elige el que está en foco y, si ninguno lo está, el de etapa más viva: activo, luego mantenimiento, preparación, pausa, cerrado. Los demás siguen en `/planes`. El número de planes del ámbito puede ser mayor que uno. La celda no los suma en el porcentaje.

Ficha `/planes/[id]`. Desde ahí se pausa, se pasa a mantenimiento, se cierra, se declara logro o se mantiene.

| Desde | Hacia | Qué implica |
|---|---|---|
| Preparación | Activo | Es la confirmación del paso 5 en los cuatro ámbitos. El plan propio activa por su propio formulario. |
| Preparación | Cerrado | Descartado. No llegó a la semana. |
| Activo | Pausa | Deja de pedir ocasiones. Lo ya marcado queda. |
| Activo | Mantenimiento | Sigue vivo, con menos exigencia. El panel lo dice en la tarjeta. |
| Activo | Cerrado | Cierre. Hace falta un motivo de cierre del ciclo de vida. |
| Pausa | Activo | Retomar. |
| Pausa | Cerrado | Cerrar sin retomar. |
| Mantenimiento | Activo, pausa o cerrado | Las tres salidas. |
| Cerrado | Ninguna | No se reabre. Se consulta. |

Logro, `/planes/[id]/logro`. Primero una evidencia: algo que terminé, una decisión, la respuesta de otra persona, una medida, u otro, con un texto. Después, la confirmación de que el criterio se cumplió, y tres notas: qué se logró, qué funcionó, qué se aprendió. Sin evidencia el servidor no declara el logro. Una medida semanal del indicador es una fila de seguimiento. No sustituye este paso, aunque el tipo «una medida» exista entre las evidencias que la persona puede adjuntar a propósito.

Mantener, `/planes/[id]/mantener`, es la puerta al mantenimiento, no un resumen automático de las semanas.

Cambiar acciones de un plan activo no se hace en Diseñar: la ficha lleva a «Ajustar en la revisión» y `/disenar/[id]` de un plan activo explica eso mismo. Ajustar acciones no cambia el resultado buscado. El resultado se edita desde la ficha y queda como una versión nueva del contrato.

Memoria lista los planes con su etapa y, si existe, el contrato firmado, solo lectura. `/proposito` es la dirección editable (`DirectionScreen`): texto, cambio deseado y tres modos. Cada guardado crea una versión. La firma de la hoja de ruta completa sigue fuera del recorrido.

## 12. Qué no hace, en concreto

- No muestra un índice ni un estado de la Matriz v2. La cobertura es un conteo de preguntas, no una nota.
- No usa arquetipos, personalidad, proyecciones ni las notas `@nota` del evaluador.
- No trata el 3 como problema. No trata el silencio como un no.
- No aplica «me representa» de una firma vieja.
- No cambia la carga ni agrega el entorno hasta que el botón o la casilla lo dicen.
- No marca el indicador porque la acción se marcó hecha, ni al revés.
- No compara el indicador con la respuesta del diagnóstico.
- No usa la percepción para KEEP, CHECK, LIGHTER_OK o EXPLORE.
- No recomienda instrumento financiero, orden de deudas ni un porcentaje de ahorro.
- No prescribe ejercicio, dieta, suplemento ni tratamiento. La indicación médica solo afloja la sugerencia.
- No dice que una relación termina, ni redacta lo que la otra persona debe contestar.
- No abre el plan con la hoja de propósito. Esa hoja no está.
- No cambia el plan solo porque llegó la fecha. La persona confirma la decisión y, si aplica, el cambio vale desde la semana siguiente.

## 13. Cómo verlo en local

Contraseña de todas: `SimMentalidad2026`. Entrada: `http://localhost:3000/login`.

| Cuenta | Qué hay dentro |
|---|---|
| `sim.mentalidad.vacia@fixtures.mk.invalid` | Sin cuestionario y sin plan. Catálogo general de los cuatro ámbitos. |
| `sim.mentalidad.respuestas@fixtures.mk.invalid` | Respuestas de Mentalidad. Lecturas por reconocer. Sin plan hasta que se active uno. |
| `sim.mentalidad.seguimiento@fixtures.mk.invalid` | MEN-C1 activo, dos semanas de hechos y de indicadores, revisión en la fecha de hoy. |
| `sim.finanzas.respuestas@fixtures.mk.invalid` | R37, R39 y asfixia de fin de mes en 2. |
| `sim.relaciones.respuestas@fixtures.mk.invalid` | Pareja, estándar del entorno y un límite familiar en 2. |
| `sim.salud.respuestas@fixtures.mk.invalid` | Entrenamiento y sueño en 2, más indicación médica en sí. |

Para dejarlas otra vez así: `cd packages/database && npx tsx scripts/seed-sim-mentalidad.ts`. Ese comando borra y recrea solo estas cuentas. Para hacerlo en la base de auditoría, antepón `DATABASE_URL=postgresql://mk:mk_local_dev@localhost:5433/mk_browser_audit`.

Dos entornos locales pueden correr a la vez sin pisarse:

| Comando | Web | API | Base | Carpetas de compilación |
|---|---|---|---|---|
| `npm run dev` | 3000 | 4000 | `maximuskratos` | `apps/web/.next`, `apps/api/dist` |
| `npm run dev:audit` | 3010 | 4010 | `mk_browser_audit` | `apps/web/.next-audit`, `apps/api/dist-audit` |

`npm run dev:audit` crea la base si falta, aplica las migraciones y libera sus propios puertos si quedó un proceso de una vez anterior. Para simular otra semana: `MK_CLOCK_DAY=2026-11-10 npm run dev:audit`. Playwright usa ese entorno con `MK_BROWSER_WEB=http://127.0.0.1:3010 npx playwright test` y lo arranca si no está corriendo. Las pruebas HTTP compilan en `apps/api/dist-test` con `npm run build:test -w @mk/api`.

## 14. Qué queda fuera de este ciclo

La firma de Rafa sobre umbrales, lecturas y textos. La hoja de propósito completa. Que una respuesta nueva proponga cambiar un plan ya activo, con la frase que la motivó, en vez de esperar a la fecha. Que el indicador semanal cuente como la evidencia del logro sin un paso aparte. Un plan por cada pregunta de las radiografías. Cualquier lectura clínica de salud.

El recorrido que sí está es el de las secciones 1 a 11. La revisión de la semana confirma cambios futuros acción por acción (sección 9). No es un párrafo que deje el plan intacto. El cuestionario sigue sin ser obligatorio para tener un plan.

## 15. Cómo está escrito el código

El monorepo tiene tres piezas que arman este ciclo.

| Paquete | Qué es | Puerto local |
|---|---|---|
| `apps/web` (`@mk/web`) | Next.js. Pantallas de miembro, player y clientes HTTP. | 3000 |
| `apps/api` (`@mk/api`) | NestJS. Reglas, persistencia, respuestas JSON. | 4000 |
| `packages/database` (`@mk/database`) | Prisma, esquema, migraciones, semillas. | Postgres 5433 |

El navegador no llama al puerto 4000. `apps/web/lib/api.ts` usa origen vacío en local, así que el fetch va a `/api/v1/...` del mismo host. `apps/web/next.config.ts` reescribe `/api/v1/:path*` hacia `http://localhost:4000/api/v1/:path*`. El prefijo global de Nest está en `apps/api/src/main.ts`: `api/v1`.

Casi todas las rutas de miembro exigen `JwtAuthGuard` y `DiagnosticOpenGuard`. El token de acceso vive en el cliente (`apps/web/lib/auth-storage.ts`). El refresh va por cookie. El helper `send` de `apps/web/lib/journey-api.ts` pone `Authorization: Bearer` y `Content-Type: application/json`.

`JourneyModule` (`apps/api/src/journey/journey.module.ts`) registra tres controladores: `JourneyController`, `AccompanimentController` e `InterventionController`, más `JourneyService`, `AccompanimentService` e `InterventionService`.

## 16. Mapa de archivos del ciclo viable

### Pantallas

| Ruta | Página | Componente que pinta |
|---|---|---|
| `/login`, `/register` | `apps/web/app/login/page.tsx`, `register/page.tsx` | formulario de acceso. Tras entrar, `getPostAuthPath` manda a `/panel`. |
| `/panel` | `apps/web/app/(member)/panel/page.tsx` | `StartDashboard` |
| `/ambito/[territory]` | `apps/web/app/(member)/ambito/[territory]/page.tsx` | `TerritoryScreen`. `fase` en la query: `descubre`, `disena`, `actua`. |
| `/diagnostico/...` | `apps/web/app/diagnostico/modulo/[moduleSlug]/pregunta/page.tsx` y hermanas | `DiagnosticPlayer` |
| `/disenar` | `apps/web/app/(member)/disenar/page.tsx` | `DesignStudio` sin `planId`. Lee `territorio` de la query. |
| `/disenar/[planId]` | `apps/web/app/(member)/disenar/[planId]/page.tsx` | `DesignStudio` con `planId` |
| `/semana` | `apps/web/app/(member)/semana/page.tsx` | `CalendarScreen` |
| `/semana/revision` | `apps/web/app/(member)/semana/revision/page.tsx` | `WeekReviewScreen`. Indicador y, si hay cambio pendiente, aplicarlo. |
| `/planes` | `apps/web/app/(member)/planes/page.tsx` | `PlansIndex` |
| `/planes/[planId]` | ficha | página del plan |
| `/planes/[planId]/logro` | logro | evidencia y declaración |
| `/planes/[planId]/mantener` | mantenimiento | transición |
| `/memoria` | `apps/web/app/(member)/memoria/page.tsx` | `MemoryScreen` |
| `/proposito` | `apps/web/app/(member)/proposito/page.tsx` | `DirectionScreen`. Dirección editable. No es pantalla de espera. |
| `/cuenta` | cuenta | sesión y salida |

El cascarón está en `apps/web/components/app-shell/MemberSideNav.tsx` (escritorio) y `BottomTabBar.tsx` (teléfono). Los href activos se calculan en `apps/web/lib/member-nav.ts`.

Redirecciones viejas, en `next.config.ts`: `/mente`, `/cuerpo`, `/espiritu`, `/asesores` y `/ruta` van a `/panel`. `/calendario` va a `/semana`. `/perfil` y `/diagnostico/resultado` van a `/memoria?vista=documentos`.

### Panel

| Archivo | Función |
|---|---|
| `apps/web/components/member/StartDashboard.tsx` | Pide el tablero y la lectura de retorno. Pinta la tarjeta y la matriz. |
| `apps/web/lib/dashboard-next.ts` | `dashboardNextStep`. Una sola tarjeta, en el orden de la sección 3. |
| `apps/web/components/member/JourneyMatrix.tsx` | Tabla con desplazamiento horizontal. Enlaces de Descubre, Diseña y Actúa. Los nombres quedan fijos. |
| `apps/web/lib/territory-ui-copy.ts` | Etiquetas: Sin empezar, En curso, Explorado, etapas del plan, textos de cumplimiento. |
| `apps/api/src/journey/dashboard.ts` | `buildDashboard`, `pickRepresentativePlan`. Un plan representativo por ámbito: foco primero, luego activo, mantenimiento, preparación, pausa, cerrado. |
| `apps/api/src/instrumentos/territory-catalog.ts` | `territoryForSourceRef`, `territoryCoverage`. Denominador de preguntas por ámbito. |

`StartDashboard` llama `fetchDashboard` → `GET /api/v1/journey/dashboard` y `fetchReturnReading` → `GET /api/v1/journey/return`.

### Cuestionario

| Archivo | Función |
|---|---|
| `apps/web/components/diagnostico/DiagnosticPlayer.tsx` | Un paso, guardar, salir, continuar. |
| `apps/web/components/diagnostico/QuestionCard.tsx` | La pregunta y las opciones. |
| `apps/web/components/diagnostico/player-back.ts` | Volver sin perder el paso. |
| `apps/web/lib/diagnostic-continue.ts` | Dónde retomar. |
| `apps/api/src/diagnostic/diagnostic.controller.ts` | Rutas de abajo. |
| `apps/api/src/diagnostic/diagnostic.service.ts` | Sesión, módulo, respuesta. |
| `apps/api/src/instrumentos/answer-ledger.ts` | `answerLedger`. Lo que la intervención lee. No es el puntaje de la matriz. |
| `packages/database/definitions/formulario-completo@6.json` | Catálogo activo. |

| Método y ruta | Uso |
|---|---|
| `POST /api/v1/diagnostic/start` | Abre o retoma la sesión general. |
| `POST /api/v1/diagnostic/territory/:territory/start` | Abre el ámbito. Lo usa `apiDiagnosticStartTerritory` desde `TerritoryScreen`. |
| `GET /api/v1/diagnostic/question` | Pregunta actual. |
| `POST /api/v1/diagnostic/response` | Guarda la respuesta y sube la revisión. |
| `GET /api/v1/diagnostic/state` y `GET /api/v1/diagnostic/progress` | Dónde va el player. |

La cobertura no espera a cerrar el módulo. Cuenta respuestas asentadas del catálogo activo. Excepciones (`UNKNOWN`, `NOT_APPLICABLE`, `DECLINED`) cuentan como asentadas para Explorado y no entran al motor de lecturas.

### Diseñar

| Archivo | Función |
|---|---|
| `apps/web/components/member/DesignStudio.tsx` | Borradores en preparación, elección de ámbito y montaje de `PlanDesignFlow`. |
| `apps/web/components/member/design/PlanDesignFlow.tsx` | Orquesta los cinco pasos, el progreso y el paso para retomar. Un plan que ya no está en preparación muestra cómo ajustarlo desde la revisión. |
| `apps/web/components/member/design/Step*.tsx` | Un archivo por paso: `StepChange`, `StepResult`, `StepStrategy`, `StepActions`, `StepReview`. |
| `apps/web/lib/plan-design.ts` | Etiquetas, resumen de frecuencia, carga por semana y edición de la lista. |
| `apps/web/lib/design-flow.ts` | `territoryLabel`, `TERRITORY_OPTIONS`. |
| `apps/web/lib/intervention-api.ts` | Cliente HTTP de la intervención y del diseño. |
| `apps/api/src/journey/intervention/plan-design.ts` | Contrato `diseno-plan@1`: semillas, validación, carga, qué falta, recomendaciones. |

Query que conserva el lugar: `paso` (1 a 5) y `territorio`. `/disenar/[planId]` sin `paso` abre el primer paso incompleto.

### Intervención, servidor

| Archivo | Qué exporta |
|---|---|
| `apps/api/src/journey/intervention/engine.ts` | Tipos y funciones puras. No toca la base. |
| `apps/api/src/journey/intervention/mentalidad.ts` | `PACK` de Mentalidad y reexporta el motor ya atado, para que los tests viejos sigan importando de aquí. |
| `apps/api/src/journey/intervention/finanzas.ts` | `PACK` |
| `apps/api/src/journey/intervention/relaciones.ts` | `PACK` |
| `apps/api/src/journey/intervention/salud.ts` | `PACK` |
| `apps/api/src/journey/intervention/registry.ts` | `packByTerritory`, `templateById` de los cuatro, `BOUND`. |
| `apps/api/src/journey/intervention.service.ts` | Lectura de ledger, reconocimiento, borrador, ajuste, medida, vista del plan. |
| `apps/api/src/journey/intervention.controller.ts` | Rutas HTTP. |

Funciones puras de `engine.ts`:

| Función | Qué hace |
|---|---|
| `band` | 1 y 2 candidata, 3 medio, 4 y 5 recurso. |
| `readSources(pack, ledger)` | Escalas, dificultades, elecciones y visión. Lo ilegible va a `ineligible`. |
| `hasAnswers` | Hay alguna fuente leída. |
| `buildReadings(pack, read, stored)` | Lecturas, firma y reconocimiento vigente. |
| `readingsForGoal` | Sin meta, todas. Con meta, hasta dos, sin reordenar por gravedad. |
| `isOriented` | `REPRESENTS` o `PARTIAL`. |
| `templateById` / `activeIndicators` | Plantilla, y si la mínima trae otro indicador. |
| `executionFrom` | 0 registros `NONE`. Disparador `NOT_APPLICABLE`. Si no, hecho / total: `SUFFICIENT` desde 0,75, `PARTIAL` desde 0,40, si no `LOW`. |
| `progressFrom` | Avance solo contra la serie del indicador. Ver sección 9. |
| `reviewProposal` | Los seis textos. |
| `validateMeasure` | Entero, rango, texto, opción, o no aplica si el indicador lo admite. |
| `bindPack` | Cierra `readSources`, `buildReadings` y `templateById` sobre un pack. |

`packByTerritory` pasa el parámetro a mayúsculas. `/mentalidad` y `/MENTALIDAD` son el mismo pack. Otro nombre responde 404 con «Ese ámbito no tiene un recorrido de planes.»

`InterventionService` methods públicos: `view`, `recognize`, `createPlan`, `adjustPlan`, `recordIndicator`, `planView`. El reloj es `JourneyClock`. La semana civil es `weekStartForDay` y `addIsoDays`. La ejecución acumulada usa `weekCounts` y `loadActionSchedules`, como el calendario.

`JourneyService.addAction` (`apps/api/src/journey/journey.service.ts`) valida `templateRef` con `templateById` del registro. Si la plantilla es `TRIGGER` y el cuerpo trae `occasionsPerWeek`, rechaza. La activación del borrador sigue en `JourneyService`, no en el servicio de intervención: `POST /api/v1/journey/plans/:planId/activate`.

### Semana

| Archivo | Función |
|---|---|
| `apps/web/components/journey/CalendarScreen.tsx` | Días y filas. Cada acción aparece solo en las semanas de su ventana. Avisa de una tarea de una vez que quedó sin hacer y lleva a la revisión. |
| `apps/web/components/journey/TaskRow.tsx` | Hecho y otros estados, con cuándo y versión mínima si existen. |
| `apps/web/components/journey/WeekReviewScreen.tsx` | `/semana/revision`. Monta `IndicatorCheckin` por plan y el panel de aplicar. |
| `apps/web/components/journey/IndicatorCheckin.tsx` | Qué ocurrió (acción por acción), indicador, resultado y decisión. |
| `apps/web/components/journey/InterventionReviewDecision.tsx` | Decisión de la revisión. Con `actions` usa `ActionReviewPanel`. Sin ellas, la decisión anterior de plan entero. |
| `apps/web/components/journey/ActionReviewPanel.tsx` | Una tarjeta por acción, edición progresiva y altas. |
| `apps/web/components/journey/InterventionWeekApplyPanel.tsx` | Lista los cambios de todos los planes y los aplica. |
| `apps/web/lib/action-review.ts` | Textos por acción, semanas para reprogramar, carga de la semana siguiente. |
| `apps/api/src/journey/intervention/action-review.ts` | `planActionReview`: valida cada decisión y la traduce a `closeWeek`. |
| `apps/api/src/journey/action-window.ts` | `actionCountsInWeek`: en qué semanas cuenta una acción, también después de terminar. |
| `apps/api/src/journey/week-count.ts` | `weekCounts`, estados de cada ocasión. |
| `apps/api/src/journey/civil-week.ts` | Lunes civil. |
| `apps/api/src/journey/action-schedule.ts` | Ocasiones flexibles cuando hay `occasionsPerWeek` y no hay día fijo. |

## 17. Contrato HTTP de la intervención

Base: `/api/v1/journey/intervention/:territory`. `:territory` es `MENTALIDAD`, `FINANZAS`, `RELACIONES` o `SALUD_FISICA`.

La pantalla de Diseñar usa `GET /design-context`, `POST /designs`, `GET` y `PATCH /plans/:planId/design` y `POST /plans/:planId/activate`, descritos en [DISENA_REDISENO.md](DISENA_REDISENO.md). Las rutas de abajo siguen vigentes para los planes ya creados y para los clientes anteriores.

### `GET /:territory?meta=`

`meta` es opcional y tiene que ser un id de `pack.goals`. Si no, se ignora.

Respuesta que consume `InterventionView` en `intervention-api.ts`:

```json
{
  "territory": "FINANZAS",
  "version": "intervencion-finanzas@0.1",
  "goal": null,
  "goals": [{ "id": "margen", "label": "Que el mes deje margen" }],
  "prioritized": false,
  "readings": [],
  "setAside": [],
  "hasAnswers": false,
  "ineligible": [],
  "vision": null,
  "modifiers": { "suggestMinimum": null, "environmentAlternative": null },
  "templates": []
}
```

Cada lectura trae `id`, `group`, `goal`, `status` (`CANDIDATE` o `TO_CONFIRM`), `declared[]`, `interpretation`, `question`, `asksFocus`, `vision`, `sources[]`, `signature`, `recognition`, `plans[]`.

Cada `sources[]` es `{ instrument, row, sourceRef, catalogVersion, revision }`. La firma es esas piezas ordenadas y unidas con `|`.

`ineligible[]` trae `key` y `reason`: `GENERIC_LABELS`, `EXCEPTION` o `NO_VALUE`.

### `POST /:territory/recognition`

Cuerpo: `{ readingId, outcome, signature }`. `outcome` es `REPRESENTS`, `PARTIAL` o `NOT`.

Errores: 400 si falta un campo. 404 si esa lectura no sale de las respuestas actuales. 409 con código `STALE_READING` si la firma no coincide. Respuesta: la misma vista que el GET, sin filtro de meta.

Escribe `member_clarifications`: `scope` = `pack.scope`, `outcome`, `subjectRef` = id de lectura, `detail` = firma, `source` = `CONFIRMATION`, `rulesVersion` = versión del pack.

Ámbitos y scopes:

| Ámbito | `scope` | `version` |
|---|---|---|
| MENTALIDAD | `INTERPRETATION_MENTALIDAD` | `intervencion-mentalidad@0.1` |
| FINANZAS | `INTERPRETATION_FINANZAS` | `intervencion-finanzas@0.1` |
| RELACIONES | `INTERPRETATION_RELACIONES` | `intervencion-relaciones@0.1` |
| SALUD_FISICA | `INTERPRETATION_SALUD_FISICA` | `intervencion-salud@0.1` |

### `POST /:territory/plans` (compatibilidad)

Ruta anterior a los cinco pasos. Diseñar usa `POST /:territory/designs`. Sigue para clientes anteriores y sus borradores se leen como diseño.

Cuerpo: `{ templateId, readingIds, focusText, stageDefinition, commandKey }`.

`readingIds` vacío significa plan general. Si vienen ids, cada uno tiene que estar reconocido y la plantilla tiene que listarlo.

Errores 400: plantilla desconocida en ese ámbito, foco o etapa vacíos cuando la plantilla los pide, lectura no reconocida, lectura que no orienta esa plantilla.

Si `commandKey` ya existe en `plan_proposals` para ese usuario y el plan sigue ahí, responde `{ plan, repeated: true }` y no inserta otra fila. La unicidad es `@@unique([userId, commandKey])`.

Inserta, en una transacción:

`personal_plans`: `title` (plantilla, y el foco si hay, recortado a 180), `outcome` = `seeks`, `status` `DRAFT`, `stage` `PREPARING`, `entry` `GOAL` si hubo lecturas y `NO_DIRECTION` si es general, `territory`, `criterionText` = definición de etapa, `criterionStatus` `PROVISIONAL` si hubo texto, `reviewAt` = hoy más `horizonWeeks * 7`.

`plan_proposals`: `kind` `INTERVENTION_PLAN`, `status` `ACCEPTED`, `territory`, `templateRef` = `{id}@{version}`, `engineVersion` y `rulesVersion` = versión del pack, `commandKey`, `reasons` = lecturas citadas, `payload` con esta forma:

```json
{
  "templateId": "MEN-A1",
  "version": "intervencion-mentalidad@0.1",
  "general": true,
  "minimum": false,
  "horizonWeeks": 3,
  "focusText": null,
  "stageDefinition": null,
  "readings": [],
  "load": null,
  "environmentAccepted": false
}
```

### `PATCH /:territory/plans/:planId` (compatibilidad)

Carga de una sola acción de plantilla, antes del diseño. Diseñar usa `PATCH /:territory/plans/:planId/design`.

Cuerpo: `{ minimum, horizonWeeks, weeklyMinutes, occasionsPerWeek, minutesPerOccasion, protectNote, environmentAccepted }`.

El plan tiene que seguir en `PREPARING` y el `territory` del plan y de la propuesta tienen que ser el del URL. Si no, 404. Si ya no está en preparación, 409.

Escribe en el payload `minimum`, `horizonWeeks`, `load: { weeklyMinutes, occasionsPerWeek, minutesPerOccasion, confirmed: true }` y `environmentAccepted`. En el plan: `capacityMinutes`, `protectNote`, `reviewAt` recalculado desde hoy, `version` incrementada.

Respuesta: la vista de `GET .../plans/:planId`.

### `GET /:territory/plans/:planId`

Acepta `?weekStart=` (el lunes de la semana revisada). Además de lo de abajo trae `actions` (las acciones vigentes, cada una con su tipo, su semana si es de una vez, lo registrado en la semana revisada y `needsDecision`), `endedActions` (las terminadas, con `effectiveTo`, `endedReason` y `replacedBy`), `reviewWeek` (`weekStart`, `nextWeek`, `nextWeekMinutes`) y `marks`.

Vista `InterventionPlanView`: plantilla, banderas `general` y `minimum`, foco, etapa definida, lecturas guardadas, carga, `reviewAt`, `horizonReached` (hoy >= fecha), `indicators[]`, `execution`, `review`.

Cada indicador: `{ indicator, baseline, latest, answeredThisWeek, history, progress }`. `baseline` es la primera semana. `latest` es la última. `history` está ordenada por `periodStart`.

`execution` es `{ done, notDone, noInformation, level }`. `level` es el código de `executionFrom`.

`review` es `{ code, text }`.

### `POST /:territory/plans/:planId/review-decision`

Con `actions` o `additions` en el cuerpo, la decisión es acción por acción: `{ weekStart, actions: [{ actionId, op, ... }], additions: [...], note, meaning, healthLimit, conversation, commandKey }`. `op` es `KEEP`, `REDUCE`, `MODIFY`, `RESCHEDULE`, `SUBSTITUTE` o `RETIRE`. Lo no mencionado se mantiene. Sin esos campos, la ruta conserva la decisión anterior de plan entero sobre la primera acción. Validaciones y efectos en [DISENA_REDISENO.md](DISENA_REDISENO.md), sección 11.

### `POST /:territory/plans/:planId/indicator`

Cuerpo: `{ indicatorRef, value, text, notApplicable, commandKey }`.

El plan tiene que estar `ACTIVE` o `MAINTENANCE`. El `indicatorRef` tiene que ser uno de los indicadores activos (los de la mínima si `minimum` es true y la mínima trae los suyos). Si `commandKey` ya existe en `plan_evidence` de ese usuario, responde `{ measure, repeated: true }`.

Inserta `plan_evidence`: `kind` `MEASURE`, `status` `MEASURED`, `source` `DECLARED_BY_MEMBER`, `indicatorRef`, `value` numérico o null, `text` (o `NO_APLICA`), `periodStart` el lunes civil, `observedOn` hoy, `criterionRevision` del plan.

## 18. El resto de HTTP que el ciclo toca

Todos bajo `/api/v1/journey`, con el mismo guard.

| Cliente web | Ruta | Para qué en este ciclo |
|---|---|---|
| `fetchDashboard` | `GET /dashboard` | Matriz y tarjeta. |
| `fetchReturnReading` | `GET /return` | Retorno si hubo ausencia. |
| `fetchTerritory` | `GET /territories/:territory` | Ficha del ámbito: cobertura, síntesis, planes. |
| `journeyPlans` | `GET /plans` | Listado y ficha. |
| `createPlanDraft` | `POST /plans/draft` | Histórico: borrador del plan propio anterior. Diseñar ya no lo llama. |
| `patchPlanDraft` | `PATCH /plans/:planId/draft` | Histórico: textos y carga del plan propio anterior. |
| `addAction` | `POST /plans/:planId/actions` | Acciones fuera de Diseñar. Diseñar crea las acciones al activar el diseño. |
| `activatePlanDraft` | `POST /plans/:planId/activate` | Activación de planes sin diseño. Cuerpo `{ confirmed: true, capacityMinutes, commandKey }`. |
| `journeyCalendar` | `GET /calendar` | Semana, acciones, registros. |
| `saveRecord` | `POST /records` | `{ actionId, day, status, resultNote }`. `status`: `DONE`, `SKIPPED`, `NOT_APPLICABLE`, `PENDING`. Único por acción y día. |
| `previewWeek` | `POST /weeks/preview` | Efecto del cierre, sin escribir. |
| `closeWeek` | `POST /weeks/close` | Congela la semana en `week_reviews`. |
| `journeyWeeks` | `GET /weeks` | Semanas ya cerradas. |
| `addPlanEvidence` | `POST /plans/:planId/evidence` | Evidencia del logro. No es el indicador semanal. |
| `declarePlanAchievement` | `POST /plans/:planId/achievement` | Declara el logro si hay evidencia y el plan lo permite. |
| `transitionPlanStage` | `POST /plans/:planId/transition` | Pausa, mantenimiento, cierre, retorno. |
| `fetchMemory` | `GET /memory` | Lista de memoria. |

`POST /plans/:planId/actions` acepta `title`, `doneWhen`, `occasionsPerWeek`, `minutesPerOccasion`, `templateRef`, `minimumVersion`. `templateRef` tiene que existir en algún pack. Un disparador no lleva ocasiones.

`POST /records` rechaza con `ACTION_ENDED` un día posterior al final de una acción (`effectiveTo`). Lo registrado antes se conserva.

Al activar un diseño, si falta algo, el código es `ACTIVATION_INCOMPLETE` con `missing` (códigos) y `details` (paso y mensaje). La pantalla muestra la lista con un enlace a cada paso.

## 19. Tablas que este ciclo escribe

Esquema en `packages/database/prisma/schema.prisma`. La migración del indicador es `packages/database/prisma/migrations/20261028010000_plan_evidence_indicator_m5/migration.sql`. Solo agrega tres columnas a `plan_evidence`: `indicator_ref`, `value`, `period_start`, y el índice `(plan_id, indicator_ref, period_start)`. Las evidencias viejas quedan con null.

| Tabla Prisma | Tabla SQL | Qué guarda este ciclo |
|---|---|---|
| `MemberClarification` | `member_clarifications` | Reconocimiento. Una fila nueva por respuesta. Se lee la última por `subjectRef` cuya `detail` siga igual a la firma actual. |
| `PersonalPlan` | `personal_plans` | El plan. `stage`, `territory`, `entry`, `capacityMinutes`, `protectNote`, `reviewAt`, `activatedAt`, `criterionText`, `version`, `isFocus`. |
| `PlanProposal` | `plan_proposals` | El contrato de la plantilla en `payload`. `kind` = `INTERVENTION_PLAN`. |
| `PlanAction` | `plan_actions` | Cada acción del plan. `doneWhen`, `occasionsPerWeek`, `minutesPerOccasion`, `minimumVersion`, `cue` (cuándo y dónde), `position` (orden), `effectiveFrom` y `effectiveTo` (ventana en la que cuenta) y `endedReason` (motivo si se retiró). Una revisión que cambia una acción, aunque solo cambie el cuándo o la versión mínima, la cierra con `effectiveTo` y crea una sucesora con `replacesActionId`. Esa sucesora empieza el próximo lunes desde el día en que se aplica la revisión. Una acción de una vez lleva `occasionsPerWeek` nulo y un `ActionSchedule` `FLEXIBLE` limitado a su semana. Si el alta trae `templateRef`, `addAction` guarda `origin` `SYSTEM_TEMPLATE`, `familyId` igual al id de la plantilla (`MEN-A1`, `FIN-A1`) y `templateVersion` igual a la versión del pack. |
| `ActionSchedule` | `action_schedules` | Versión vigente de la frecuencia. La escribe el alta de la acción. Una tarea de una vez tiene una fila `FLEXIBLE` de una ocasión con `effectiveFrom` y `effectiveTo` dentro de su semana. |
| `ActionRecord` | `action_records` | Hecho u otro estado, por `actionId` + `day`. `resultNote` es aparte del estado. |
| `PlanEvidence` | `plan_evidence` | Medida semanal cuando `kind` es `MEASURE` e `indicatorRef` está puesto. También la evidencia de logro, sin `indicatorRef`. |
| `WeekReview` | `week_reviews` | Cierre de una semana civil. `snapshot` congela lo que se vio. Único por usuario y `weekStart`. |
| `PlanTransition` | `plan_transitions` | Cada cambio de etapa. |

`DiagnosticSession` y `Response` las escribe el player, no la intervención. La intervención solo las lee a través de `answerLedger`.

No hay tabla de plantillas. Los packs están en TypeScript. Si se borra un id del código, un plan viejo con ese `templateId` responde 404 en la vista: «La plantilla de este plan ya no existe.»

## 20. Cadena de un plan, función por función

1. `DesignStudio` elige el ámbito y monta `PlanDesignFlow`, que pide `GET /:territory/design-context`.
2. Paso 1: `createDesign` → `POST /:territory/designs` → `InterventionService.createDesign` crea `PersonalPlan` en preparación y `PlanProposal` con `payload.design`. Reconocer una lectura usa `POST /:territory/recognition`.
3. Pasos 2 a 4: `patchDesign` → `PATCH /:territory/plans/:planId/design` con `section` `result`, `strategy` o `actions`. Cada respuesta es la vista completa (`designView`): qué falta, carga, recomendaciones, seguridad.
4. Paso 5: `activateInterventionPlan` → `POST /:territory/plans/:planId/activate` → `activateDesign`. Valida, pasa los controles de contenido, crea las acciones y sus ventanas y activa en una transacción.
5. `/semana`: `CalendarScreen` carga `GET /calendar`. Muestra cada acción solo en las semanas de su ventana y avisa si una tarea de una vez quedó sin hacer.
6. `/semana/revision`: `IndicatorCheckin` pide `GET /:territory/plans/:planId?weekStart=` y monta `InterventionReviewDecision`, que con `actions` usa el panel acción por acción.
7. Guardar: `POST /:territory/plans/:planId/review-decision` con `actions` y `additions` → `confirmActionReview` (`planActionReview` en `intervention/action-review.ts`). Queda en `payload.pendingReviews[semana]`.
8. Aplicar: `POST /journey/intervention/week-review/apply` → `applyInterventionWeekReview` → `JourneyService.closeWeek` con las decisiones de todas las acciones y las altas. Cierra la semana y recalcula `capacityMinutes` con todas las acciones de la semana siguiente.

> Histórico. La cadena anterior entraba por `MentalidadStart`, creaba el borrador con `POST /:territory/plans` al elegir una tarjeta, ajustaba con `PATCH /:territory/plans/:planId` y activaba con una sola acción de plantilla. Las rutas siguen para borradores y clientes anteriores. [REVISION_QUE_DECIDE_IMPLEMENTADO.md](REVISION_QUE_DECIDE_IMPLEMENTADO.md) y [ENTREGA_REVISION_MEN_A1.md](ENTREGA_REVISION_MEN_A1.md) describen esa etapa.

## 21. Pruebas y semilla

| Archivo | Qué fija |
|---|---|
| `apps/api/test/intervention-mentalidad.test.ts` | 16 pruebas de dominio: bandas, etiquetas genéricas de R8 y R19, más o menos, coherencia con visión, rechazo que caduca, filtro de meta, mínimas, revisión. |
| `apps/api/test/intervention-territories.test.ts` | Los otros tres packs: ids únicos, una escala baja abre la lectura, un 5 no, la indicación médica no crea lectura, finanzas no tiene plan de inversión. |
| `apps/api/test/intervention-mentalidad.http.test.ts` | HTTP sobre base desechable `mk_journey_it`: catálogo general, validación de carga, activación, indicador con línea de base, reconocimiento, rechazo, R19 viejo. Está en `apps/api/vitest.integration.config.ts`. |
| `apps/api/package.json` script `test:domain` | Incluye los dos archivos de dominio, así `npm run test:acceptance` los corre. |

Dominio, sin base: `cd apps/api && npx vitest run test/intervention-mentalidad.test.ts test/intervention-territories.test.ts`.

HTTP: hace falta `DATABASE_URL` apuntando a `mk_journey_it`, el cliente generado y `npm run build:test -w @mk/api`, que compila en `apps/api/dist-test` sin borrar el `dist` de un `nest --watch` en marcha. `bootApi` usa `dist-test` si existe y si no `dist`. `scripts/test-acceptance.sh` crea esa base, migra, compila y corre `test:http`. No toca la base de desarrollo `maximuskratos`.

Diseñar y revisar: `apps/api/test/plan-design.test.ts`, `apps/api/test/action-review.test.ts` (dominio), `apps/api/test/plan-design.http.test.ts`, `apps/api/test/action-review.http.test.ts` (HTTP). Navegador: [DISENA_REDISENO.md](DISENA_REDISENO.md), sección 13.

Semilla de las seis cuentas: `packages/database/scripts/seed-sim-mentalidad.ts`. Borra por email y recrea. Escribe respuestas directo en `Response` de la versión activa, y el plan de seguimiento con `PlanProposal`, `PlanAction`, `ActionRecord` y `PlanEvidence` (`source` `SIMULATION`). Contraseña `SimMentalidad2026`.

## 22. Qué hay en el repo y no es este ciclo

Estas piezas existen y no hay que confundirlas con el recorrido viable de las secciones 1 a 11.

| Zona | Dónde | Por qué no es el ciclo |
|---|---|---|
| Matriz v2, laboratorio, hallazgos | `apps/api/src` admin lab, `apps/web/app/admin/lab` | Congelada como autoridad de diagnóstico. La intervención no la llama. |
| Acompañamiento y puntos de partida viejos | `accompaniment.controller.ts`, `families.ts` | El camino `OWN` y otros territorios históricos. Los cuatro ámbitos, en general y en respuestas, ya no pasan por ahí. |
| Propósito, contrato, IKIGAI, alineación | rutas `purpose/*`, `alignment`, `IkigaiCross`, `PurposeScreen` | `/proposito` es `DirectionScreen`. El cruce IKIGAI del cuestionario volvió al ciclo en `/proposito/respuestas` con `PurposeIkigaiCross`, sobre el mismo `journey/synthesis`. `IkigaiCross`, `PurposeScreen`, la ficha IAD, el índice y la hoja completa no son el ciclo. |
| Devolución y experimentos | `DevolucionView`, `experiments` | No son el indicador semanal. |
| `PlansScreen` | `apps/web/components/journey/PlansScreen.tsx` | Formulario viejo. La ruta de miembro usa `DesignStudio` y `PlansIndex`. |
| `/semana/revision` | `WeekReviewScreen` | Sí puede aplicar el cierre de la revisión. No es una página estática. |

El motor de intervención no importa `@mk/matrix-engine` ni escribe estados de la matriz. Lee `answerLedger` y escribe planes, propuestas, aclaraciones y evidencias.
