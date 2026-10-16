# MK: experiencia completa, simulaciones y especificación para continuar

Propuesta de producto v0.1 · 7 de octubre de 2026

Estado: diseño propuesto para revisión e implementación interna. Las personas y los desenlaces de las simulaciones son ficticios. No son resultados de usuarios, validación de eficacia ni decisiones metodológicas aprobadas por Rafa.

## 1. La decisión que recomiendo

Conservar la profundidad humana de la v1 y la estructura de la v2. Construir la experiencia alrededor de un cambio elegido por la persona, conectado con su vida y revisado según lo que ocurre al intentarlo.

Promesa propuesta: **«Te ayudamos a convertir algo que te importa en un cambio concreto, a hacerlo posible en tu vida y a corregir el rumbo con lo que aprendes».**

La app debe poder ayudar a quien no sabe qué quiere, a quien tiene una meta y está trabado y a quien siente varios ámbitos desordenados. Comparten un núcleo: entender, elegir, preparar, actuar, observar y ajustar. La ayuda inicial cambia.

Para comunicar y construir la primera implementación, recomiendo empezar por «tengo algo importante y no logro avanzar». Es una elección de producto propuesta, por cercanía al código actual; no una conclusión de mercado. El alcance de esta especificación incluye también las otras dos entradas y el recorrido de propósito. Terminar un solo guion no equivale a terminar el producto aquí definido.

El primer resultado útil debe ser visible: una decisión razonada y corregible, un paso listo para hacerse y algo importante que se protege. El resultado recurrente debe ser avanzar o entender qué cambiar. Volver a la app tiene sentido cuando ayuda a resolver el siguiente obstáculo, preparar el siguiente hito o revisar una decisión.

La metodología completa tiene dos dimensiones conectadas:

- **Comprender y orientar la vida:** historia, visión, valores, estándares, identidad, interferencias, recursos, tendencias, hipótesis de propósito, contraste, huella y alineación.
- **Hacer y aprender:** elegir un cambio, preparar una estrategia, actuar con ayuda, observar resultados y ajustar.

La segunda puede comenzar con una comprensión provisional. La primera se profundiza cuando resulta útil y sigue siendo accesible. No debe desaparecer después de la firma ni convertirse en una barrera de entrada.

## 2. Qué nos dicen los materiales y qué sigue abierto

### Hechos de las fuentes

La respuesta técnica adjunta informa que el motor importa 187 preguntas, 16 planes, 48 objetivos y 96 actividades. El recorrido de miembro utiliza Formularios por paso y no tiene un puente explícito hacia ese motor. Las actividades importadas contienen cadencia, minutos, evidencia, versión mínima y barrera COM-B; la alternativa de la hoja no llega a `ActivityDefinition`.

También informa que el cierre guarda decisiones sin aplicarlas, que Inicio anuncia un ajuste que no ocurrió y que `executionReading` trata la ausencia de un registro `DONE` como no ejecución. La auditoría anterior añade que el documento firmado se vuelve a generar para mostrarse, en lugar de leer la versión histórica guardada. Son problemas de integridad del producto que deben corregirse.

El mapa v2 representa una arquitectura de datos: preguntas → escalas → reglas → estado → planes → objetivos → actividades → seguimiento → métricas → dashboard, con propósito transversal. Es una base aprovechable. No especifica por sí mismo las decisiones que una persona tiene que tomar ni la ayuda que necesita cuando su intento falla.

En la v2 hay doce componentes de propósito y reglas que permiten explorar sin tener un propósito cerrado. Existe además material operativo valioso: acciones con contexto, evidencia, versión mínima, alternativas y barreras. La dificultad es convertir ese contenido en ayuda situada y conectar sus salidas con el resto del recorrido.

### Distinciones que deben mantenerse

| Capa | Qué podemos afirmar | Qué no está demostrado |
|---|---|---|
| Software | Si guarda, muestra y aplica correctamente lo elegido | Que eso ayude a personas ajenas al equipo |
| Metodología | Qué preguntas, categorías y reglas describe MK | Que sus puntajes sean medidas clínicas o psicométricas validadas |
| Experiencia propuesta | Si el recorrido es coherente en casos simulados y sus excepciones | Que sea comprensible, deseable o sostenible para usuarios reales |
| Negocio | Qué valor creemos ofrecer y qué debemos observar | Que exista retención o disposición a pagar |

Las simulaciones permiten descubrir contradicciones y agujeros. Sus desenlaces no prueban éxito. Ahora corresponde cerrar el recorrido interno; la evaluación con personas reales queda para después, sin reemplazarla por resultados ficticios.

## 3. Qué recuperar, transformar y cuestionar

| Elemento | Decisión propuesta | Cómo se convierte en utilidad |
|---|---|---|
| Profundidad de la v1 | Recuperar la intención de las preguntas relevantes | Escenas de vida, motivos, límites, recursos y decisiones que después viajan al plan |
| Visión y «martes ordinario» | Recuperar como contexto concreto | Saber qué vida se quiere proteger, incluso si se busca crecimiento profesional |
| Valores y estándares | Mantener y aterrizar | Ayudan a elegir entre opciones y descartar estrategias incompatibles |
| Historia e identidad | Mantener con lenguaje prudente | Identificar patrones y apoyos; contrastar declaraciones con ejemplos sin etiquetar a la persona |
| Propósito | Hacerlo recorrible y conectado | Hipótesis elegida → experiencia → aprendizaje → decisión; no una frase ornamental |
| Estructura v2 | Conservar | Catálogo trazable para sugerir rutas, objetivos y actividades compatibles |
| Cuatro estados | Usarlos donde corresponde según reglas y fuente | Orientar compatibilidad y carga; un estado no determina por sí solo la causa ni toda la prioridad |
| Cuestionario extenso | Ofrecer profundidad progresiva | Cada pregunta solicitada debe cambiar una lectura, una decisión, una ayuda o una revisión |
| Manifiesto firmado | Darle su función propia | Conserva compromisos y sentido; no sustituye un plan ni bloquea toda acción provisional |
| Una prioridad por ciclo | Conservar como regla de foco | Se muestra qué se cambia, qué se mantiene y qué espera |
| Tope universal de dos acciones | No adoptarlo como verdad metodológica | Diferenciar objetivos, comportamientos y ocurrencias; la capacidad determina la carga |
| Tres listas por pilares | Reorganizar en torno al cambio | Una conversación o un proyecto pueden involucrar varios ámbitos sin crear planes duplicados |
| Métricas | Separar ejecución, resultado y aprendizaje | Las marcas muestran actividad; la evidencia muestra si se logró algo relevante |
| Revisión semanal | Aplicar de verdad sus decisiones | La persona ve qué cambia en la siguiente semana y qué continúa |
| Ayuda profesional | Dar una salida concreta cuando corresponde | Explicar el límite, preparar una consulta o solicitud y conservar la continuidad del recorrido |
| Transformación total y perfección | No prometerlas | Definir criterios observables de calidad y reconocer lo que todavía no sabemos |

