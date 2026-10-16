# MK: ajustes finales al plan de implementación v2

Revisión del archivo `Markdown pegado(4).md` · 7 de octubre de 2026

## 1. Decisión recomendada

Conservar el plan actualizado y aplicar los ajustes puntuales de este documento. La estructura de producto ya permite avanzar: dos usos conectados, profundidad v1, evaluación v2 por ámbito, recomendaciones corregibles, ayudas con procedencia, evidencia y revisión aplicada. No hace falta volver a diseñar toda la arquitectura.

Todos los tramos del archivo están `pending`. Esta revisión evalúa un plan, no una implementación terminada. Los hechos sobre el repositorio, Prisma y el evaluador son los reportados por Opus; aquí no está el repositorio para confirmarlos. Sí contrasté nuevamente las salidas metodológicas de `08_PROPOSITO` con el Excel original.

Los ajustes P0 se resuelven antes de habilitar el comportamiento afectado. Los P1 se concretan en el tramo que introduce esa experiencia y antes de declararla completa. Esto no implica terminar todos los P1 antes de empezar el primer recorrido persistido.

## 2. Qué considero suficientemente definido

- Dos usos del mismo núcleo: trabajar algo actual y recorrer MK en profundidad.
- Doce componentes con camino breve, profundidad, salida, estados separados y reentrada.
- Separación entre formulario, v2, narrativa personal y adaptación de producto.
- Evaluación v2 opcional por ámbito sin inventar prioridad ni scoring de propósito.
- Biblioteca separada del JSON congelado, con cobertura y salida para necesidades no cubiertas.
- Oportunidad comprometida separada de observación; desconocido separado de incumplimiento.
- Revisiones con transformación canónica, historial y control de versión del plan.
- Fixtures desde el comienzo, reloj de dominio y exclusión de efectos externos.
- Navegación simplificada y verificación móvil por tramo.
- Informe de aceptación con evidencia y pendientes, sin presentar simulación como eficacia demostrada.

## 3. Ajustes P0 de integridad y continuidad

### R01. Corregir dependencias entre M1, M2 y los tramos

**En el plan:** el tramo 1 incluye `review-apply`, el adaptador de `weeks/close`, pruebas F03–F08 y `LegacyPlansChooser`. Pero `PlanReview`, `FocusItem`, la lógica de capacidad y varias piezas que participan en esa operación se introducen en M2/tramo 2.

**Falta:** hacer explícito un núcleo mínimo que pueda ejecutarse completo. Si el cierre canónico usa `PlanReview`, ese modelo debe existir en M1 o el alcance del primer cierre debe definirse con precisión. No construir una simulación del cierre que después se sustituya por otra implementación.

Entregar una pequeña tabla de dependencias: comportamiento, modelos requeridos, funciones, rutas y primera etapa donde se ejecuta. Ajustar únicamente la partición necesaria. El esquema real puede permitir algunas referencias sin FK; eso no resuelve por sí solo la ausencia del ciclo de revisión que se pretende probar.

**Aceptación:** una base nueva puede aplicar M1 y recorrer el cierre heredado definido, sin depender de una tabla o endpoint que todavía no existe. Las operaciones futuras usan el mismo núcleo.

### R02. Renovar el horizonte de oportunidades y conservar las ventanas iniciadas

**En el plan:** se materializan oportunidades hasta el final de la próxima revisión y la revisión vencida no bloquea Hacer.

**Falta:** quién extiende ese horizonte si la persona continúa sin revisar. Sin ese mecanismo, puede llegar una fecha en que Hacer quede vacío aunque el cambio siga activo.

Definir un `ensureOpportunityHorizon` idempotente o un mecanismo equivalente, llamado desde las lecturas o procesos pertinentes. Extender compromisos vigentes hacia adelante sin exigir revisar, sin fabricar oportunidades pasadas que nunca se generaron y sin alterar cancelaciones o reprogramaciones.

Precisar qué significa futuro: una ventana flexible ya iniciada no es íntegramente futura. Si cambia la cadencia a mitad de semana, conservar el compromiso y las observaciones anteriores; explicar qué oportunidades restantes se sustituyen y evitar duplicar las ya realizadas.

La lectura histórica debe obtener cadencia, minutos, ayuda y variante desde el snapshot de la versión correspondiente, aunque la fila actual de la acción cambie. Escribir `actionRevision` sin una forma de resolver esa revisión no conserva por sí solo su contenido.

**Aceptación:** adelantar un fixture 21 días sin revisión; Hacer conserva la salida coherente definida por la política. Cambiar una cadencia a mitad de ventana después de una ejecución no altera el pasado ni duplica el resto.

