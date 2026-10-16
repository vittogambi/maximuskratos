# MK: revisión del plan de Opus, profundidad y casos límite

Revisión de producto y especificación de aceptación · 7 de octubre de 2026

## 1. Veredicto y alcance

El plan de Opus es una base válida para continuar. Conserva el scoring v2, reutiliza entidades, conecta el cambio con evidencia y revisión y contempla las tres entradas. Antes de implementarlo por completo, necesita precisar cómo conserva la profundidad, cómo recomienda fuera de los ejemplos, cómo representa el pasado y cómo responde a datos faltantes o cambios simultáneos.

Este documento complementa `MK_producto_recorrido_completo.md` y corrige sus puntos señalados aquí. Las decisiones nuevas son propuestas de producto, no modificaciones aprobadas de la matriz ni conclusiones de usuarios reales.

Los últimos dos archivos adjuntos, `Markdown pegado(2).md` y `Markdown pegado(3).md`, tienen el mismo contenido. Revisé ese plan contra la especificación, la v1 y la v2. Los hechos sobre archivos y funciones del repositorio son los reportados por Opus; no pude volver a verificarlos en el código porque ese repositorio no está en este espacio.

No hay una lista finita que garantice todos los casos futuros. Aquí se definen reglas generales, 108 casos concretos y pruebas de combinación para que un caso nuevo tenga una salida explícita, en lugar de recibir silenciosamente el guion de otro caso.

Prioridades de aceptación:

- **P0:** integridad, propiedad de datos, aplicación de cambios y compatibilidad de acciones. Debe resolverse antes de permitir el comportamiento afectado.
- **P1:** profundidad, orientación, ayuda y continuidad. Debe resolverse antes de presentar el recorrido completo como terminado.
- **P2:** mejoras de presentación que pueden iterarse sin perder información ni cerrar una salida necesaria.

El número de tablas o pantallas no mide calidad. La experiencia tiene que ayudar a comprender una situación, tomar una decisión propia, preparar algo que se pueda hacer y aprender de lo ocurrido.

## 2. Qué aceptaría y qué corregiría del plan

| Propuesta de Opus | Veredicto | Cambio o condición |
|---|---|---|
| Scoring v2 congelado | Conservar | Verificar que el contenido y hash de la definición siguen iguales; no agregar inferencias de propósito o causalidad |
| Biblioteca separada para alternativas | Aceptar; corrige mi instrucción anterior | Recuperar también seguridad/límite y vínculo de propósito, con ID, fila, versión y adaptación; no editar la definición congelada |
| Ejercicio breve de identidad | Complementar | Debe convivir con el recorrido profundo y sus diez ítems v1, sin inventar subtotal ni reemplazarlo por un campo de texto |
| Sombra como relato de una situación | Complementar | Conservar reconocimiento de patrones, emociones, proyección, excusas y recursos de integración; no transformar etiquetas en diagnóstico |
| Primer paso antes de diez fichas del formulario | Aceptar | La profundidad continúa disponible y guiada; las condiciones realmente necesarias para una ayuda se resuelven antes de ofrecerla |
| Precargar los campos del cambio | Aceptar con límites | Reutilizar respuestas y ofrecer defaults. No inventar un motivo, una causa, una ventana o una evidencia que la persona no aportó |
| Todos los vacíos pasan a no aplica con razón | Corregir | Diferenciar desconocido, pendiente, no explorado, no aplica y preferencia de no responder; validar campos según tipo y fase |
| Capacidad en minutos como único tope | Corregir | Añadir oportunidad real, esfuerzo percibido, recursos, dependencias y límites explícitos; distinguir tiempo nuevo de prácticas ya instaladas |
| Regla determinista de tensiones | Acotar | Detectar solapes y restricciones estructuradas. Para tensiones narrativas, mostrar el contraste y pedir confirmación; no fingir comprensión semántica |
| Diez actividades para todos los casos | Insuficiente para declarar cobertura | Definir qué necesidades y ámbitos cubre cada ayuda y qué salida hay cuando falta contenido compatible |
| V2 como contexto mientras formulario sigue activo | Mantener separación, aclarar alcance | Definir profundidad opcional de evaluación v2 por ámbito si se quiere recorrer la matriz completa; no llamar estado v2 a una lectura del formulario |
| Dominio bloqueado impide activar todo cambio | Corregir por compatibilidad | Restringir las acciones incompatibles y conservar orientación o preparación de apoyo permitidas; evitar bloqueos globales innecesarios |
| Revisión por cambio, default siete días | Aceptar | No debe convertirse en una puerta obligatoria que impida hacer, pedir ayuda o explorar mientras está vencida |
| Una misma función para preview y apply | Aceptar y completar | Comparar versiones y dependencias utilizadas; revalidar cuando cambió contexto, plan o información relevante |
| Transacción, idempotencyKey y count igual a uno | Necesario, no suficiente | El predicado debe comprobar usuario, versión esperada y estado. La clave se vincula a operación y payload; probar concurrencia |
| ActionRecord con occurrenceKey | Completar diseño temporal | Separar oportunidad comprometida de observación; usar versiones y claves estables que no reconstruyan el pasado desde el calendario actual |
| Índice de un foco activo por usuario | Aceptar después de migrar | Resolver los múltiples planes activos existentes con una elección explícita antes de aplicar el índice |
| Mantener, modificar y retirar en etapa A, reemplazar en B | Evitar dos implementaciones divergentes | Reutilizar la lógica canónica del nuevo núcleo mediante adaptador, conservando lecturas antiguas y mensajes veraces |
| IKIGAI vinculado al miembro | Aceptar | Verificar propiedad en cada endpoint y distinguir sesión anónima de sesión vinculada; elegir hipótesis no confirma automáticamente el experimento |
| Reloj y fixtures al final | Adelantar infraestructura mínima | Sembrar casos y simular fechas desde el primer recorrido persistido; ampliar la matriz después |
| Todas las fechas por SimulationClock | Acotar | Solo fechas del recorrido del fixture; autenticación, expiración de credenciales y cualquier efecto real siguen en tiempo real |
| Inicio con estatua y círculos | Condicionar a utilidad | La próxima acción domina el primer viewport móvil; eliminar accesos decorativos que no aporten significado |
| Cuatro pestañas más siete destinos | Simplificar | Consolidar Mi ruta, Ruta MK y hoja de ruta; el manifiesto debe identificarse como documento y la revisión puede ser contextual |
| Capturas y UX al final | Adelantar y repetir por necesidad | Definir flujo y lenguaje antes del esquema; comprobar móvil, teclado y recuperación de errores en cada recorrido construido |

El plan declara «decidido contigo» para seguridad y acceso. Se conservan como decisiones que Opus reporta de esa conversación, con su procedencia explícita. Esta revisión no autoriza nuevos cambios de roles, suscripciones o publicación. El agente debe verificar la política efectiva en el servidor y no confundir cuenta de prueba con permiso.

## 3. La profundidad necesita un recorrido propio

Recomiendo dos formas conectadas de usar el mismo producto:

1. **Trabajar algo de ahora:** la persona llega con una preocupación y prepara un cambio con comprensión provisional. Puede incorporar más profundidad cuando influya en una decisión.
2. **Recorrer el proceso MK:** la persona explora de manera guiada la metodología, conserva sus ejercicios y síntesis y puede convertir una conclusión en un cambio. También puede profundizar sin tener un foco operativo activo.

La segunda debe ser visible y recorrible, con un orden recomendado, motivo de cada paso, ayuda, pausas y reentrada. No basta un hub con doce enlaces a doce textareas. La primera no puede exigir resolver toda la vida antes de actuar.