No toda experiencia valiosa necesita convertirse en productividad. Una relación, un espacio de descanso o una actividad disfrutada por sí misma pueden ser algo que se protege. Tampoco toda dificultad es una falta de disciplina.

## 4. El recorrido completo de miembro

Los nombres siguientes son lenguaje de producto propuesto. Deben convivir con la trazabilidad a DESCUBRIR, ALINEAR, PRIORIZAR, CONSTRUIR, MEDIR, DERIVAR y RECALIBRACIÓN de la v2.

| Momento | Qué hace la persona | Qué entrega la app | Qué queda guardado y usado |
|---|---|---|---|
| 1. Situarme | Describe qué le preocupa, qué quiere conservar y qué capacidad tiene | Una lectura inicial corregible y la siguiente pregunta relevante | Situación, expectativa, restricciones y apoyos |
| 2. Comprenderme | Recorre el contexto y los módulos que aportan a su situación | Una síntesis con ejemplos, fortalezas, tensiones y asuntos por aclarar | Contexto personal, valores, estándares, patrones y preguntas abiertas |
| 3. Orientarme | Define una dirección provisional o contrasta hipótesis | Opciones explicadas y una experiencia para aprender cuando hay incertidumbre | Dirección, hipótesis elegida, beneficiarios y criterios de contraste |
| 4. Elegir | Acepta, corrige o sustituye una propuesta de foco | Qué atacar, mantener y posponer; por qué y con qué límites | Decisión de foco, razones, alternativas y corrección del usuario |
| 5. Preparar | Define resultado, estrategia, hito y oportunidad real | Un plan que cabe en su vida y ayuda lista para el siguiente paso | Cambio, versión del plan, acciones, mínimos, evidencia y revisión |
| 6. Hacer | Ejecuta, pide ayuda o informa un bloqueo | Instrucciones, ejemplos y alternativas pertinentes | Ocurrencias y evidencias; contexto del bloqueo si la persona lo confirma |
| 7. Revisar | Distingue qué hizo, qué cambió y qué aprendió | Propuesta de ajuste con vista previa de sus consecuencias | Revisión aplicada, nueva versión del plan e historial |
| 8. Integrar | Decide mantener, avanzar, replantear, cerrar o pedir apoyo | El siguiente hito o una conclusión honesta del ciclo | Aprendizaje, cierre y cambios explícitos de dirección o contexto |

Derivación puede aparecer en cualquier momento en que una regla compatible lo requiera. No es una última pantalla obligatoria para todas las personas. Recalibración puede modificar estrategia, foco o dirección; no implica reiniciar todos los cuestionarios.

### Cuándo está «completa» la metodología

Hay que distinguir dos estados:

1. **Producto con recorrido completo:** todas las fases existen, sus salidas viajan a la fase siguiente, hay ayuda para ejecutar y la revisión modifica el futuro. Los doce componentes de propósito son accesibles y tienen una función definida.
2. **Recorrido personal:** puede tener elementos explorados, provisionales, pendientes o por revisar. La app muestra ese estado con honestidad. Completar formularios no demuestra integración vital.

Un usuario puede comenzar un cambio y profundizar su historia después. Eso no autoriza a marcar «metodología 100 % completada» si siguen partes pendientes. La app debe ayudar a distinguir progreso operativo, profundidad explorada y aprendizaje comprobado.

## 5. Los doce componentes de propósito deben producir algo útil

Esta tabla conserva los componentes de `08_PROPOSITO`. Los ejemplos de interfaz y artefactos son propuestas nuevas; no añaden puntajes ni inferencias automáticas al método.

| Componente v2 | Pregunta o ejercicio propuesto | Salida útil | Dónde se usa |
|---|---|---|---|
| Origen | «¿Qué aprendiste a hacer para salir adelante? ¿Cuándo te ayuda y cuándo te limita?» | Patrones y recursos narrados con ejemplos | Lectura de barreras y selección de apoyos; no destino determinado por la historia |
| Visión | Describir un martes ordinario deseable, personas, trabajo, descanso y renuncias | Escena y diferencias respecto del presente | Elegir resultado, proteger tiempo y juzgar compatibilidad de un plan |
| Valores | Contrastar cinco valores con decisiones recientes | Valores y conductas observables | Motivo del cambio y alternativas que se descartan |
| Estándares | Formular cinco mínimos con revisión y consecuencias realistas | Límites y prácticas de cuidado | Capacidad, condiciones del plan y mantenimiento |
| Identidad | «Dices que eres X: ¿qué conducta reciente lo muestra? ¿Qué quieres practicar?» | Declaración y evidencia diferenciadas | Elegir una conducta practicable; no una etiqueta fija ni un arquetipo inventado |
| Interferencias | Relatar una situación repetida: contexto, respuesta y consecuencia | Patrón descrito por el usuario | Ayuda durante el bloqueo y estrategia que se va a probar |
| Integración | Reconocer recursos, límites, vulnerabilidad y apoyos | Condiciones de sostenibilidad | Ajustar carga, pedir ayuda y escoger alternativas |
| Tendencias | Explorar preferencias con sus límites | Preferencias orientativas y observaciones | Formato de acción o apoyo; no diagnóstico de personalidad |
| Hipótesis | Relacionar manualmente elementos de las cuatro lentes | Una a tres hipótesis guardadas | Elegir explícitamente una hipótesis para explorar |
| Contraste | Revisar seis criterios y diseñar un experimento de 30, 60 o 90 días | Evidencia buscada, plan del experimento y lectura posterior | Plan semanal, revisión y decisión de mantener, cambiar o descartar |
| Huella | «¿A quién beneficia esto y qué diferencia concreta podría producir?» | Beneficiario e impacto deseado | Alcance del resultado y feedback útil |
| Alineación | Revisar objetivo, valores, estándares e hipótesis | Coherencias, tensiones y renuncias explícitas | Elección de foco y evaluación del resultado |

Los cuatro lentes de IKIGAI y los seis criterios de contraste se conservan según el método existente. No se construye un score de propósito, un requisito de cuatro coincidencias ni un emparejamiento semántico automático. Guardar una hipótesis y elegirla son acciones diferentes.