### R03. Completar concurrencia de la base y reintentos simultáneos

**En el plan:** el UPDATE comprueba `currentVersion` del plan y `basis` incluye contexto, compatibilidad y componentes.

**Falta:** garantizar la vigencia de esas otras dependencias durante la escritura, no solo antes. Un contexto puede cambiar después de leer la base y antes de aplicar el plan, sin modificar `PersonalPlan.currentVersion`.

Elegir una estrategia que cubra todas las escrituras relacionadas: revisión de contexto común y comparación atómica, bloqueo coherente, aislamiento adecuado con reintentos, u otra solución demostrable. No prescribe este documento cambiar el aislamiento de todas las operaciones. El control de una fila y el de varias dependencias son problemas distintos.

También falta la carrera con **la misma clave**: dos peticiones pueden encontrar inicialmente que no existe un `IdempotencyRecord`. Si una confirma y la otra falla por versión o unicidad, la segunda debe resolver la operación ya confirmada y devolver la respuesta guardada cuando el payload coincide. No reintentar sobre una transacción abortada ni crear un segundo efecto.

Cada operación necesita su ámbito de concurrencia: actualizar una observación no debería incrementar o bloquear innecesariamente la versión estratégica del plan. Usar versión propia donde corresponda.

**Aceptación:** contexto modificado durante apply; dos peticiones con la misma clave; dos claves distintas; rollback y reintento; commit con respuesta perdida. Siempre una sola aplicación válida, sin pérdida de la reflexión escrita.

### R04. Definir exactamente qué respuestas forman una evaluación

**En el plan:** al congelar se ejecuta `runAssessment` con respuestas de todas las evaluaciones del usuario.

**Falta:** resolver respuestas repetidas al reevaluar un mismo ámbito y distinguir evaluaciones congeladas de borradores. También definir qué ocurre con definiciones o versiones diferentes.

Propuesta: seleccionar explícitamente una revisión congelada compatible por ámbito, con una regla determinista, y guardar sus IDs y respuestas como conjunto de entrada del resultado. Excluir borradores de un resultado publicado. No mezclar dos respuestas de la misma pregunta ni fuentes incompatibles. Las respuestas de PROPÓSITO conservan su procedencia propia y no se convierten en puntuaciones operativas.

Un resultado ya congelado no se recalcula al responder después otro ámbito. Puede generarse una lectura conjunta nueva con sus propias fuentes. La fecha de esa lectura y las fechas de sus entradas deben poder distinguirse.

**Aceptación:** dos evaluaciones del mismo ámbito con respuestas opuestas; un borrador posterior; otro ámbito congelado después; una fuente incompatible. El resultado histórico permanece estable y el nuevo tiene entradas inequívocas.

### R05. Cerrar el ciclo de foco, mantenimiento y planes heredados

**En el plan:** el índice único protege `ACTIVE + FOCUS`; todos los planes heredados quedan `ACTIVE + role NULL`, y existe un máximo de un mantenimiento programado.

**Falta:** qué entra en carga y Hacer mientras esos planes antiguos siguen sin clasificar. El índice evita dos focos nuevos, pero permite muchos activos heredados. Tampoco protege por sí solo la creación concurrente de dos mantenimientos.

Definir la transición con elección explícita y conservar el contenido. Antes de confirmar un nuevo foco, resolver o representar la carga de los activos heredados relevantes; no tratarlos silenciosamente como cero. El resto del producto puede seguir accesible mientras se aclara esa decisión.

Revisar **todos** los caminos que escriben planes, incluyendo endpoints antiguos y helpers de creación. Deshabilitar una tarjeta no impide que una API antigua cree otro plan libre. Las garantías deben estar en el servidor y el índice es una protección adicional.

Añadir una tabla breve de transiciones: activar, pasar a espera, pausar, cerrar, reabrir, cambiar foco y pasar a mantenimiento. Para cada una: permiso, efecto sobre foco/carga, oportunidades futuras y conservación de observaciones. Reabrir no reactiva silenciosamente un plan desplazando a otro.

**Aceptación:** tres activos heredados y un nuevo foco; dos mantenimientos confirmados simultáneamente; reapertura con otro foco; llamada a un endpoint antiguo. Una elección coherente, sin pérdida ni carga oculta.

### R06. Aplicar compatibilidad vigente también al cambio activo

**En el plan:** una alerta nueva marca las recomendaciones futuras para reconsiderarlas.