Una parte de la metodología puede tener valor por comprenderla o integrarla, aunque todavía no genere una tarea. «Alimentar el plan» no debe reducir todo el sentido a productividad. Las experiencias valiosas en sí mismas, el descanso, la pertenencia, la trascendencia y las relaciones pueden protegerse y revisarse sin convertirse en metas de rendimiento.

### Contrato mínimo de cada componente

Cada componente necesita: intención del método; preguntas y ejercicios trazables; secuencia recomendada; un ejemplo; profundidad disponible; salida personal editable; condiciones de calidad explícitas; estado honesto; conexiones posibles con decisiones; y una forma de volver sobre lo aprendido.

Los textos de ayuda nuevos se identifican como adaptación. Los ejercicios v1 se mantienen disponibles donde corresponda, sin ejecutar fórmulas incompletas ni atribuir validez clínica a sus etiquetas. Si se usa una evaluación v2 real, su resultado conserva fuente y versión; no se reemplaza por un resultado del ejercicio narrativo.

| Componente | Profundidad que debe conservarse | Salida y uso real |
|---|---|---|
| Origen | Nombre, historia y pertenencia; herencias valoradas; patrones a conservar o transformar; posibilidad de desconocer o no compartir la historia familiar | Narrativa propia y recursos elegidos; referencias culturales y simbólicas como marco, sin afirmar destino biológico |
| Visión | Imagen de largo plazo, martes ordinario, experiencias buenas en sí mismas, beneficiarios y renuncias; preguntas existenciales de v1 disponibles y opcionales | Visión y escenas concretas que ayudan a elegir y proteger una vida cotidiana |
| Valores | Exploración amplia v1 y contraste con decisiones; los cinco valores de la salida v2 no son equivalentes a todos los listados v1 | Valores definidos por la persona, ejemplos y tensiones; motivo y criterios de elección |
| Estándares | Conductas por valor, hábitos, trascendencia, familia, amistad y trabajo significativo; los cinco estándares v2 incluyen revisión y consecuencias | Reglas practicables, límites y mantenimiento; diferencia entre estándar elegido y exigencia irreal |
| Identidad | Diez ítems v1, autopercepción, discurso y acción, responsabilidad, esfuerzo y hábitos; ejemplos y contraejemplos | Comprensión de brechas y conductas a practicar; no una identidad definitiva ni subtotal reconstruido |
| Interferencia | Reconocimiento de PR, ER, PY y D; situaciones, emociones, interpretaciones, conductas y consecuencias | Patrón reconocido por la persona y una estrategia posible; restricciones reales no se etiquetan automáticamente como excusas |
| Integración | Recursos IN, límites, vulnerabilidad, compasión, flexibilidad y aprendizaje | Recursos y apoyos que hacen viable el cambio; conservar separación respecto de interferencia |
| Tendencias | Preferencias y sus ejemplos; contexto en que cambian; límites del cuestionario breve | Formato, entorno y comunicación preferidos; no diagnóstico de personalidad ni impedimento para una meta |
| Hipótesis | Cuatro lentes y relación manual; una a tres hipótesis completas; alternativas y dudas | Hipótesis guardadas y una elección explícita; dirección vital distinta de exploración vocacional |
| Contraste | Pregunta del experimento, 30/60/90 días, seis criterios, desconocidos y evidencia que podría contrariar la idea | Plan de experimento y decisión posterior; concluir un experimento no equivale a propósito integrado |
| Huella | Beneficiarios, responsabilidades, obra, continuidad y legado; preguntas v1 más allá de una frase grandiosa | Impacto deseado concreto; utilidad para alguien y límites de alcance |
| Alineación | Objetivos frente a valores, estándares e hipótesis; tensiones y renuncias discutibles | Mapa explícito de coherencias y decisiones, sin un porcentaje global de valor humano |

Cambiar una reflexión crea una nueva revisión de ese componente. El plan vigente mantiene la referencia a la revisión que utilizó. La app puede ofrecer reconsiderar una tensión nueva; no reescribe automáticamente el plan ni el manifiesto firmado.

### Estados honestos

No usar un único check de completado. Separar, según el componente:

- Recorrido o ejercicio pendiente, en borrador, trabajado o por revisar.
- Salida disponible, provisional o con información pendiente.
- Hipótesis guardada, elegida, en contraste o revisada, según el flujo existente.

«Trabajado» no demuestra transformación ni integración. Saltar una pregunta por preferencia no equivale a que no aplique. En particular, el criterio de Opus «cada componente tiene feed o pendiente» no demuestra una implementación completa: permite que todos queden pendientes. Para aceptar el producto, cada componente debe poder recorrerse y producir su salida funcional.

## 4. La matriz completa y los diagnósticos necesitan una definición explícita

El plan conserva los resultados del formulario como contexto y utiliza una biblioteca curada. Eso puede construir un recorrido útil, pero deja sin resolver qué papel tienen los cuatro estados, los planes por estado y la evaluación profunda de cada ámbito de la v2.

Propongo mantener dos evaluaciones separadas cuando corresponda:

- Los resultados del formulario existentes siguen accesibles, con catálogo, fecha y versión. No se recalculan para aparentar resultados v2.
- Una profundidad opcional de evaluación v2 por ámbito puede reutilizar el motor congelado y sus entradas compatibles. Se completa progresivamente y conserva estados de cobertura. El agente debe verificar qué sesiones, modelos y componentes puede reutilizar antes de proponer tablas nuevas.

No se exige responder las 187 preguntas para obtener un primer paso. Si una evaluación compatible aporta un estado, este ayuda a comprobar qué planes y actividades son elegibles; el foco sigue siendo una elección asistida y explícita. Si faltan respuestas suficientes, el ámbito queda no evaluado o provisional según las reglas originales, sin interpretar eso como estado cero.

Los índices específicos que la v2 declara para identidad, interferencia e integración pertenecen a esa evaluación y permanecen separados. No se inventan para las narrativas nuevas ni se suman en un score de propósito.

Esta ruta debe definirse en el plan si se pretende afirmar que se puede recorrer la matriz v2 completa. Si se difiere, el informe debe decir exactamente qué parte todavía no es recorrible. Conservar el JSON en el laboratorio no preserva por sí solo esa experiencia para el miembro.

## 5. Recomendaciones útiles fuera de los tres fixtures

La entrada describe cómo llega la persona; no determina qué vida quiere ni qué problema tiene. Alguien sobrecargado puede necesitar ordenar obligaciones, aprender una habilidad, negociar un límite o solicitar apoyo. No toda sobrecarga se resuelve mediante una conversación de pareja. La incertidumbre puede ser vital, vocacional o simplemente sobre el próximo objetivo.

La propuesta debe combinar datos explícitos: situación, resultado o pregunta de exploración, ámbito pertinente, barrera confirmada o desconocida, capacidad, oportunidad, restricciones y tipo de cambio. Después ofrece una estrategia compatible y una ayuda concreta.

### Contrato de una ayuda curada

Cada ayuda debe indicar a qué sirve, cuándo no corresponde, qué necesita saber, qué produce, fuente y adaptación, recurso o requisito, esfuerzo/tiempo estimado, versión mínima y alternativa. Añadir el vínculo de propósito del xlsx como referencia; vincularlo a los valores del miembro requiere su confirmación.

Las diez actividades propuestas cubren varios casos de proyectos y relaciones. Se necesita una matriz de cobertura para los cuatro ámbitos, los cuatro tipos de cambio y las barreras relevantes. No se exige una plantilla por cada combinación ni publicar automáticamente las 96; se exige saber qué se puede ofrecer y cómo actuar ante una necesidad no cubierta.