El propósito vital y la exploración vocacional merecen distinguirse en la experiencia. Si se explora una posible ocupación, la necesidad y el valor económico son preguntas pertinentes del IKIGAI existente. Si se protege una relación o un estándar básico, esa acción no requiere justificar su valor económico. Desconocer un criterio se registra como desconocimiento; no como cero ni como invalidez de toda la vida.

### Regla para recuperar contenido de v1

Crear una tabla de trazabilidad por pregunta: intención original, campo actual, salida propuesta, decisión que modifica y estado de recuperación. Conservar el sentido no obliga a pedir todas las preguntas al comienzo. Una pregunta que genera solo una frase archivada debe conectarse con una decisión o reconsiderarse.

Ejemplo: «Quiero llegar a casa con energía para hablar con mi hija» pasa de visión a límite del plan. Si el plan sugiere trabajo todas las noches, la app muestra la tensión y ofrece otra oportunidad. Esa es una conexión metodológica real.

## 6. Cómo recomendar sin inventar un diagnóstico

### Fuentes separadas

1. **Lectura del formulario:** sus resultados y textos, identificados con su versión y fecha.
2. **Motor v2:** sus resultados solo cuando exista una evaluación v2 real y compatible. No convertir escalas del formulario de 115/60 a índices v2 de 0–100 por una regla improvisada.
3. **Contexto confirmado:** preocupación, proyecto, oportunidad, recursos y prioridades expresados por la persona.
4. **Contenido del catálogo:** actividades y ayudas trazables, con sus condiciones de compatibilidad.
5. **Hipótesis de producto:** explicaciones y defaults nuevos, identificados internamente como borradores, corregibles y versionados.

Usar textos de una actividad v2 como ayuda curada no equivale a afirmar que el motor v2 diagnosticó a ese miembro. Si falta un estado compatible, la app puede ofrecer una alternativa genérica elegida por la persona; no atribuirle un plan por estado como conclusión validada.

### Lo que debe ver la persona

Una propuesta breve con cinco elementos:

- **Lo que entendimos:** preocupación y ejemplos que ella aportó.
- **Lo que ya funciona:** recursos o prácticas que conviene conservar.
- **Dónde proponemos empezar:** cambio y razón concreta.
- **Lo que estamos suponiendo:** explicación que necesita su confirmación.
- **Qué puede corregir:** foco, motivo, capacidad o estrategia, con una alternativa visible.

Ejemplo: «Quieres enviar tu propuesta y estás usando el poco tiempo disponible para comparar referencias. Podríamos probar un primer borrador revisable antes de seguir investigando. Esto supone que sabes lo suficiente para escribirlo; si lo que falta es conocimiento, empezamos por resolver ese punto».

La persona puede responder «no, sé hacerlo; el problema es que no tengo un momento sin interrupciones». La corrección cambia el contexto y el plan. No cambia retrospectivamente sus respuestas ni recalcula un score metodológico.

### Orden de decisión propuesto, no fórmula aprobada

Aplicar restricciones de seguridad existentes donde sean compatibles; escuchar la prioridad del usuario; contrastarla con sus recursos y límites; comprobar si existe una oportunidad ejecutable; ofrecer opciones y registrar la elección. Si falta información decisiva, preguntar ese dato.

No afirmar deterioro sin dos mediciones comparables. No afirmar una palanca causal a partir de un puntaje bajo. «Creemos que esto podría facilitar aquello» debe ser una hipótesis discutible, no un resultado del motor. Tampoco presentar «propósito integrado» sin evidencia del recorrido de contraste.

El criterio metodológico definitivo de prioridad sigue siendo una decisión abierta. Podemos implementar ahora una selección transparente asistida por la app y confirmada por el usuario, sin hacer pasar ese diseño por una regla firmada de Rafa.

## 7. El objeto central: un cambio con versiones

| Campo | Requisito funcional |
|---|---|
| Situación de partida | Ejemplo concreto, fuente y fecha; puede ser cualitativo |
| Resultado buscado | Diferencia observable o criterio narrativo; no «ser mejor» |
| Motivo | Qué importa, para quién y qué valor o dirección conecta |
| Límites y mantenimiento | Qué se protege y qué no cabe en el ciclo |
| Estrategia | Qué se va a probar, por qué y qué supuesto tiene |
| Tipo | Proyecto, comportamiento recurrente, acción puntual o experimento de propósito |
| Alcance y horizonte | Hitos y fechas realistas según el caso; no doce meses obligatorios |
| Capacidad | Tiempo disponible y oportunidades reales, incluidos preparación y revisión |
| Próximo paso | Acción, entregable o experiencia; criterio de terminado |
| Contexto | Cuándo, dónde o ante qué situación se hará |
| Versión mínima | Alternativa útil para una semana difícil, sin fingir que equivale al resultado completo |
| Ayuda | Guía, ejemplo, alternativa y condiciones pertinentes |
| Evidencia de ejecución | Lo que permite saber qué se hizo; autoinforme puede ser suficiente |
| Evidencia de resultado | Qué cambió fuera de la app; separada del registro de actividad |
| Revisión | Fecha, preguntas relevantes y decisiones disponibles |
| Procedencia y versión | Fuente del contenido, decisiones del usuario y cambios históricos |

No convertir un único «hábitat de tareas» en solución universal. Un proyecto tiene hitos y entregables; una rutina tiene ocurrencias; una conversación tiene preparación, consentimiento y posibles acuerdos; un experimento tiene una pregunta y evidencia para aprender.

### Carga y foco

La v2 establece un ámbito prioritario por ciclo, hasta un mantenimiento, hasta tres objetivos y entre tres y siete tareas semanales según capacidad. Su arquitectura menciona una prioridad central y hasta dos habilitadores. Esas unidades deben aclararse antes de unirlas con el recorrido actual; no son equivalentes a «máximo dos acciones».

Propuesta de producto: mostrar el próximo paso del foco y el mantenimiento necesario; contar la carga total de sus ocurrencias. Dejar en configuración explícita cualquier diferencia provisional con las reglas v2. No multiplicar tareas para cumplir un rango ni omitir una dependencia indispensable para cumplir un tope.

Ejemplo: una definición de acción con dos bloques de 30 minutos genera dos ocurrencias y consume 60 minutos. Una revisión de 10 y preparación de 5 elevan el total a 75. Un apoyo ya instalado puede protegerse sin crear una nueva tarea ni otra prioridad.

## 8. La ayuda que justifica usar la app

La ayuda aparece al preparar o ejecutar, y produce algo que puede guardarse en el cambio.