**Falta:** qué ocurre con la acción ya programada, la ayuda guardada y la preparación visible en Hacer. Conservar el `safetyCheckId` histórico es correcto; no significa que esa evaluación antigua autorice la instrucción actual.

Separar snapshot histórico de compatibilidad vigente. Si una información nueva afecta una acción existente, marcar y restringir la instrucción afectada según las reglas correspondientes, ofrecer una alternativa permitida y conservar registro y comprensión. Registrar lo que ocurrió sigue disponible, aunque no corresponda ofrecer la acción para realizarla ahora.

Una comprobación parcial de otro ámbito no debe borrar alertas conocidas. Definir resolución por condición y fuente, incluyendo datos desconocidos, respuestas cambiadas y revisión explícita. No inventar vencimientos clínicos ni reglas nuevas de scoring.

Las formulaciones cualitativas y el mapa de alertas a etiquetas todavía están señalados como borradores para Rafa. Preparar esos textos y restricciones concretos para revisión; el estado borrador no demuestra que ya sean adecuados. Mientras se valida su adaptación, conservar las restricciones originales y las salidas compatibles.

**Aceptación:** aparece una alerta después de confirmar una acción; llega un check parcial de otro ámbito; se modifica una adaptación de ayuda. La pantalla y el servidor responden de forma coherente y no desaparece el historial.

### R07. Resolver registros de desencadenantes y correcciones

**En el plan:** TRIGGER no tiene denominador; `ActionRecord.opportunityId` admite null y el índice diario heredado se conserva donde `opportunity_id IS NULL`.

**Falta:** cómo registrar dos desencadenantes reales de la misma acción en un día si ambos carecen de oportunidad planificada. El índice propuesto podría rechazarlos como duplicados.

Elegir una representación: eventos observados con identidad propia, oportunidad creada al declarar el desencadenante sin expectativa previa, u otra solución. Limitar la unicidad diaria heredada a los registros verdaderamente heredados o asegurar un contrato equivalente. Ausencia de oportunidad prevista no debe equivaler automáticamente a registro heredado.

Definir también cómo corregir una observación: versión propia, motivo opcional y continuidad del aprendizaje que la utilizó. Un resumen histórico cerrado puede mostrar una corrección posterior sin reescribir silenciosamente su snapshot.

**Aceptación:** dos desencadenantes el mismo día, reintento de uno de ellos, ejecución espontánea y corrección posterior. Dos hechos distintos; cero duplicados por retry; ningún denominador inventado.

### R08. Separar tiempo real y tiempo de recorrido en los eventos

**En el plan:** `createdAt` usa tiempo real y solo ciertas fechas usan `domainNow`.

**Falta:** declarar qué fecha gobierna retorno, revisión, cierre, materialización y aprendizaje. Si el fixture avanzó tres semanas y el evento nuevo guarda solo `createdAt` real, la lectura del recorrido puede ubicarlo antes de la fecha simulada.

Conservar fecha técnica real y fecha efectiva de recorrido donde la lógica la necesita. Aplicar la distinción también a confirmaciones y revisiones, no solo a `ActionRecord.effectiveAt`. El reloj de autenticación y los efectos reales continúan intactos.

**Aceptación:** avanzar el fixture, actuar, revisar y volver a consultar. El historial y la siguiente revisión usan la fecha de recorrido correcta; login y refresh siguen utilizando tiempo real.

## 4. Ajustes P1 para que el producto ayude de verdad

### R09. Permitir preparar dependencias y reconsiderar reglas elegidas

`load.ts` llama conflicto duro a recursos faltantes, dependencias sin resolver, consentimiento y ventanas protegidas. Eso necesita una distinción: puede impedir una ejecución dependiente, pero no debe impedir preparar el recurso o solicitar un acuerdo.

Ejemplo: no tener confirmación de otra persona impide asumir su participación; no impide redactar una invitación o preparar una consulta compatible. Un proyecto puede tener pasos posteriores bloqueados y un paso preparatorio viable.

Separar restricción externa o de compatibilidad, prerrequisito de una acción, compromiso elegido y estimación. Una regla personal declarada dura puede reconsiderarse de manera explícita creando una nueva revisión; no se elude por un override oculto. Aceptar una razón nunca invalida una restricción incompatible.

Cuando hay capacidad cero, ofrecer pausa. Una preparación breve aparece solo si la persona declara una oportunidad o excepción elegida; no se descuenta ficticiamente de cero ni se impone como obligación.

### R10. Especificar el primer resultado útil y el contenido real de las ayudas

Una biblioteca de unas treinta entradas no demuestra calidad. Cada ayuda publicada debe tener contenido completo: ejemplo concreto, instrucciones practicables, artefacto editable, criterio para saber si sirvió, alternativa y límites. Un campo vacío llamado `produces` no constituye ayuda.