Salidas posibles cuando falta contenido: una ayuda general compatible para definir el siguiente paso; una petición de información pertinente; un plan redactado por la persona con estructura; preparación de apoyo; o reconocimiento explícito de que MK no dispone de esa guía. Nunca sustituir silenciosamente un caso desconocido por el ejemplo de Diego.

### Personalización verificable

No precargar como hechos un miedo, un motivo, un equipamiento, una fecha, una disponibilidad ni una causa. Los defaults operativos se muestran como propuestas. Las respuestas ya aportadas se reutilizan y se pueden corregir.

Un algoritmo determinista puede detectar que un bloque invade una ventana protegida. No puede concluir que una frase libre viola un valor sin una representación definida. Para esa tensión, la app muestra ambos elementos y pregunta cómo los interpreta la persona.

## 6. Cambios, acciones y tiempo

### Campos según tipo y fase

En borrador se permite no saber. Para confirmar un cambio se necesita una intención propia, un paso o una condición de espera explícita, contexto viable o pendiente identificado, evidencia pertinente, revisión y compatibilidad. La exigencia exacta varía:

- Proyecto: alcance, hito, entregable y dependencias.
- Recurrente: comportamiento, contexto, cadencia y mantenimiento.
- Puntual: salida, oportunidad y cierre.
- Experimento: hipótesis elegida o pregunta exploratoria compatible, horizonte, experiencia, criterios y evidencia.

Una fecha límite puede no aplicar a un mantenimiento, pero su revisión sí importa. Un estado de espera puede no tener una acción esta semana; necesita dependencia y fecha para reconsiderar. «No aplica» no completa un resultado indefinido.

### Capacidad

Registrar el tiempo disponible para nuevos cambios y las oportunidades donde cabe, sin volver a descontar obligaciones que la persona ya consideró. Contar preparación, ocurrencias y revisión una sola vez según su unidad. Añadir límites relevantes: recursos, esfuerzo percibido, necesidad de otra persona, recuperación y restricciones expresas.

Una semana con cero capacidad admite pausa, preparación breve elegida o conservación de prácticas ya instaladas. No debe crear una obligación mínima por defecto. Sobrepasar la capacidad puede generar una tensión aceptada cuando es solo estimación; una razón escrita nunca permite superar una restricción incompatible.

### Compromiso previsto separado de observación

Una ocurrencia prevista debe tener identidad estable y referencia a la versión del compromiso: acción, oportunidad o ventana, fecha o período, zona pertinente y variante prevista. El registro describe lo ocurrido: completa, mínima, parcial, omitida explícitamente o no aplicable con razón. Lo desconocido deriva de que cerró una oportunidad comprometida sin observación.

No generar pasado desde los weekdays actuales. Las versiones nuevas afectan el futuro elegido; las oportunidades pasadas y sus registros permanecen explicables. Si se deriva el calendario, debe derivarse desde versiones históricas y ventanas fijadas; si se materializa, debe ser idempotente. El agente debe decidir la representación según el modelo real y documentar el invariante.

`weekdays[]` y `timesPerWeek` requieren una regla de exclusión o composición. Una acción sin día puede ser flexible dentro de una ventana; no se inventa una fecha exacta. Ante un desencadenante, el número de oportunidades puede ser desconocido: no fabricar un denominador de cumplimiento.

Reprogramar una oportunidad conserva su procedencia y evita contar doble la ejecución. Los registros heredados por día permanecen heredados; no prueban ocurrencias que nunca estuvieron previstas. El denominador cero se muestra sin porcentaje, y la versión mínima no se cuenta como resultado completo.

## 7. Revisiones, decisiones y concurrencia

Preview y apply utilizan la misma transformación, con la versión del plan, revisión de contexto y dependencias relevantes que el usuario vio. El servidor debe comprobarlas al aplicar. Si cambiaron, solicita actualizar la vista previa en lenguaje cotidiano, sin perder la reflexión escrita.

La idempotencyKey se asocia a usuario, operación y payload. Repetir la misma petición devuelve el mismo efecto; reutilizar la clave con otro contenido se rechaza. Dos peticiones con claves distintas tampoco pueden aplicar dos cambios incompatibles sobre la misma versión esperada.

La transacción incluye versión, acciones, oportunidades futuras, revisión aplicada, foco y estado. `updateMany` con `count === 1` solo demuestra el control si su predicado comprueba propietario, versión esperada y estado pertinente. No basta que haya una fila con ese ID.

El usuario debe poder continuar actuando o pedir ayuda con una revisión vencida. Separar permisos y requisitos de una acción de la sugerencia `pickNext`. Ante retorno, actualizar contexto antes de exigir explicar tres semanas de actividad desconocida. No se pierde la posibilidad de consultar el pasado.

La revisión puede descubrir estrategia inadecuada, falta de oportunidad, necesidad de aprender, pérdida de sentido, exceso de carga, evidencia insuficiente o dependencia externa. La persona confirma la interpretación. Cambiar foco, pausar, cerrar y reabrir son transiciones explícitas; terminar no genera otro cambio automáticamente.

## 8. Compatibilidad y apoyos

El plan no explica cómo recoge las condiciones adicionales de varias preguntas v2. Por ejemplo, D-REL-15 combina respuesta y violencia/coerción declarada; D-FIN-09 combina respuesta y mora o riesgo de pérdida de vivienda/servicios; D-CUE-25 combina respuesta y conducta riesgosa declarada. Llamar al evaluador con ocho respuestas no demuestra que esas condiciones estén representadas.

El agente debe contrastar texto de la regla, tipo de respuesta, contexto requerido y comportamiento real del evaluador. Mantener intacto el motor y completar la captura o el adaptador compatible fuera de la definición cuando sea necesario. Si el evaluador no permite representar una condición, documentar la limitación en lugar de afirmar que está resuelta.

No responder no equivale a responder no. Las ayudas declaran qué información necesitan. La pregunta pertinente se solicita cuando la ayuda la requiere, aunque el usuario haya clasificado su objetivo en otro ámbito.

La restricción corresponde al tipo de acción y al alcance de la regla: un ejercicio incompatible puede quedar restringido mientras la preparación de una consulta sigue disponible. No vaciar todo el ámbito ni impedir comprender, registrar evidencia o acceder a orientación permitida.

Un cambio relevante de contexto exige reconsiderar la compatibilidad. La versión del plan conserva la evaluación usada al confirmarlo. Una alerta del formulario previa no se borra porque una nueva evaluación v2 esté ausente; las fuentes se muestran separadas y los conflictos se aclaran.

Guardar una solicitud de apoyo no significa enviarla ni garantizar respuesta. La interfaz debe reflejar las capacidades reales del servicio y conservar una salida útil mientras espera. Los fixtures no deben producir comunicaciones ni efectos externos reales.

## 9. Migración y continuidad

Antes de imponer un foco único, identificar planes existentes y ofrecer elegir foco, mantenimiento, pausa o archivo. Conservar contenido y registros; no escoger el más reciente como decisión vital automática.

La migración es aditiva y verificable. Las filas antiguas sin cadencia, capacidad o evidencia pueden abrirse como planes heredados con datos por completar. No se rellenan mediante historias ficticias. Las URLs antiguas mantienen una salida hacia su contenido correspondiente; un redirect global a un nuevo cambio vacío pierde continuidad.

Las firmas antiguas muestran el texto plano guardado. Las nuevas guardan el snapshot estructurado y su contenido exacto. El texto del builder actual nunca sustituye lo firmado. Una corrección posterior es una revisión nueva.

La política de sesión IKIGAI debe distinguir propiedad por token anónimo y por usuario vinculado. El JWT no puede acceder a una sesión ajena solo por conocer su ID. No reclamar sesiones anónimas por email o nombre. Si vincular una sesión propia no está en alcance, mantener acceso al trabajo anterior y explicar cómo continuar sin atribuir propiedad inexistente.