| Situación | Ayuda propuesta | Salida concreta |
|---|---|---|
| Proyecto demasiado amplio | Definir beneficiario, entregable, criterio de terminado y renuncias | Alcance de un hito revisable |
| No sabe empezar | Mostrar un ejemplo y completar el primer paso junto con la persona | Primer borrador, estructura o pregunta resuelta |
| Conversación difícil | Ordenar hecho, impacto, necesidad y pedido, con límites de seguridad | Guion editable y oportunidad acordada |
| No existe una ventana | Revisar agenda real, preparar entorno o negociar un espacio | Contexto viable o reducción honesta del compromiso |
| Se pierde en la tarea | Definir la salida antes del bloque y quitar una interferencia elegida | Un bloque con resultado definido |
| No sabe qué explorar | Elegir hipótesis y formular qué necesita aprender | Experiencia con pregunta y criterio de contraste |
| Hizo todo y no ayudó | Revisar si la acción produce el resultado esperado | Cambio de estrategia, alcance o medida |
| Quiere cambiar de foco | Revisar qué cambió y qué queda pendiente | Cierre o pausa con razón y siguiente decisión |

No hace falta IA para que estas ayudas existan. Plantillas deterministas, ejemplos curados y campos bien elegidos pueden entregar valor. La IA, si se incorpora después, debe trabajar sobre esa estructura y respetar sus límites; no suplir una metodología indefinida.

### Contenido v2 útil para una primera biblioteca curada

| ID en `06_ACTIVIDADES` | Intención original resumida | Uso propuesto |
|---|---|---|
| `MEN-EST-O3-A1` | Reducir notificaciones y realizar bloques de foco | Preparar una oportunidad; adaptar duración con trazabilidad |
| `MEN-EST-O3-A2` | Definir la salida antes del bloque | Pedir verbo y entregable antes de ejecutar |
| `MEN-CONS-O3-A1` | Dividir una meta en hitos con criterio de terminado | Estructurar un proyecto |
| `MEN-CONS-O3-A2` | Revisar progreso, riesgo y siguiente acción | Preparar la revisión, conservando resultado y aprendizaje |
| `MEN-EXP-O1-A1` | Definir beneficiario, resultado, alcance y renuncias | Ayudar a elegir un alcance útil |
| `MEN-EXP-O1-A2` | Entregar un incremento y obtener feedback | Evaluar utilidad del entregable |
| `MEN-EST-O2-A1` | Preparar una respuesta ante un desencadenante | Contexto «cuando ocurra X, haré Y» |
| `REL-EST-O1-A1` | Espacio sin pantallas con alguien importante | Presencia acordada; alternativa corta compatible |
| `REL-EST-O2-A1` | Preparar hecho, impacto, necesidad y pedido | Ayuda para una conversación segura |
| `REL-EST-O2-A2` | Confirmar acuerdo y revisión | Seguimiento de la conversación |

Los estados de esos IDs pertenecen a la clasificación del catálogo, no se asignan a los personajes ficticios. Las adaptaciones propuestas deben registrar qué se conserva, qué cambia y qué condiciones aplican. Importar `alternative` y mantener el texto fuente evita perder contenido útil; publicar automáticamente las 96 actividades no garantiza utilidad.

## 9. Revisión que cambia el futuro

La revisión separa tres preguntas: **qué ocurrió**, **qué cambió** y **qué hacemos ahora**. Puede utilizar autoinforme, evidencia cualitativa o un entregable según el caso. No exige adjuntos para todo.

| Observación | Qué preguntar | Ajuste posible |
|---|---|---|
| No empezó y no sabía cómo | Qué parte no sabía hacer | Ayuda, ejemplo, aprendizaje o división del paso |
| No tuvo oportunidad | Qué ocurrió con el contexto previsto | Mover ventana, cambiar entorno, negociar apoyo o reducir alcance |
| La acción dejó de importar | Qué cambió en su motivo | Replantear o cerrar el cambio |
| Ejecutó y no movió el resultado | Si el entregable o la estrategia responden al problema | Sustituir estrategia; no reducir automáticamente |
| Avanzó con carga sostenible | Qué conviene conservar y cuál es el siguiente hito | Mantener, avanzar o terminar |
| Avanzó con costo excesivo | Qué quedó desplazado | Ajustar carga y recuperar límites |
| No hay registro | Si quiere informar lo ocurrido o dejarlo desconocido | Conservar la incertidumbre; no imputar fracaso |
| Existe una alerta compatible | Qué continuidad segura permite la regla vigente | Restringir actividades incompatibles y ofrecer ayuda pertinente |

La explicación del bloqueo proviene de la persona o queda como hipótesis. COM-B ayuda a ordenar capacidad, oportunidad y motivación; no identifica por sí mismo la causa de un caso particular.

### Reglas de escritura

- Antes de aplicar, mostrar qué continúa, qué se reemplaza, qué se retira y qué ocurrencias futuras cambian.
- Guardar una nueva versión del plan. Conservar el pasado y la evidencia registrada.
- Aplicar la decisión de forma atómica e idempotente. Un doble clic o reintento no duplica semanas ni acciones.
- `KEEP` conserva lo seleccionado; `MODIFY` requiere describir el cambio concreto; `RETIRE` deja de programar esa acción futura y conserva su historia.
- Si mantener/modificar/retirar son las decisiones técnicas disponibles, permitir que modificar abarque estrategia y contexto. Avanzar de hito o cerrar un cambio necesita una transición explícita del cambio, aunque reutilice esas operaciones sobre acciones.
- Una causa desconocida no puede activar una adaptación automática atribuida a falta de motivación.
- La revisión puede ajustar una próxima oportunidad antes del fin de semana cuando sea necesario. No obliga a esperar siete días para resolver un bloqueo sencillo.
- Un retorno después de varias semanas comienza por actualizar contexto y elegir el próximo paso; no acumula una deuda ficticia de tareas atrasadas.

### Datos ausentes y denominadores

Separar ocurrencia prevista, resultado registrado y cierre de la ventana. Como mínimo: hecha, omitida explícitamente, no aplicable, pendiente de ocurrir y sin información de una ventana pasada. Un registro ausente no es un `skipped` automático.

Ejemplo: tres ocurrencias previstas, una hecha, una omitida y una sin registro. Mostrar **«1 hecha, 1 omitida, 1 sin registro de 3 previstas»**. Si se presenta una tasa sobre registros conocidos, es 1/2 y debe decirlo. Si se muestra hechas/previstas, es 1/3 y no puede llamarse tasa de incumplimiento. Las no aplicables deben tener razón y una regla transparente de denominador. No mezclar ambas lecturas.

## 10. Simulación A: no sé qué quiero