Para el primer recorrido, definir un resultado útil observable: alcance aclarado, decisión razonada, preparación realizada o experiencia viable. La persona debe poder explicar qué cambió después de esa sesión y conservar algo que pueda usar.

Ejemplo de una propuesta: «Quieres enviar una propuesta, pero te interrumpen. Te propongo delimitar el entregable y proteger una oportunidad. Puedes corregirlo». La ayuda debe producir un borrador utilizable o una preparación concreta, no solo registrar otro compromiso.

La salida para lo no cubierto debe tener ramas, no una escalera que obligue a probar opciones irrelevantes. Si faltan datos necesarios, se aclaran antes de ofrecer la actividad específica. Si la necesidad excede la cobertura, se reconoce y se ofrece una preparación compatible. Mostrar opciones pertinentes y permitir elegir.

Si la barrera es capacidad o habilidad, definir enseñanza, práctica y revisión: ejemplo, intento, criterio de autoevaluación y ajuste. No resolverla únicamente con agendar tiempo. Esto cabe en las ayudas existentes y no exige construir un nuevo módulo educativo.

### R11. Precisar qué profundidad se conserva y qué resultado metodológico sigue pendiente

**Corrección a la lectura anterior:** el Excel `08_PROPOSITO` sí declara «Índice de identidad», «Índice invertido» e «Índice de integración». Opus informa que el motor no los calcula. Son salidas declaradas en la matriz que todavía no tienen implementación calculable demostrada; no desaparecen por llamarlas dimensiones.

No inventar fórmulas. Conservar las salidas narrativas separadas y registrar esa parte como pendiente metodológico, con la fuente y la definición que falta. Mi revisión anterior fue imprecisa al sugerir que esos índices pertenecían a una evaluación ya disponible.

Identidad conserva sus opciones originales; interferencia propone opciones nuevas de reconocimiento. Esa adaptación puede ser útil, pero necesita versión propia y acceso a la profundidad original. Una escala adaptada no se reutiliza como respuesta compatible de otra evaluación.

Los IDs trazables deben identificar versión de fuente y ubicación inequívoca (hoja/fila/celda o clave canónica). `sección + número` solo sirve si se demuestra su unicidad en las numeraciones repetidas.

La aceptación manual debe revisar también calidad interpretativa: no atribuir todo obstáculo a un rasgo, distinguir aspiración de evidencia, conservar recursos junto a dificultades y aceptar no tener una síntesis definitiva. La profundidad se reconoce por lo que ayuda a entender, no por el número de ítems completados.

### R12. Proteger reflexión personal y definir evidencia de utilidad

La app recogerá historia familiar, valores, relaciones y patrones personales. Definir quién puede leer esas respuestas y qué comparte la persona al preparar apoyo. El filtrado por `userId` es una base; falta comprobar que los endpoints relacionados y los roles no amplían esa lectura implícitamente. No enviar respuestas íntimas completas a logs o analítica para medir progreso.

Antes de pedir datos reales, explicar la capacidad concreta de la app y de Apoyo. Si no existe contacto humano conectado, una nota guardada no satisface esa expectativa; debe poder usarse como preparación que la persona lleva por su cuenta.

Definir cuatro señales para las simulaciones y la prueba posterior: comprensión o decisión nueva; siguiente paso viable; ayuda que se usa; aprendizaje que cambia la decisión o confirma una estrategia con fundamento. No atribuir causalidad a MK por un resultado declarado.

Las pruebas con personas están fuera del plan actual. Puede mantenerse esa separación para construir, pero antes de declarar éxito del producto se necesitará observar comprensión, fricción, utilidad y retorno voluntario con personas. El primer ensayo no exige toda la cobertura terminada: sí un tramo íntegro y un alcance honesto.

## 5. Pruebas adicionales concretas

Estas pruebas complementan las 108 anteriores; no son una nueva lista de funcionalidades independientes.