ADMIN es el actor de control de simulación; FIXTURE es la cuenta objetivo. Probar ambos por separado. Un ADMIN real puede gestionar un fixture autorizado; no puede mover el reloj o reiniciar a un miembro real. El reloj simulado no altera expiraciones de autenticación ni otros relojes reales.

## 10. Experiencia móvil y autonomía

La interfaz puede tener profundidad sin pedir largas respuestas en todas las pantallas. Usar ejemplos, selección, una pregunta pertinente por momento, edición breve y acceso al ejercicio completo. Reutilizar información durante el proceso sin pedir que la persona vuelva a escribirla. Al fallar una petición, conservar el borrador y explicar qué quedó guardado.

Consolidar navegación alrededor de Hoy/Inicio, el cambio y su evolución, y el proceso de comprensión. Revisar puede ser una acción contextual y también una vista accesible. El manifiesto tiene un nombre propio; Mi ruta y Ruta MK no deben parecer productos distintos.

Mantener marca, tipografía y shell existentes donde corresponda. IKIGAI de miembro conserva su contrato específico. La estatua o los círculos se conservan solo si ayudan a orientarse; no desplazan el próximo paso en móvil ni sugieren cifras que no existen.

Ofrecer captura rápida dentro de un cambio o como pendiente, sin crear un plan paralelo. Permitir que alguien con una meta clara redacte su propuesta usando la estructura y las ayudas. Elegir foco simplifica la atención, pero no debe quitar agencia.

No usar rachas como prueba de transformación, etiquetas morales por omisión ni puntuación de dignidad. La app puede ser exigente con decisiones y evidencia sin convertir restricciones reales en defectos personales. Un cambio conseguido, una hipótesis descartada con información o una práctica sostenida con menos uso de la app pueden ser resultados positivos.

## 11. Matriz de 108 casos límite

Esta matriz define comportamiento esperado. No afirma que esté implementado o probado en el repositorio. Las pruebas de API observan persistencia y permisos; las de recorrido observan decisiones y continuidad; los ejercicios y significados necesitan también revisión manual.

### A. Contexto y recomendación

| ID | Prioridad | Situación | Comportamiento y comprobación |
|---|---|---|---|
| A01 | P1 | Incertidumbre y sobrecarga simultáneas | Elegir dónde empezar sin borrar la otra preocupación. Cambiar la entrada conserva contexto y pendientes. |
| A02 | P1 | Quiere actuar hoy sin completar el formulario | Preparar un paso compatible con contexto suficiente; diagnóstico profundo accesible después. Probar entrada sin sesión de diagnóstico cerrada. |
| A03 | P1 | Meta «estar mejor» | Ayudar a concretar una diferencia o experiencia de exploración; no fabricar un resultado numérico. Probar salida editable y provisional. |
| A04 | P1 | Todo parece urgente | Contrastar urgencia real, límites y oportunidad con el usuario; guardar elección y razones para esperar. No elegir automáticamente el score más bajo. |
| A05 | P1 | Rechaza la propuesta | Corregir foco y estrategia; invalidar ayudas incompatibles y guardar la corrección. Probar que la pantalla siguiente realmente cambia. |
| A06 | P1 | No conoce su bloqueo | Conservar causa desconocida y ofrecer opciones de exploración. No asignar motivación, miedo o autosabotaje por ausencia de registro. |
| A07 | P1 | Necesidad fuera de la biblioteca | Mostrar alcance de ayuda disponible, estructura general o preparación de apoyo. No reutilizar silenciosamente un guion de otro ámbito. |
| A08 | P1 | Objetivo cruza ámbitos | Etiquetas múltiples compatibles y requisitos de las ayudas; no duplicar cambios ni sumar dos veces la carga. |
| A09 | P1 | Quiere cultivar amistad o presencia | Proponer una experiencia o práctica valiosa, con evidencia cualitativa. No pedir monetización ni convertir personas en métricas de rendimiento. |
| A10 | P1 | Texto y respuesta estructurada se contradicen | Mostrar ambas fuentes y aclarar la decisión pertinente. No sobrescribir una con la otra ni inferir una certeza. |
| A11 | P0 | Existe el formulario, falta evaluación v2 suficiente | Lecturas separadas; estado v2 no evaluado/provisional según método. Probar que faltar datos no produce contención por score cero. |
| A12 | P0 | Contexto cambia después de proponer | Mantener propuesta histórica y reconsiderar la vigente. No confirmar un plan con restricciones o capacidad desactualizadas sin revisión. |

### B. Profundidad de los doce componentes

| ID | Prioridad | Situación | Comportamiento y comprobación |
|---|---|---|---|
| B01 | P1 | Origen desconocido, adopción o historia familiar difícil | Permitir desconocer/no compartir; trabajar pertenencia y recursos elegidos sin exigir genealogía ni afirmar herencia como destino. |
| B02 | P1 | Una pregunta existencial de visión resulta abrumadora | Permitir pausa o una alternativa de visión cotidiana; conservar acceso al ejercicio original y el estado pendiente. |
| B03 | P1 | Dos valores entran en tensión | Contrastar una decisión concreta y registrar renuncia, contexto y revisión. No resolverla por orden del listado ni marcar incoherencia moral automática. |
| B04 | P1 | Estándar elegido es imposible esta semana | Revisar alcance y excepción explícita sin borrar la intención histórica. No tratar el ajuste como debilidad ni volver negociable una restricción incompatible. |
| B05 | P1 | Identidad aspiracional difiere de hábitos | Acceso a los diez ítems y ejemplos; distinguir aspiración y evidencia. No diagnosticar identidad ni inventar subtotal v1. |
| B06 | P1 | Una interferencia podría ser una restricción externa real | Explorar hechos y lo controlable; permitir corregir interpretación. No declarar excusa, victimismo o proyección a partir de un relato. |
| B07 | P0 | Interferencia alta y recursos de integración presentes | Mantener lecturas separadas; no sumarlas para fabricar un resultado global. Probar fuentes e índices solo cuando la evaluación compatible existe. |
| B08 | P1 | Quiere actuar fuera de sus preferencias de tendencias | Ofrecer formato o apoyo, sin impedir la meta ni fijar personalidad. Registrar preferencia actual y contexto. |
| B09 | P1 | Hipótesis formada con elementos de filas distintas | Conexión manual y enunciado completo; no emparejamiento por fila ni exigencia artificial de cuatro coincidencias. |
| B10 | P0 | Contraste contiene datos pendientes | Guardar evidencia y desconocidos por criterio. No rellenar cero, inventar resultado ni declarar hipótesis válida por completar el formulario. |
| B11 | P1 | Huella consiste en cuidar a alguien cercano | Reconocer beneficiarios y responsabilidades sin exigir fama, empresa o legado grandioso. Mantener preguntas profundas de v1 disponibles. |
| B12 | P0 | Cambian valores después de firmar o confirmar plan | Nueva revisión del componente, tensión visible y reconsideración opcional. Firma y versión histórica del plan siguen exactas. |

### C. IKIGAI y experimentos