**Personaje ficticio:** Martín, 34 años. Tiene un trabajo estable y siente que vive en automático. Le gusta explicar problemas técnicos y ayudar a otras personas. No quiere renunciar ni monetizar inmediatamente todo lo que disfruta. Dispone de 90 minutos semanales para explorar.

### Entrada y comprensión

La app pide una situación concreta: «¿Cuándo notaste más esta sensación?». Martín responde que disfruta ayudar a compañeros, pero termina la semana sin haber hecho algo propio. Su martes deseado incluye terminar el trabajo, estar presente en casa y tener un espacio para enseñar o resolver algo útil.

Valores trabajados en el recorrido: servicio, aprendizaje, presencia, autonomía y honestidad. Un estándar relevante: no quitar sistemáticamente tiempo familiar para explorar. Historia e identidad se revisan con ejemplos; sus preferencias no se convierten en un diagnóstico.

### Dirección y elección

Martín completa las cuatro lentes del IKIGAI y conecta manualmente dos hipótesis:

- Enseñar herramientas digitales a personas que comienzan.
- Resolver problemas tecnológicos concretos mediante ayuda individual.

Guarda ambas. Elige explícitamente la primera para explorar. La app conserva la segunda como alternativa. No calcula cuál es «su verdadero propósito».

Los seis criterios de contraste son disfrute, capacidad, utilidad, valor económico, coherencia moral y viabilidad. Los que Martín no puede valorar quedan pendientes. Elige un experimento de 30 días: ayudar a dos personas a resolver un problema digital concreto y observar qué formato les resulta útil.

### Preparación y primera semana

Resultado del experimento: tener ejemplos de ayuda realizada y feedback que permitan decidir si continuar con el formato. No «encontrar mi misión en siete días».

Primer paso: conversar con dos personas sobre un problema real y escoger un problema abordable. Ayuda de la app: «¿Qué estás intentando hacer? ¿Dónde te trabas? ¿Cómo sabrías que quedó resuelto?». Capacidad estimada: 2 × 15 minutos de conversación, 20 de preparación y 10 de revisión. Total: 60 de 90 disponibles.

Versión mínima: una conversación con problema, contexto y señal de resolución registrados. Eso aporta información; todavía no prueba capacidad para enseñar ni valor económico.

### Desenlace hipotético que cuestiona la recomendación

En la primera semana, las dos personas no quieren un curso; necesitan ayuda breve sobre problemas distintos. Martín hizo el paso y aprendió algo contrario al formato inicial. La app no recomienda repetir invitaciones a un curso más pequeño. Propone revisar la hipótesis o el formato; Martín elige probar ayuda individual.

En la segunda semana realiza una ayuda guiada. El usuario destinatario informa qué resolvió y qué sigue sin resolver. La revisión distingue: la actividad se hizo, hubo utilidad para ese problema y faltan datos sobre disfrute repetido, viabilidad y valor económico.

Al día 30, el contraste registra evidencia por criterio. Martín mantiene la exploración con alcance acotado y deja el valor económico abierto. Puede elegir otro experimento o cerrar la hipótesis. Si este resultado ocurre en la simulación, demuestra que la app puede acompañar una decisión; no demuestra que Martín encontró un propósito integrado.

### Método completo en este caso

Los doce componentes tienen salida o estado explícito: origen y recursos aportan experiencias; visión protege su vida cotidiana; valores y estándares limitan el plan; identidad se contrasta con conductas; interferencias muestran qué distrae; integración recoge apoyos y límites; tendencias orientan formato; hipótesis y contraste organizan el experimento; huella identifica beneficiarios; alineación revisa si el intento respeta lo importante. Los pendientes se mantienen visibles.

**Prueba de utilidad:** salir de una pregunta abstracta con una experiencia que produjo información relevante y una decisión posterior.

## 11. Simulación B: sé qué quiero y no avanzo

**Personaje ficticio:** Diego, 38 años. Quiere enviar una propuesta de servicio revisable a dos posibles clientes. Lleva semanas mirando ejemplos. Puede dedicar 90 minutos semanales. No quiere trabajar todas las noches ni prometer un resultado comercial que no controla.

### Entrada, dirección y foco

La app recoge el proyecto, qué existe hoy, cuándo podría trabajar y qué está protegiendo. Diego ya tiene dirección suficiente para empezar. Sus valores relevantes son autonomía, honestidad, presencia, aprendizaje y cuidado; el resto del recorrido permanece accesible.

Lectura propuesta: «Podríamos probar un borrador revisable antes de seguir comparando referencias». Diego puede corregirla. Si responde que no sabe definir el servicio, la ayuda inicial cambia hacia beneficiario y resultado. Si responde que sabe pero lo interrumpen, cambia la oportunidad de trabajo.

Foco elegido: una propuesta de dos páginas que describa problema, resultado, alcance y una invitación a conversar. Se posponen logo, web completa y nuevos servicios. Se mantiene un espacio familiar que ya funciona.

### Construcción

Hitos propuestos: estructura, borrador revisable, envío y lectura del feedback. No se programan todos como nuevas obligaciones de la primera semana.

Primera semana: dos bloques de 30 minutos con una salida definida; 5 minutos de preparación y 10 de revisión. Total: 75 de 90 disponibles. Ayuda: completar «ayudo a [persona] a lograr [resultado] mediante [alcance]» y escribir qué queda fuera.

Versión mínima: un borrador breve con beneficiario, problema y resultado. Haber hecho la versión mínima no equivale a haber enviado la propuesta.

### Desenlace hipotético que cuestiona la estrategia

Diego registra ambos bloques, pero usó todo el tiempo en comparar plantillas. No existe un borrador. La app muestra ejecución y resultado separados, y pregunta qué pasó. Diego confirma que le cuesta aceptar un borrador imperfecto; eso es una observación del usuario, no un diagnóstico de personalidad.

La revisión cambia la estrategia: escribir un borrador sin diseño y pedir feedback sobre el contenido. Próxima semana: 40 minutos de escritura, 15 de feedback y 10 de revisión. Total: 65 minutos. El entregable queda definido antes de empezar; la búsqueda de referencias deja de ser la acción principal.

La modificación se aplica. Al volver a Inicio, Diego ve el nuevo paso, los límites y la ayuda pertinente. Los dos bloques anteriores siguen en la historia; no se reescriben para fingir progreso.

Si obtiene feedback, el siguiente hito depende de lo observado. Si el borrador se entiende, puede enviar. Si no, revisa la propuesta. Si no responde nadie, se separa «envié» de «obtuvimos una señal de interés» y se decide cómo obtener información; no se atribuye todo el resultado al esfuerzo.

### Método completo en este caso