| Caso | Condición | Resultado que debe observarse |
|---|---|---|
| R01-A | Base nueva con solo M1 | El cierre canónico definido funciona sin modelos de M2 |
| R02-A | 21 días sin revisión | Horizonte extendido coherentemente; Hacer no se vacía por agotamiento técnico |
| R02-B | Cambia cadencia después de actuar a mitad de ventana | Historia estable y oportunidades restantes sin duplicación |
| R03-A | Contexto cambia durante apply | No se confirma usando una base ya invalidada |
| R03-B | Dos apply simultáneos con la misma clave | Una aplicación y respuesta coherente para ambos |
| R04-A | Dos evaluaciones del mismo ámbito y un borrador posterior | Conjunto de respuestas determinista; snapshot anterior intacto |
| R05-A | Activos heredados y nuevo foco | Elección y carga explícitas; ningún plan desaparece |
| R05-B | Dos mantenimientos simultáneos o endpoint antiguo | La política se cumple en servidor, sin bypass silencioso |
| R06-A | Alerta nueva con acción ya programada | Se restringe la instrucción afectada y se permite registrar/comprender |
| R06-B | Check parcial de otro ámbito | No borra una condición conocida relevante |
| R07-A | Dos desencadenantes en el mismo día más un retry | Dos observaciones distintas, sin duplicado ni denominador supuesto |
| R07-B | Corrección después de una revisión cerrada | Diferencia posterior visible; snapshot de revisión conservado |
| R08-A | Fixture avanzado que actúa y revisa | Fechas efectivas consistentes; autenticación real intacta |
| R09-A | Dependencia sin resolver, preparación viable | Permite preparar; no promete ni ejecuta la acción dependiente |
| R10-A | Necesita aprender, no solo tiempo | Ayuda completa con ejemplo, práctica y criterio de revisión |
| R11-A | Ejercicio adaptado y resultado de índice ausente | Procedencia explícita; no inventa fórmula ni equivalencia |
| R12-A | Respuestas privadas y preparación de apoyo | Solo contenido autorizado; permisos y capacidad del servicio verificables |

## 6. Qué hacer ahora en Cursor

Aplicar estos ajustes en el plan guardado y continuar por tramos. No producir otra reformulación extensa del producto. La primera evidencia debe ser un recorrido persistido que atraviese datos, lógica e interfaz; después se amplían profundidad y cobertura.

```text
Conserva el plan «Recorrido completo miembro, revisión 2» y usa MK_ajustes_finales_plan_v2.md como ajustes puntuales. Contrasta cada hallazgo con el repositorio: se señalan riesgos del plan, no defectos ya demostrados del código.

Corrige dependencias M1/M2, renovación del horizonte, ventanas iniciadas, control atómico de basis, carreras con la misma clave, selección versionada de respuestas de evaluación, convivencia de planes heredados y control de todos los writers, compatibilidad vigente de acciones activas, múltiples eventos TRIGGER y fechas efectivas del recorrido.

Concreta las distinciones de restricciones/dependencias, el primer resultado útil, el contenido completo de las ayudas y la profundidad original/adaptada. Registra los índices declarados en 08_PROPOSITO como pendientes si el motor no los calcula; no inventes fórmulas. Define propiedad y compartición de reflexión personal y evidencia de utilidad.

Actualiza solamente secciones afectadas y una tabla breve de dependencias. Mantén scoring y JSON congelados. Resuelve opciones rutinarias con supuestos reversibles; señala únicamente decisiones realmente bloqueantes.

Después ejecuta los tramos 0–2 en el orden corregido. El tramo 0 debe preparar lo necesario para empezar el recorrido, con trazabilidad ampliable; la cobertura completa de profundidad sigue siendo criterio antes de declarar terminado ese alcance. Los P0 se prueban al introducir su comportamiento, no al final.

Reporta cambios, migraciones aplicadas, pruebas y un recorrido observado con persistencia y sesión nueva. No marques criterios como cumplidos solo porque existen archivos o todos los casos tienen una fila. Sigue luego con los tramos 3–6; una entrega parcial se identifica como parcial.
```

## 7. Fuentes y límites

Fuentes del proyecto: plan actualizado adjunto; especificación y revisión anteriores; matriz v2, hoja `08_PROPOSITO`. No se modificaron los adjuntos ni se ejecutaron pruebas del repositorio. Las pruebas de este documento son condiciones de aceptación propuestas.

Referencia técnica consultada: PostgreSQL, aislamiento de transacciones. En Read Committed, un UPDATE condicional vuelve a comprobar su condición tras esperar una actualización concurrente; distintas lecturas de una misma transacción pueden ver cambios posteriores. Esa garantía de una fila no demuestra atomicidad de todas las dependencias del preview. La estrategia final se debe verificar con la versión instalada y las escrituras reales: https://www.postgresql.org/docs/current/transaction-iso.html

Referencia técnica consultada: PostgreSQL, índices únicos. Su protección depende de las columnas y condiciones indexadas. De ahí que un índice de foco no demuestre la política de mantenimiento ni cubra estados deliberadamente excluidos: https://www.postgresql.org/docs/current/indexes-unique.html