| ID | Prioridad | Situación | Comportamiento y comprobación |
|---|---|---|---|
| C01 | P0 | Guarda hipótesis sin elegir | No crear dirección elegida ni experimento. Probar estado antes y después de guardar. |
| C02 | P0 | Elige hipótesis sin preparar experimento | Crear dirección y borrador si corresponde; confirmar experimento requiere sus datos. No activar una experiencia incompleta automáticamente. |
| C03 | P0 | Cambia a otra hipótesis | Conservar la anterior y su evidencia; pausar, cerrar o continuar mediante decisión explícita. No reciclar el resultado anterior como prueba de la nueva. |
| C04 | P0 | Edita el texto de una hipótesis con experimento activo | Versionar y conservar qué enunciado se contrastó. Probar que la evidencia antigua sigue vinculada a su revisión original. |
| C05 | P0 | Un criterio vale cero y otro es desconocido | Diferencia persistida y visible; no convertir null en cero ni omitirlo del resumen sin explicación. |
| C06 | P1 | Quiere cerrar en el día siete un experimento de treinta | Registrar aprendizaje intermedio o cierre anticipado explícito. No representar que se cumplió el horizonte previsto. |
| C07 | P0 | Cambia horizonte de treinta a sesenta días | Nueva decisión y revisión del experimento; ajustar fechas futuras y conservar la expectativa original. No extender automáticamente. |
| C08 | P1 | Explora vida cotidiana, no vocación comercial | Ruta vital disponible; no forzar IKIGAI económico como requisito para toda dirección. La exploración vocacional conserva sus lentes y criterios. |
| C09 | P1 | La experiencia contradice la hipótesis | Permitir cambiar formato, reformular o descartar con evidencia. No repetir automáticamente una versión menor del mismo intento. |
| C10 | P1 | Enfermedad o dependencia impide observar un criterio | Resultado inconcluso explícito y opción de nueva oportunidad. Ausencia de observación no cuenta como prueba negativa de la hipótesis. |
| C11 | P1 | Tiene tres hipótesis guardadas y quiere probarlas juntas | Distinguir alternativas guardadas de compromiso activo; revisar carga y foco. No programar tres experimentos por haber guardado tres textos. |
| C12 | P1 | Completa experimento y todas sus tareas | Cerrar el experimento con aprendizaje; no declarar propósito integrado por la ejecución. Mantener evidencia, incertidumbre y decisión propias. |

### D. Capacidad, tipos de cambio y dependencias

| ID | Prioridad | Situación | Comportamiento y comprobación |
|---|---|---|---|
| D01 | P1 | Capacidad declarada cero | Permitir pausa o mantenimiento ya instalado; no asignar obligación mínima. Probar Inicio con continuidad y sin porcentaje de fallo. |
| D02 | P1 | No sabe cuánto tiempo tiene | Capacidad pendiente o estimación propuesta; preparar una oportunidad antes de confirmar carga. No guardar cero como disponibilidad real. |
| D03 | P1 | Tiene minutos pero no recursos o consentimiento | Registrar requisito/dependencia y alternativa. La carga temporal baja no convierte la acción en viable. |
| D04 | P1 | Preparación y revisión sirven a varias acciones | Contarlas según unidad, sin multiplicarlas por cada acción. Probar ejemplos con total conocido. |
| D05 | P0 | Bloques solapan una ventana protegida | Detectar desde horarios estructurados y ofrecer otra oportunidad o reconsideración explícita. Una restricción incompatible no admite override por una razón escrita. |
| D06 | P1 | Una única acción necesita varias sesiones | Definición única, ocurrencias múltiples y carga total. No confundir un título con un minuto ni con una tarea por semana. |
| D07 | P1 | Versión mínima se ejecuta en lugar de completa | Variante registrada y evidencia parcial; no marcar el resultado completo ni borrar lo previsto. |
| D08 | P1 | Hizo parte del paso | Permitir progreso parcial y siguiente parte, sin inventar DONE total ni perder el trabajo producido. |
| D09 | P1 | Espera respuesta de otra persona | Dependencia y próxima revisión; conservar resultado bajo influencia limitada. No fabricar tareas para llenar una semana sin oportunidad. |
| D10 | P1 | Un proyecto pasa a mantenimiento | Transición explícita y nueva versión; evitar continuar hitos ya terminados. Historial del proyecto sigue accesible. |
| D11 | P1 | Capacidad baja tras un imprevisto | Vista de lo que no cabe y elección de qué mover, reducir o pausar. No recortar silenciosamente compromisos. |
| D12 | P1 | Ya mantiene varias prácticas que funcionan | Conservarlas como contexto protegido, sin crear varios cambios ni volver a contar carga ya descontada. Separar práctica estable de nuevo mantenimiento programado. |

### E. Ocurrencias, calendario y datos ausentes

| ID | Prioridad | Situación | Comportamiento y comprobación |
|---|---|---|---|
| E01 | P0 | Una hecha, una omitida y una sin registro | Mostrar los tres estados y denominadores correctos. No denominar incumplimiento a desconocido. |
| E02 | P0 | Hay weekdays y timesPerWeek a la vez | Regla explícita de exclusión/composición; no duplicar oportunidades o minutos. Probar rechazo o normalización trazable. |
| E03 | P0 | Dos oportunidades el mismo día | Identidades distintas; un registro no completa ambas. La clave no puede ser solo acción más fecha. |
| E04 | P1 | Frecuencia flexible sin día elegido | Ventana y oportunidades flexibles, sin fecha exacta inventada. No declarar atraso diario antes de cerrar la ventana. |
| E05 | P1 | Acción ante un desencadenante que no ocurrió | No aplicable o ausencia de oportunidad según regla; no denominarla omisión ni inventar frecuencia. |
| E06 | P0 | Cambia de una a tres veces por semana | Solo futuro autorizado; el pasado conserva una vez. Probar resumen histórico antes y después de modificar frecuencia. |
| E07 | P0 | Reprograma una oportunidad | Procedencia y ventana nueva explícitas; evitar doble ejecución o doble fallo. No perder el compromiso original en la historia. |
| E08 | P0 | Semana cerrada recibe modificación | Conservar cierre y datos; nueva versión futura o nota posterior según política. No alterar retroactivamente denominadores. |
| E09 | P0 | Marca cerca de medianoche | Asignar a la oportunidad, no a la fecha UTC accidental. Probar zona local y servidor diferentes. |
| E10 | P0 | Cambio horario de verano | Regla para hora inexistente/repetida y claves estables. No duplicar, perder o mover silenciosamente oportunidades. |
| E11 | P0 | Viaja o cambia zona horaria | Elegir qué zona siguen las oportunidades futuras; pasado conserva su contexto. Evitar recalcular todo desde America/Santiago por defecto. |
| E12 | P0 | No hubo oportunidades previstas | Denominador cero y texto sin porcentaje; evidencia de resultado puede existir. No mostrar 100 % ni fracaso por una semana vacía. |

### F. Revisión, reintentos y ciclo de vida

| ID | Prioridad | Situación | Comportamiento y comprobación |
|---|---|---|---|
| F01 | P0 | Plan cambió después del preview | Rechazar apply obsoleto y regenerar vista conservando reflexión. Comprobar expectedVersion y propietario, no solo existencia del ID. |
| F02 | P0 | Capacidad/restricción cambió después del preview | Revalidar dependencia pertinente y mostrar diferencias antes de aplicar. No mantener una propuesta incompatible por tener planVersion igual. |
| F03 | P0 | Misma clave, mismo payload | Un efecto y misma respuesta recuperable. Probar doble clic y reintento de red. |
| F04 | P0 | Misma clave, payload diferente | Rechazo explícito; no devolver silenciosamente un resultado ajeno a la nueva decisión. |
| F05 | P0 | Dos claves distintas sobre misma versión | Una aplicación válida; la otra reconsidera versión actual. Probar concurrencia real, no dos llamadas secuenciales. |
| F06 | P0 | Respuesta se pierde después de commit | Consultar o repetir idempotentemente y mostrar estado vigente. No crear acciones nuevas porque el cliente cree que falló. |
| F07 | P0 | Falla una escritura intermedia | Rollback de revisión, versión, acciones y futuro relacionado. No dejar Inicio anunciando ajuste parcial. |
| F08 | P0 | Cierre antiguo y revisión nueva apuntan al mismo futuro | Adaptador o transición inequívoca; no dos motores que aplican dos veces. Probar datos heredados y vigentes juntos. |
| F09 | P1 | Hizo todo pero resultado no se movió | Revisar estrategia, evidencia o alcance; no limitar MODIFY a título o tamaño. Cambio real del próximo paso. |
| F10 | P1 | Resultado mejoró sin registros de acciones | Guardar fuente de resultado y causalidad desconocida. No inventar ocurrencias DONE ni atribuir el avance a MK. |
| F11 | P1 | Vuelve con revisión vencida y contexto cambiado | Actualizar contexto, ofrecer revisión breve o paso viable; mantener acceso a ayuda. No encadenar puertas que lo devuelven al diagnóstico. |
| F12 | P1 | Termina, pausa o cambia de foco | Transición explícita con razón y continuidad. No generar otra meta por defecto ni perder la posibilidad de retomar un cambio cerrado. |