La comprensión de origen, identidad, interferencias e integración permite describir un patrón y apoyos; la visión, valores y estándares protegen presencia y carga. Tendencias orientan la ayuda sin bloquear. La dirección puede ser una hipótesis ya elegida; no hay obligación de repetir IKIGAI para ejecutar una meta clara. Huella y alineación delimitan beneficiario y alcance. Cuando llegue el cierre, Diego puede actualizar su dirección explícitamente con lo aprendido.

**Prueba de utilidad:** producir y revisar un entregable que estaba trabado. El resultado comercial posterior queda abierto.

## 12. Simulación C: varios ámbitos desordenados

**Personaje ficticio:** Andrés, 42 años. Trabajo, convivencia y pendientes domésticos compiten por su tiempo. También le preocupa el dinero. Tiene 60 minutos semanales disponibles para un cambio intencional. Caminar el sábado y pagar cuentas básicas ya son prácticas estables.

### Comprensión y elección

La app muestra qué está desordenado y qué funciona. Una puntuación financiera baja, si existe, no demuestra que deba empezar automáticamente por finanzas. Andrés identifica como preocupación inmediata la falta de acuerdos sobre la semana y el malestar que eso produce en casa. No informa un contexto inseguro para la conversación.

La propuesta es preparar y acordar una semana más viable con su pareja. La hipótesis «esto podría liberar algo de capacidad» queda como hipótesis. Andrés elige ese foco. Caminata y pagos se conservan; revisión de gastos no urgentes y un proyecto nuevo quedan pendientes con razón y fecha de revisión.

Visión: una semana en que las obligaciones esenciales tienen lugar y queda un momento de conversación. Valores: presencia, cuidado, responsabilidad, honestidad y equilibrio. Estándar: no prometer una agenda que depende de tiempo inexistente.

### Preparación y ejecución

Ayuda para preparar un pedido concreto: hecho → impacto → necesidad → pedido. Se propone una conversación de 20 minutos, acordada con la otra persona; 20 minutos para preparar y reorganizar la semana, y 10 de revisión. Total: 50 de 60 disponibles.

Evidencia de ejecución: conversación realizada o situación informada. Evidencia de resultado: existe un acuerdo que ambos entendieron y Andrés puede describir qué hizo la semana más viable. El autoinforme se identifica como tal; el número de conversaciones no demuestra su calidad.

### Desenlace hipotético que pone a prueba capacidad

Surge un imprevisto y no existe la ventana acordada. La app no lo clasifica como desinterés. Andrés confirma la pérdida de oportunidad. Puede proponer una alternativa breve aceptada por la otra persona o mover la conversación. La versión mínima conserva un pedido concreto, pero no marca el acuerdo como logrado.

La siguiente semana muestra la nueva oportunidad y el paso pendiente. Si el acuerdo reduce fricción, se mantiene lo que funciona y se revisa si ya cabe otro cambio. Si no, se identifica qué parte no funcionó. La app no agrega automáticamente más tareas para «subir» todos los ámbitos.

### Método completo en este caso

La profundización de origen, identidad, interferencias e integración se hace según su capacidad, con pendientes explícitos. La v1 aporta vida cotidiana y experiencias valiosas; propósito incluye lo que quiere proteger, huella y alineación. IKIGAI vocacional sigue disponible si aparece una duda de dirección, sin exigir justificar económicamente una relación.

**Prueba de utilidad:** elegir un foco que reconoce su situación, preparar una conversación y ajustar la semana sin aumentar obligaciones inviables.

## 13. Casos que también deben poder recorrerse

| Caso simulado | Comportamiento requerido |
|---|---|
| Respuestas incompletas | Mostrar lo que falta; no fabricar estado o certeza |
| Usuario rechaza la propuesta | Guardar corrección y cambiar el siguiente paso; no obligarlo a aceptar |
| Alerta que bloquea un plan | Respetar regla y compatibilidad; explicar salida y ayuda pertinente sin ofrecer un plan bloqueado |
| Apoyo profesional necesario | Facilitar preparación de consulta o solicitud cuando corresponda; no una pantalla sin continuidad |
| No registra nada | Mostrar desconocido y permitir informar o conservarlo como tal |
| Hizo acciones, no movió resultado | Revisar estrategia y entregable |
| Avanzó sin registrar acciones | Aceptar evidencia de resultado con su fuente; no convertirla en ocurrencias `DONE` inventadas |
| Llegó al resultado | Cerrar o mantener; no inventar otro problema para prolongar el uso |
| Cambió de prioridad | Pausar o cerrar con razón y conservar contexto, historia y pendientes |
| Ausencia de varias semanas | Actualizar situación y retomar con capacidad actual; evitar una montaña de tareas vencidas |
| Semana cerrada | Mantener registros históricos; ajustes afectan solo el futuro permitido |
| Firma anterior | Mostrar exactamente el documento firmado y su versión |
| Revisión repetida o conexión interrumpida | Una sola aplicación efectiva, con estado recuperable |
| Cambió capacidad | Recalcular carga del futuro y mostrar qué deja de caber |
| Dos personas usan cuentas distintas | Datos e historial propios; fixtures internos aislados y acceso realmente restringido |

Las salidas de apoyo deben respetar el alcance de MK: orientación general prudente y derivación cuando procede. Las simulaciones no autorizan a añadir diagnóstico, asesoramiento de inversión o tratamiento personalizado. No es necesario un marketplace para ofrecer una salida útil.

## 14. Inicio y navegación propuestos

Inicio responde: **qué estoy intentando cambiar, cuál es el próximo paso, cómo me ayuda MK y cuándo voy a revisarlo**. Añade qué se mantiene y qué espera. El perfil y los puntajes quedan accesibles como contexto.

Navegación conceptual:

- **Mi ruta:** situación, dirección, foco y evolución del cambio.
- **Hacer:** próximo paso, ayuda y registro.
- **Revisar:** evidencia, aprendizaje y ajuste.
- **Comprenderme:** módulos de profundidad y contexto personal.

El detalle final de rutas debe adaptarse al proyecto existente, no crear un segundo producto desconectado. Los pilares pueden ser filtros o contexto, pero no deben producir planes genéricos duplicados. No mostrar valores vacíos como si fueran resultados calculados.

El manifiesto se guarda, consulta y versiona con su función propia. La persona puede comenzar con una dirección provisional. Su firma no sustituye el vínculo entre valores, estándares y decisiones del plan.

## 15. Trabajo de implementación, en orden

### A. Integridad y procedencia

Corregir ausencia de registro como fallo, lectura de documento firmado y afirmaciones falsas de ajuste. Definir fuentes del formulario/v2/usuario/borrador y preservarlas. Verificar el acceso real a cualquier cuenta de simulación; una etiqueta de preview no es una restricción.