### G. Compatibilidad y apoyo

| ID | Prioridad | Situación | Comportamiento y comprobación |
|---|---|---|---|
| G01 | P0 | Pregunta requerida queda sin respuesta | Estado pendiente/desconocido; no equivalente a no. Limitar ayudas que dependen del dato, conservar orientación compatible. |
| G02 | P0 | D-REL-15 cumple solo parte de la condición | Capturar contexto adicional y contrastar condición compuesta. No declarar regla evaluada completamente con una sola respuesta. |
| G03 | P0 | D-FIN-09 bajo, sin dato de mora/riesgo esencial | Mantener ese dato desconocido y pedir lo pertinente antes de concluir compatibilidad. No inferir deuda urgente ni ausencia de riesgo. |
| G04 | P0 | D-CUE-25 requiere conducta declarada | Representar el contexto requerido y verificar evaluador. No convertir una nota de Excel en una condición supuestamente ejecutada. |
| G05 | P0 | Objetivo etiquetado mental pero ayuda incluye ejercicio | Requisitos por contenido de la ayuda; no evadir condiciones cambiando el dominio elegido. |
| G06 | P0 | Restricción corporal y objetivo de preparar una consulta | Permitir preparación compatible sin ofrecer ejercicio restringido. No bloquear todo el cambio por pertenecer a cuerpo. |
| G07 | P0 | Contexto de interacción insegura | Respetar ruta y límites originales; no proponer confrontación automática. Comprobar que alternativas curadas también son compatibles. |
| G08 | P0 | Hay una condición o medicación, faltan detalles | Preguntar solo lo necesario para compatibilidad; no diagnosticar, modificar indicaciones ni considerar todo permitido por falta de detalle. |
| G09 | P0 | Aparece una alerta nueva con cambio activo | Reconsiderar recomendaciones futuras afectadas; conservar evidencia anterior y otras salidas compatibles. |
| G10 | P0 | El formulario reportó alerta, v2 no existe o difiere | Conservar ambas fuentes y aclarar contexto. No limpiar la alerta por usar otro catálogo incompleto. |
| G11 | P1 | Necesita apoyo, no hay servicio conectado | Ayudar a preparar qué consultar y mostrar capacidad real de MK. Guardar una nota no promete contacto o respuesta. |
| G12 | P0 | Adaptación cambia ejercicio, duración o contexto | Revalidar compatibilidad, fuente y límites; no heredar aprobación de la actividad original sin revisar qué se modificó. |

### H. Migración, propiedad y simulación

| ID | Prioridad | Situación | Comportamiento y comprobación |
|---|---|---|---|
| H01 | P0 | Miembro existente con varios planes ACTIVE | Conservar todos y elegir roles/pausas antes del índice único. Ningún plan se borra ni se elige automáticamente como foco vital. |
| H02 | P0 | Acción antigua sin horario o cadencia | Conservar como heredada sin expectativas inventadas. Registros por día no demuestran oportunidades planificadas retrospectivamente. |
| H03 | P0 | Firma antigua solo tiene texto plano | Mostrar exactamente ese texto, con formato seguro; no reconstruir artículos actuales para reemplazarlo. |
| H04 | P0 | Firma nueva y cambio posterior del builder | Snapshot y contenido histórico inmutables. Corrección crea revisión nueva; el render no ejecuta HTML introducido en respuestas. |
| H05 | P0 | ID de plan, registro o evidencia de otra cuenta | Comprobar propiedad también en relaciones y endpoints secundarios. JWT válido no autoriza un recurso ajeno. |
| H06 | P0 | JWT intenta abrir sesión IKIGAI vinculada ajena | Validar propietario en lectura y mutación. Probar ID conocido, token de otro usuario y credenciales mezcladas. |
| H07 | P0 | Quiere continuar trabajo IKIGAI anónimo previo | Acceso mediante propiedad verificable o continuidad explícita del flujo anterior. No reclamar por nombre/email ni perder el trabajo silenciosamente. |
| H08 | P1 | Componente IKIGAI se usa en público y miembro | Adaptador de autenticación y shell correcto para cada superficie; no regresión del player público ni de guardar/elegir. |
| H09 | P0 | ADMIN real gestiona fixture, o apunta a miembro real | Actor ADMIN, objetivo FIXTURE y flag comprobados por separado. Miembro real nunca se reinicia o cambia de reloj. |
| H10 | P0 | Avanza reloj del fixture | Solo recorrido de esa cuenta cambia; JWT, sesiones y fechas reales siguen intactos. Probar login antes y después del avance. |
| H11 | P0 | Fixture prepara solicitud o genera efectos externos | Aislar efectos reales y destinatarios; no enviar mensajes a personas reales ni mutar cuentas reales. Verificar servidor y jobs. |
| H12 | P0 | Migración o backfill queda a mitad | Operación recuperable y verificable; conteos e invariantes antes del índice. No destruir datos para que compile el esquema. |

### I. Experiencia, recuperación y lenguaje

| ID | Prioridad | Situación | Comportamiento y comprobación |
|---|---|---|---|
| I01 | P1 | Quiere profundidad sin cambio activo | Acceder y recorrer proceso MK; no exigir foco para reflexionar. Las salidas quedan disponibles para decisiones posteriores. |
| I02 | P1 | Ya respondió el dato en el mismo proceso | Reutilizar o permitir seleccionar y corregir. Fuente visible; no pedir copiar manualmente entre diagnóstico, propósito y plan. |
| I03 | P1 | Todos los componentes tienen estado pendiente | No declarar metodología completa del usuario ni implementación verificada solo por mostrar enlaces. Cada componente debe poder recorrerse. |
| I04 | P1 | Revisión vencida, retorno y deseo de actuar ahora | Siguiente sugerencia pertinente y navegación libre compatible. No mostrar revisión antigua como paso obligatorio antes de actualizar contexto. |
| I05 | P1 | Cero capacidad, cero oportunidades o resultado desconocido | Mensajes distintos y sin números ficticios. No presentar ausencia de actividad como deterioro o falta de disciplina. |
| I06 | P0 | Falla el guardado o expira sesión mientras escribe | Conservar borrador con alcance seguro, explicar qué se guardó y permitir retomar. No anunciar éxito antes de respuesta confirmada. |
| I07 | P0 | Respuesta lenta de autosave llega después de una edición | Evitar sobrescribir texto nuevo; revisar versión y orden. Probar peticiones fuera de orden. |
| I08 | P0 | Logout y login de otra persona en dispositivo compartido | Aislar cachés y borradores por cuenta y limpiar vistas sensibles. No mostrar origen, salud o finanzas del usuario anterior. |
| I09 | P1 | Móvil pequeño, teclado o lector de pantalla | Contenido y acciones accesibles, foco y errores comprensibles, sin depender de hover ni color. Verificar recorrido, no solo capturas. |
| I10 | P1 | Movimiento reducido o reflexión emocional difícil | Respetar preferencia de movimiento; permitir pausa y reentrada. No bloquear contenido detrás de animaciones ni forzar continuar el ejercicio. |
| I11 | P0 | Respuesta larga, vacía, acentos o contenido HTML | Validación clara y render seguro; no truncar silenciosamente ni convertir cadena vacía en evidencia. Conservar contenido permitido y errores recuperables. |
| I12 | P1 | Solicitud de ayuda guardada pero no enviada/respondida | Estados y copy veraces, preparación separada de envío; ninguna promesa de contacto que el servicio no pueda cumplir. |