### B. Núcleo compartido

Modelo de cambio y versiones; contexto y capacidad; recomendación corregible; ayuda trazable; ocurrencias; evidencia de resultado; revisión aplicada; cierre y pendientes. Construirlo primero con el caso de meta trabada, comprobando persistencia tras recargar y en una sesión posterior.

### C. Recorrido de comprensión y propósito

Recuperar la intención de v1 con trazabilidad y completar los doce componentes funcionales. Integrar el IKIGAI existente: explorar → relacionar/formular → elegir → contrastar → experimentar. Una hipótesis elegida debe poder generar el experimento, el paso semanal y su revisión sin copiar textos manualmente entre pantallas.

### D. Tres entradas completas

Conectar la orientación inicial de incertidumbre y sobrecarga al mismo núcleo. Todas las entradas llegan a ejecutar, revisar y ajustar. No considerar completa una entrada porque sus textos están especificados si el miembro todavía no puede recorrerla.

### E. Simulación interna del ciclo y excepciones

Fixtures reproducibles, separados de datos reales, con contextos y desenlaces alternativos. Verificar cambios de estrategia, oportunidad, foco y cierre; datos ausentes; alertas; retorno; firmas e idempotencia. Permitir avanzar fechas en el entorno interno sin falsificar historia del miembro real.

Este orden permite construir por partes. La aceptación final exige el circuito completo descrito. No hace falta app nativa, cobro, directorio de especialistas ni importar todo el catálogo para cumplir este alcance.

### Modelo lógico propuesto

Adaptar a las entidades existentes después de inspeccionar el repositorio. Los nombres siguientes describen responsabilidades; no ordenan duplicar tablas:

- Contexto del miembro, observaciones de diagnóstico con fuente y versión, dirección y módulos explorados.
- Recomendación, su evidencia, supuestos, alternativas y decisión del usuario.
- Cambio, versiones del plan, hitos, definiciones de acciones y ocurrencias.
- Evidencia de ejecución y resultado, revisión, decisiones aplicadas, cierre y pendientes.
- Hipótesis de propósito y experimento, vinculados al cambio cuando corresponde.

El contrato firmado es un snapshot histórico. El plan es versionable. Corregir una recomendación no debe alterar la firma ni el diagnóstico original. Una revisión aplicada puede cambiar el plan vigente y preservar su versión anterior.

## 16. Criterios de aceptación

1. Cada una de las tres entradas puede llegar desde contexto inicial a una acción útil, una revisión y un ajuste persistido.
2. Los doce componentes de propósito son accesibles, tienen salida funcional y muestran explorado/provisional/pendiente/revisar sin un porcentaje ficticio de integración.
3. Una hipótesis guardada no se vuelve elegida automáticamente. Una elegida se conecta con un experimento de 30/60/90 días y un plan ejecutable.
4. La recomendación muestra razones y supuestos. Corregirla cambia realmente lo que se propone y conserva la decisión.
5. Ningún puntaje del formulario se presenta como score v2 por conversión improvisada. No se calcula propósito, deterioro o palanca sin método y datos compatibles.
6. Cada cambio tiene resultado, motivo, partida, estrategia, capacidad, paso, contexto, ayuda, evidencia y revisión.
7. La carga incluye ocurrencias, preparación y revisión. La interfaz muestra incompatibilidades con capacidad antes de confirmar.
8. Una actividad tiene guía y alternativa compatible; el contenido nuevo y adaptado es trazable.
9. Registro de actividad y resultado se leen por separado. Ausencia de registro no se informa como incumplimiento.
10. La revisión permite mantener, ajustar contexto, cambiar estrategia, avanzar, pausar/cerrar o pedir apoyo según el caso. Sus consecuencias se ven antes de confirmar y se guardan.
11. Tras recargar y reabrir sesión, Inicio muestra la versión vigente y el siguiente paso correcto.
12. Cambios de futuro preservan pasado, firma e historia. Reintentar revisión no duplica efectos.
13. Lo que se mantiene y lo que espera permanece visible y editable con razón.
14. Alertas compatibles restringen lo correspondiente y ofrecen continuidad prudente. No se publica una recomendación bloqueada como disponible.
15. Completar el cambio tiene una salida honesta. No se exige generar tareas indefinidamente.
16. Entorno interno y fixtures tienen aislamiento y permisos efectivos; no basta con marcar un usuario como preview.
17. El recorrido funciona en móvil y desktop con el mismo núcleo de datos; no depende de una implementación nativa.
18. El informe final diferencia qué existe, qué se implementó, qué se verificó y qué sigue siendo hipótesis.

### Matriz mínima de pruebas internas

Para cada entrada: camino normal, corrección de propuesta, pérdida de oportunidad, ejecución sin resultado, sin registro y cierre. Añadir casos compartidos de alerta, firma, retorno, capacidad e idempotencia. Las verificaciones deben observar datos y comportamiento real de la app; pulsar botones en una maqueta no las sustituye.

## 17. Cómo evaluar calidad y éxito sin fingir resultados

Ahora podemos evaluar integridad y coherencia: si la persona simulada puede decidir, recibir ayuda, registrar evidencia, cambiar estrategia y continuar. No hay que fijar cifras de retención, pago o transformación como si ya existieran.

Cuando llegue la etapa con usuarios, observar si entienden y corrigen la propuesta, si hicieron un avance que venían postergando, si el ajuste responde a lo ocurrido y por qué vuelven. El uso de la app es un medio; puede bajar cuando una conducta se vuelve autónoma. Cerrar un cambio con éxito también es un resultado positivo.

Conviene medir:

- Tiempo y fricción hasta el primer paso preparado, sin una meta numérica inventada ahora.
- Avances observables respecto de la partida, distinguiendo autoinforme y evidencia externa.
- Correcciones de recomendaciones y razones; también casos donde no hubo utilidad.
- Revisiones que produjeron un ajuste útil y lo que sucedió después.
- Carga real, abandono, retorno y motivos para cerrar.
- Después, voluntad de continuar o pagar, investigada por separado de completar un formulario.

## 18. Base externa y límites de lo que respalda

Harkin y colaboradores analizaron 138 estudios experimentales y encontraron que intervenciones para aumentar el seguimiento del progreso favorecieron, en promedio, el logro de metas. Esto respalda dedicar atención al seguimiento; no valida los cuestionarios, textos ni reglas particulares de MK.

Michie, van Stralen y West proponen COM-B como marco para analizar capacidad, oportunidad y motivación al diseñar intervenciones. Sirve para evitar una explicación única centrada en disciplina. No permite atribuir automáticamente una causa a una persona por sus marcas.