## 12. Combinaciones que deben ponerse a prueba

Además de los casos aislados, recorrer al menos estas combinaciones. Se utilizan datos ficticios y el comportamiento real de las APIs; no se simula la persistencia con textos preescritos.

1. Miembro heredado con tres planes, firma antigua y trabajo IKIGAI anónimo. Selecciona foco, profundiza en valores y cambia capacidad. Todo el contenido permanece accesible y las nuevas decisiones no alteran firma ni resultados anteriores.
2. Sobrecarga, posible restricción de interacción y preferencia de no responder detalles. Se ofrecen salidas compatibles, sin guion de confrontación ni bloqueo global de comprensión.
3. Dos oportunidades diarias, cambio de zona horaria y revisión enviada con conexión cortada. Se recupera una aplicación y ninguna ejecución duplicada; el pasado conserva fechas y compromiso.
4. Experimento de sesenta días con hipótesis editada, resultado contrario y un criterio desconocido. Se distingue enunciado original, evidencia, revisión y decisión; no aparece propósito integrado automático.
5. Resultado declarado logrado sin registros, retorno de tres semanas y nueva visión. Se conserva ejecución desconocida, se acepta la fuente del resultado y se ofrece cerrar o actualizar sin reiniciar diagnóstico.
6. Restricción corporal, objetivo de preparar consulta y mantenimiento ya instalado. Se permite orientación compatible, se evita ejercicio incompatible y no se añade carga ficticia por mantener lo que funciona.

Ampliar con clases equivalentes y combinaciones de tipo de cambio, datos completos/incompletos, estado temporal, compatibilidad y versión vigente/obsoleta. La cobertura no se mide por repetir los tres nombres de fixture.

## 13. Prueba especial de profundidad completa

Además de los tres recorridos rápidos, añadir un caso interno que recorra los doce componentes del proceso MK y una evaluación compatible de un ámbito cuando esa ruta esté en alcance.

Para cada componente, registrar ejercicio usado, respuestas, salida, estado, fuente y una decisión o comprensión concreta que produjo. Debe comprobarse que:

- La profundidad v1 está disponible donde corresponde y no se sustituyó por una única pregunta nueva.
- Los datos se trasladan entre pasos sin copia manual y sin cambiar fuente o versión.
- Visión y estándares modifican una oportunidad o una renuncia cuando la persona confirma esa conexión.
- Interferencia y recursos de integración pueden coexistir sin un total contradictorio.
- La huella define beneficiario y alcance sin exigir grandiosidad.
- La hipótesis elegida produce un experimento confirmado; su aprendizaje puede cambiar la estrategia o la dirección.
- Una nueva revisión de valores no reescribe un plan o manifiesto histórico.
- La persona puede pausar, discrepar, dejar un criterio desconocido y retomar, sin que eso marque su identidad como fallida.

No basta un test que compruebe que hay doce claves o doce rutas. Parte de esta aceptación requiere revisar manualmente la coherencia de los ejercicios y sus consecuencias, además de observar los datos persistidos.

## 14. Orden de implementación revisado

Evitar una migración enorme seguida de una etapa final donde recién se descubre si el recorrido tiene sentido. Construir por tramos que atraviesen datos, lógica, API e interfaz.

1. **Especificación ejecutable del recorrido.** Completar trazabilidad por intención y pregunta, cobertura de ayudas, salidas de los doce componentes y flujo móvil. Confirmar entidades reutilizables y precondiciones de migración. La trazabilidad debe conservar IDs estables por fuente y versión; el número de pregunta v1 no siempre es único.
2. **Integridad y entorno interno mínimo.** Lectura exacta de firma, mensajes veraces, política de acceso explícita y fixtures con reloj de recorrido aislado. Preparar el mecanismo canónico de versiones y oportunidades; evitar una solución de cierre que se deseche y diverja de la siguiente.
3. **Primer recorrido vertical persistido.** Meta trabada desde contexto hasta ayuda, acción, evidencia, revisión y ajuste. Integrar desde aquí visión, valores y estándares como conexiones reales. Comprobar reintentos, sesión nueva, propietario y preview obsoleto.
4. **Profundidad y matriz.** Construir proceso MK guiado, doce componentes con profundidad v1, IKIGAI conectado y la ruta opcional de evaluación v2 por ámbito si se pretende afirmar esa cobertura. Mantener separación de fuentes y scoring original.
5. **Tres entradas y cobertura general.** Incertidumbre vital/vocacional y sobrecarga, con alternativas fuera de los guiones iniciales. Curar ayudas suficientes para los ámbitos y tipos que el producto anuncia; ofrecer salida explícita ante lo no cubierto.
6. **Migración y excepciones integradas.** Probar miembros heredados, todas las familias de la matriz y combinaciones críticas. Añadir las pruebas a la etapa que introduce el comportamiento; esta fase reúne y amplía, no descubre todo al final.
7. **Revisión de experiencia y aceptación.** Recorrer móvil y desktop, errores, espera, cierre, profundidad completa y regreso. Reportar criterios cumplidos, limitaciones y evidencia verificable. Repetir comprobaciones solo cuando un cambio o una preocupación pendiente lo justifique.

Una tabla nueva debe justificarse por propiedad, ciclo de vida, versión, consulta o integridad independiente. Un contenido estructurado puede vivir en una entidad existente si preserva esas garantías. La decisión depende del esquema real; no crear un modelo por cada sustantivo del documento ni concentrar todo en JSON sin reglas.

## 15. Criterios adicionales de aceptación

Se suman a los dieciocho de la especificación original:

1. **Profundidad recorrible:** cada componente tiene ejercicios, ejemplos, salida y continuidad; una prueba manual y persistida recorre los doce.
2. **Intención v1 preservada:** preguntas conservadas, adaptadas o diferidas con razón; el ejercicio breve no sustituye la profundidad sin una decisión explícita.
3. **V2 accesible con fuente compatible:** estados y planes por ámbito tienen una función definida; si la ruta no existe, esa parte se reporta pendiente y no se presenta como completa.
4. **Cobertura fuera de fixtures:** al menos un caso diferente de Martín, Diego y Andrés por ámbito y variantes de tipo/barrera; necesidad no cubierta con salida honesta.
5. **Datos faltantes tipados:** desconocido, pendiente, no aplica y no compartir no son intercambiables; precondiciones según tipo y fase.
6. **Control de carga completo:** minutos y oportunidad, con recursos, dependencias y límites pertinentes; no doble conteo de prácticas instaladas.
7. **Pasado estable:** cambiar frecuencia o zona no altera compromisos y denominadores históricos. Registros heredados no generan expectativas inventadas.
8. **Revisión concurrente:** versiones esperadas y payload vinculado a idempotencia; probar claves diferentes y pérdida de respuesta después de commit.
9. **Compatibilidad completa:** condiciones compuestas y desconocidos representados; restricciones por acción/contenido y continuidad permitida.
10. **Retorno sin bloqueo:** contexto actualizado, acceso a hacer/ayuda/profundidad y revisión sugerida, con pasado consultable.
11. **Migración sin pérdida:** selección explícita de foco, firmas exactas, oportunidades heredadas y enlaces antiguos conservados.
12. **Fixtures aislados desde el inicio:** actor y objetivo comprobados, reloj de dominio separado de autenticación y ausencia de efectos externos reales.
13. **UX durante la construcción:** móvil, teclado, movimiento reducido, borradores y errores verificados por tramo; no solo al final.
14. **Agencia y cierre:** puede discrepar, redactar su propio paso, pausar, cambiar o terminar; no requiere crear una nueva meta para seguir usando la comprensión.