La revisión de Alberts, Lyngs y Lukoff sobre tecnologías de cambio de comportamiento advierte que se puede optimizar la motivación para usar la tecnología en lugar de favorecer la motivación hacia el cambio buscado. Es un motivo adicional para evaluar resultados fuera de la app y dar salidas de autonomía. La elección de diseño aquí descrita es nuestra inferencia, no una demostración de que esta app concreta funcionará.

Fuentes primarias consultadas:

- Harkin et al. (2016), *Does monitoring goal progress promote goal attainment?* DOI: 10.1037/bul0000025. https://pubmed.ncbi.nlm.nih.gov/26479070/
- Michie et al. (2011), *The behaviour change wheel*. DOI: 10.1186/1748-5908-6-42. https://link.springer.com/article/10.1186/1748-5908-6-42
- Alberts et al. (2024), *Designing for Sustained Motivation*. Manuscrito de investigación. https://arxiv.org/abs/2402.00121

## 19. Instrucción lista para el agente de código

Copiar este bloque junto con el documento y las fuentes en el entorno que tiene el repositorio. Esta entrega no modificó el código de la app: el repositorio no está disponible en este espacio.

```text
Necesito llevar MK a un recorrido completo y útil de miembro, siguiendo la especificación MK_producto_recorrido_completo.md. El objetivo incluye las tres entradas, la metodología de comprensión/propósito y la conexión con ejecución, revisión y ajuste. Construir solo el cierre semanal o un único guion no satisface el alcance final.

Primero inspecciona AGENTS.md, entidades, rutas, APIs, motor, catálogos y pruebas. Confirma o corrige los hechos de la auditoría y la respuesta técnica. No trates esos documentos como prueba de que el código actual sigue igual. Identifica qué se puede reutilizar y entrega una tabla de trazabilidad entre v1, v2, Formularios por paso y la experiencia propuesta. Mantén la matriz v2 y sus scores congelados.

Diferencia explícitamente: método existente, comportamiento técnico observado, nuevo diseño de producto y decisiones metodológicas abiertas. Los defaults nuevos se implementan como propuestas reversibles y versionadas, no como reglas aprobadas de Rafa. Puedes construir selección asistida y confirmada por el usuario sin inventar una fórmula de prioridad. No te detengas ante cada decisión rutinaria; documenta tus supuestos y sigue dentro del alcance autorizado. Si una decisión metodológica bloquea una afirmación automática, conserva la elección explícita del usuario y una propuesta identificada como tal.

Trabaja por partes en este orden:
1. Integridad: lectura exacta de firma, cierre aplicado, mensajes veraces, estados sin registro y permisos efectivos del entorno interno.
2. Núcleo compartido: contexto, capacidad, cambio, versiones, recomendación corregible, ayuda, hitos/ocurrencias, evidencia de resultado, revisión aplicada y cierre.
3. Recorrido de meta trabada completo con persistencia real.
4. Comprensión y doce componentes de propósito con salidas útiles; conectar IKIGAI existente al experimento y al plan sin scores nuevos ni inferencias semánticas. Guardar y elegir hipótesis siguen separados.
5. Conectar incertidumbre de dirección y sobrecarga al mismo núcleo, hasta ejecución, revisión y ajuste. No dejar estas entradas solo como documentos o mensajes estáticos.
6. Simulaciones internas reproducibles y excepciones según criterios de aceptación.

No mezcles puntajes del formulario y v2. Usar una ayuda curada de v2 no equivale a asignar un estado v2 al miembro. Registra fuente, versión, adaptación y compatibilidad de las actividades; incorpora la alternativa que hoy se pierde si confirmas ese hecho. No importes automáticamente todo el catálogo ni inventes fórmulas de pilares. No presentes deterioro sin mediciones comparables, palanca causal sin datos ni propósito integrado sin contraste.

La primera experiencia debe entregar una propuesta explicada y corregible, un próximo paso preparado y lo que se protege. Cada parte de comprensión debe alimentar una decisión o mostrarse explícitamente pendiente. El manifiesto tiene función propia y no sustituye el plan ni bloquea toda acción provisional.

La ayuda debe producir un entregable, guion, contexto o experimento editable; evita frases genéricas del tipo 'mejora tus relaciones'. Diferencia proyectos, acciones puntuales, comportamientos recurrentes y experimentos. Cuenta carga por ocurrencias reales, preparación y revisión, no por cantidad de títulos de acciones.

La revisión separa ejecución, resultado y aprendizaje. Debe poder cambiar contexto o estrategia, avanzar, mantener, cerrar o pedir apoyo. Muestra consecuencias antes de aplicar; guarda una nueva versión sin reescribir pasado ni firma. Usa operaciones atómicas e idempotentes y verifica conflictos según arquitectura existente. Un registro ausente queda desconocido, no omitido. Al volver después de semanas, actualizar contexto y capacidad sin acumular deuda ficticia.

Los casos ficticios son fixtures internos aislados. Sus resultados no son eficacia comprobada ni contenido que deba imponerse a todos los usuarios. Verifica móvil/desktop, refresh y nueva sesión. No basta un recorrido que solo funciona en memoria o con pantallas preescritas.

No añadas como prerrequisito app nativa, pagos, marketplace o pilotos externos. Las pruebas con personas reales vendrán después; registra que la simulación no demuestra comprensión, valor, retención o pago.

Termina con: cambios realizados, trazabilidad, criterios de aceptación comprobados, instrucciones para recorrer los tres casos en la cuenta interna y limitaciones pendientes. Si no puedes implementar alguna parte, identifica exactamente qué falta y deja una propuesta concreta revisable; no presentes el producto como completo.
```

## 20. Documentos de referencia

- `260529-FORMULARIOS-X-PASO.xlsx`: fundamentos y contenido de v1; se conserva sin modificación.
- `MATRIZ_MAESTRA_MK_v2_FOCO.xlsx`: estructura, reglas, catálogo y propósito; scores sin modificación.
- `260619-KM-MARCO-RECTOR.pdf`: intención y alcance del marco; sus aspiraciones no son resultados validados.
- `Markdown pegado.md`: auditoría de implementación del 7 de octubre de 2026.
- `Markdown pegado(1).md`: respuesta del código a la propuesta anterior.
- `mapa_matriz_mk.pdf`: mapa estructural v2.

Este documento convierte esas fuentes en una propuesta operativa. Las conexiones, ejemplos, interfaz y decisiones nuevas están sujetas a revisión; se conserva la procedencia para poder discutirlas y modificarlas sin confundirlas con el método original.