Para aceptar una etapa, el informe debe vincular criterio con prueba o recorrido observado, datos guardados y pendientes. Una lista de checks sin esa evidencia no alcanza.

## 16. Instrucción para que Opus ajuste el plan y continúe

Adjuntar este documento junto al plan actual y a la especificación original. En Plan Mode se devuelve la versión revisada; al ejecutar, mantener el plan guardado como referencia y verificar cada tramo.

```text
Usa MK_revision_Opus_y_casos_limite.md como revisión del plan actual y complemento de MK_producto_recorrido_completo.md. El objetivo sigue siendo un producto de miembro útil, con metodología y profundidad recorribles. Los casos ficticios no son validación de eficacia.

Conserva la base del plan y corrige sus lagunas. Contrasta las observaciones con el repositorio real y las fuentes antes de decidir el esquema. No reproduzcas mi revisión como otra lista genérica: actualiza el plan guardado con responsabilidades, archivos, dependencias, migración y aceptación concreta.

Integra estas condiciones:

1. Proceso MK guiado y recorrible, además del circuito operativo. Conserva los ejercicios profundos de v1, especialmente identidad y sombra, como profundidad complementaria sin fórmulas incompletas. Los doce componentes tienen salida y uso verificables; no alcanza 'feed o pendiente'. Añade un recorrido interno completo de profundidad.
2. Define la ruta opcional de evaluación v2 por ámbito y cómo sus estados y planes pueden usarse con respuestas compatibles. Mantén formulario y v2 separados, no cambies el scoring ni inventes causa, deterioro, palanca o propósito integrado. Si difieres esa ruta, informa exactamente el alcance pendiente y no declares matriz completa recorrible.
3. Biblioteca curada separada del JSON congelado, incluyendo alternativa, seguridad/límite y vínculo de propósito con procedencia. Define cobertura por necesidad, ámbito, tipo y barrera; no hardcodees los fixtures ni ofrezcas la misma estrategia a objetivos distintos. Caso no cubierto tiene salida explícita.
4. Campos según fase y tipo. Distingue desconocido, pendiente, no aplica y no compartir; no inventes causas, motivos o ventanas al precargar. Tensiones narrativas requieren confirmación; tensiones horarias se detectan solo desde datos definidos.
5. Capacidad incluye oportunidad, recursos, esfuerzo y dependencias relevantes. Diferencia carga nueva de prácticas instaladas; cuenta preparación/revisión según unidad. Una razón no permite ignorar una restricción incompatible.
6. Oportunidades previstas y observaciones separadas, claves estables y versiones históricas. No derives pasado desde weekdays actuales. Resuelve cadencia flexible, varias oportunidades por día, desencadenantes, reprogramación, zona horaria y denominador cero. La versión mínima es evidencia parcial, no resultado total.
7. Preview y apply comparan versión de plan y dependencias pertinentes. Idempotencia asociada a usuario, operación y payload; control de concurrencia para claves distintas. Demuestra que el predicado de escritura compara propietario, versión esperada y estado. Toda la operación usa la misma transacción según la versión de Prisma instalada; no actualices dependencias para copiar ejemplos recientes.
8. Representa condiciones compuestas de las preguntas de compatibilidad y datos ausentes. Verifica el comportamiento real de evaluateSafety. La restricción se aplica al contenido y alcance pertinente; permite preparación de apoyo y orientación compatibles.
9. pickNext recomienda y no bloquea navegación por una revisión vencida. Retorno actualiza contexto antes de pedir explicar semanas desconocidas. Permite espera por terceros, cambio de foco y cierre sin nueva meta automática.
10. Migra planes existentes antes del índice de foco, sin borrar o escoger por el usuario. Preserva firmas exactas, registros heredados, propiedad de IKIGAI y continuidad de URLs y contenido. Usa lógica canónica de revisión, evitando dos cierres divergentes.
11. Adelanta fixtures y reloj mínimo al primer tramo persistido. ADMIN es actor y FIXTURE es objetivo; miembros reales no se reinician. Solo fechas del recorrido se simulan; autenticación y efectos reales siguen intactos. Ningún fixture envía comunicaciones reales.
12. Simplifica navegación y verifica UX móvil desde cada tramo. Conserva marca y shells correctos; la próxima acción tiene prioridad visual. Reutiliza respuestas, protege borradores y evita lenguaje que convierta restricciones o desconocimiento en defectos personales.

Usa los 108 casos como matriz de comportamiento y añade combinaciones críticas. Elige pruebas significativas de lógica, integración y recorrido; los significados de los ejercicios requieren también revisión manual. No escribas tests que solo comprueben que hay doce claves o que reflejen la implementación sin comprobar sus efectos.

Las decisiones de seguridad y acceso que el plan reporta como acordadas conmigo conservan su procedencia y alcance. No inventes aprobación de Rafa ni cambies roles/suscripciones de forma implícita. Resuelve decisiones rutinarias con supuestos reversibles y explícitos; pregunta solo si falta una decisión realmente bloqueante.

Ordena implementación por recorridos verticales: integridad y entorno interno mínimo; meta trabada persistida; profundidad y evaluación compatible; otras entradas y cobertura; migración/excepciones; aceptación integral. Los criterios de éxito por tramo quedan definidos antes de ejecutar.

Entrega el plan actualizado y una lista breve de cambios respecto del anterior. Al pasar a ejecución, continúa por los tramos definidos y reporta evidencias, pruebas pasadas y pendientes. No declares completo el producto porque compile ni porque funcionen tres guiones estáticos.
```

## 17. Fuentes y límites de esta revisión

Fuentes del proyecto: especificación original; plan de Opus adjunto; Excel v1, especialmente E-PER-000; matriz v2, especialmente preguntas con condiciones, reglas y 08_PROPOSITO; marco rector y auditorías previas. Los archivos originales no se modificaron.

Fuentes externas consultadas:

- W3C, explicación de WCAG 2.2, criterio 3.3.7: durante un proceso, información requerida nuevamente debe reutilizarse o estar disponible para seleccionar, con las excepciones descritas. La recomendación de MK de facilitar continuidad entre sesiones va más allá de ese criterio y es una decisión propia de producto. https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html
- Alberts, Lyngs y Lukoff, *Designing for Sustained Motivation* (2024), revisión de investigación: señala la diferencia entre motivar el uso de la tecnología y favorecer la motivación hacia el cambio buscado. Aquí inspira autonomía y resultados fuera de la app; no demuestra eficacia de MK. https://arxiv.org/abs/2402.00121
- Documentación oficial de Prisma sobre transacciones: las escrituras relacionadas deben formar una unidad y usar el cliente transaccional. La sintaxis concreta depende de la versión instalada. Esta fuente no prueba que el plan de Opus ya implemente concurrencia correctamente. https://www.prisma.io/docs/orm/fundamentals/transactions

La mayor parte de las reglas de aceptación y casos son análisis y propuestas derivados de las fuentes del proyecto. Requieren implementación y verificación en el repositorio. El éxito con personas, su comprensión y la utilidad sostenida siguen siendo preguntas empíricas posteriores; la simulación sirve para llegar a esa etapa con un producto coherente y verificable.
