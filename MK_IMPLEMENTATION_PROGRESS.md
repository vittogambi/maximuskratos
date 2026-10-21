# Registro de implementación MK

## Beta local: índices, IKIGAI y revisión

13 oct 2026. Sin commit, sin push y sin staging. La base de trabajo `maximuskratos` no se migró. Las 28 migraciones, incluida `20261013180000_alignment_depth_ikigai`, se aplicaron en `mk_journey_it` y esa base se eliminó.

Decisiones de esta pasada, en borrador:
- El nombre visible es Índice de alineación MK (`ia-mk-cuest@0.1`), con Espíritu, Mente, Cuerpo y general. Sale del núcleo de 20 señales. La ficha IAD sigue aparte.
- Índice de profundidad MK (`profundidad-mk@0.1`) mide trabajo documentado de los nueve componentes de la hoja. No es una fórmula del Excel.
- `cruce-cualitativo@2` guarda reconocimiento por campo. El botón del cruce crea un plan exploratorio y una acción de calendario.
- `formulario-completo@6` repara etiquetas. `@1` a `@5` no se reescribieron. Las sesiones nuevas usan `@6`.

Qué quedó demostrado aquí:
- Dominio: 73 de 73, incluidos los casos A de alineación, profundidad, prioridad y fechas civiles.
- Componentes jsdom: 15 de 15.
- HTTP sobre PostgreSQL aislado: 5 de 5. El recorrido A, en `@6`, leyó el índice con cobertura 20 de 20. Cerrar la semana y guardar la ficha no cambiaron ese general. El recorrido B pasó en esta corrida. No reproduje el 404 intermitente anterior, así que no lo doy por corregido.
- Typecheck de la API sin errores. La web sigue con los 8 errores previos de tests de Lab.

No verificado en navegador: disposición, hidratación y cookies. El sitio público no se publicó. El registro no inicia la prueba comercial.

## Revisión de producto, alineación y valor semanal

## Revisión de producto, alineación y valor semanal

13 oct 2026. Revisé el checkout. No abrí navegador ni rehíce el recorrido. Los tests de esta sección sí se ejecutaron aquí. No hay migración nueva: el esquema local ya tenía las columnas que usa este cambio. La base de trabajo `maximuskratos` no se migró. `mk_journey_it` se creó, migró con las 27 migraciones vigentes y se eliminó.

Completar el cuestionario no calcula Espíritu, Mente y Cuerpo. Esas cifras salen solo de la ficha de nueve respuestas, borrador IAD-MK 0.1. El cierre ahora lo dice y deja seguir. La semana puede cambiar el resultado del plan y la estrategia de la acción, y la revisión cerrada conserva el resultado anterior. Un ejemplo de guía con corchetes, o la frase automática del valor, no se guarda. La disposición a pagar no está medida.

### Matriz

| Requisito | Código y contrato | Prueba | Estado | Consecuencia | Cambio de esta pasada |
| --- | --- | --- | --- | --- | --- |
| Lectura al cerrar el cuestionario | `persistFormularioReading` escribe `formulario-score@1` con `pillarsPending: true`. `/diagnostico/resultado` renderiza `ExcelProfile`. | HTTP A y B leen la auditoría. Componente: ficha pendiente distinta del error de carga. | Demostrado | Ve auditoría, relaciones, finanzas, identidad, sentido, dificultades y personalidad. Los tres pilares no salen de ahí. | El texto ya no dice que Mente, Espíritu y Cuerpo no tienen lectura. Explica la ficha aparte, la ventana de 14 días, que falta información no es cero, y que el plan no se bloquea. |
| Ficha de alineación | `saveAlignment`, `alignmentReading`. Pilar con 3/3, total con 9/9. | `iad-invariants`. HTTP A: una revisión posterior no cambia `savedAt` ni el total. Componentes: misma revisión, fecha y cobertura. | Demostrado | Puede guardarla en la hoja de ruta. Parcial no muestra total. | Ninguna fórmula nueva. |
| Valor o límite que cambia una decisión | `valueRef` y `linkKind` en el plan. `unfinishedHelp` rechaza el ejemplo intacto. `assertContent` en el alta y otra vez al cerrar la semana si la acción sigue en el futuro. | Dominio: `unfinishedHelp`. HTTP: cambiar `valueRef` a habilitante no toca la ficha ni la revisión de propósito. Un límite vigente posterior impide cerrar la semana mientras esa acción siga recomendada. Componente: el borrador queda si el ejemplo tiene huecos. | Demostrado para el rechazo del ejemplo y para el límite vigente. Parcial para la calidad de la estrategia. | Nombrar un valor no alcanza. Tiene que escribir qué cambia esa semana. Un límite nuevo deja de recomendar la acción incompatible. | Esas dos reglas. No hay una fórmula que elija la estrategia por la persona. |
| Objetivo observable y ocasión | `personal_plans.outcome`, `plan_actions.doneWhen`, `weekday`, `intervalDays`. `futureOccasions` arma 21 días hacia adelante. | HTTP A: criterio, día, ocasiones sin duplicar. Dominio: una fecha posterior no incluye días anteriores. | Demostrado | Una obligación por acción y día, no una cuota ni varios eventos el mismo día. | No agregué cuotas. |
| Guías | `FORMULARIO_GUIDES` en `plan-guides.ts`. El artefacto es `priorityNote`. Las once son plantillas: resultado, prioridades, semana, fricción, aprender, estándar, conversación, dinero, cuidado, hipótesis, revisar. | Componente: un ejemplo con corchetes no llama a crear el plan y el título sigue escrito. | Parcial | Cada guía muestra cuándo sirve, tres o cuatro pasos y un ejemplo. El texto guardado tiene que ser propio. No es un ejemplo trabajado con las respuestas de esa cuenta. | El ejemplo no se persiste solo. El contenido de las plantillas no se reescribió. |
| Ayuda de revisión | `reviewGuidance` en API y web, las mismas seis situaciones. La pantalla la muestra y dice que nada se aplica solo. | Dominio: resultado estancado con buen cumplimiento, capacidad baja, desacuerdo con la alineación, denominador cero. Componente: el estancado muestra la pregunta y no llama a la vista previa hasta el clic. | Demostrado | Capacidad baja ofrece reducir, reprogramar o pausar. Sin resultado, sustituir la estrategia o reformular el resultado. Sin evidencia, mantener en provisional o preparar una comprobación. Pérdida de sentido, revisar dirección, objetivo o cerrar. | La pregunta ya estaba. Ahora reformular el resultado escribe el futuro. |
| Revisar objetivo y estrategia | `SUBSTITUTE` desactiva la acción y crea una sucesora. `outcomes` en el cierre actualiza `personal_plans.outcome` después de fotografiar el anterior en `week_reviews.snapshot`. | Dominio: `nextPlanOutcome`. HTTP: el snapshot de esa semana conserva «Hay un texto que otra persona puede leer.» y el plan queda en «Un párrafo que otra persona puede usar.». Componente: la semana cerrada muestra el resultado viejo y la siguiente, el nuevo. | Demostrado | Puede cambiar el resultado del plan y la estrategia de la acción. El pasado de esa semana no se reescribe. La ficha tampoco. | El campo de resultado futuro en el calendario y el cierre. |
| Reanudar una pausa | `RESUME` limpia `pausedAt` y conserva `doneWhen`. `KEEP` sobre una pausa la deja en pausa. | Dominio. HTTP: pausar y, dos semanas después, reanudar la misma acción con el mismo criterio. | Demostrado | La pausa no es un callejón. Al volver, las ocasiones salen desde hoy. | Decisión `RESUME`. |
| Tres semanas sin uso y revisión tardía | Una semana futura responde que todavía no se revisa. Las ocasiones se calculan desde el día civil actual. Los registros solo entran por `POST /journey/records`. | HTTP A cierra una semana ya pasada sin mover el registro. Dominio: desde el 2 nov 2026 no hay fechas anteriores. | Parcial | No se fabrican registros ni deuda de las semanas no abiertas. No hay un guion HTTP de tres semanas seguidas. | No hizo falta. |
| Cierres concurrentes y reintento | El cierre repetido devuelve la misma fila. Dos cierres solapados de la misma semana dejan una fila. Un fallo a mitad de la transacción no deja la pausa ni la semana. | HTTP, en la cuenta del recorrido A, con barrera dentro de la transacción. | Demostrado para esa semana y esa operación | El segundo cierre no crea otra obligación. | La carrera y el conflicto de unicidad. |
| Medianoche, zona, horario de verano | `JourneyClock` y `weekStart` usan la fecha civil de America/Santiago. El mediodía con desplazamiento fijo no cambia de día entre UTC−3 y UTC−4. | El reloj de la suite fija el día. No hay un caso de horario de verano. | Parcial | La semana es una fecha, no un instante. No vi un defecto de cambio de día. | Ninguno. |
| Capacidad cero y semana sin registros | `nextStep` pide una acción si el plan no tiene. `reviewGuidance` con cero acciones aplicables pide información, no declara fracaso. | `next-step.test.ts`. Dominio de revisión. | Demostrado | No aparece una tarea automática ni un fracaso inventado. | Ninguno. |
| Personas que vuelven, mejoran o pagan | No hay eventos de piloto ni cobro en este flujo. | No aportada | Ausente | No se puede decir que el ciclo valga el pago. | Protocolo, sin enviarlo. |

### Pruebas de esta pasada

Dominio: 60 de 60. Componentes: 15 de 15, unos 2,3 s. HTTP sobre `mk_journey_it`: 5 de 5, 27 s de Vitest. El recorrido A tardó 13 s, el B 11 s, la concurrencia 1 s. `nest build` de la API terminó. El typecheck de la web no marcó estos archivos. Siguen los 8 errores previos de tests de Lab.

Una corrida intermedia de B devolvió 404 sin cuerpo en una pregunta de escala y la siguiente corrida pasó. No lo convertí en un reintento automático.

### Protocolo de piloto, propuesta

Cinco personas del público objetivo, cuatro semanas. Sirve para ver dónde se traban y qué decisión cambia la app. No demuestra eficacia ni estima demanda.

Antes, cada persona dice el problema actual, qué usa hoy en su lugar y qué cambio quiere observar. No se le pide que diseñe el producto. Un elogio no cuenta como valor.

Durante, se anota si llega a un plan que puede explicar, si el artefacto le sirve para empezar, si hace una acción, si vuelve a revisar y si puede nombrar una decisión que la app cambió. Si Rafa resuelve el obstáculo, eso se anota como servicio asistido, con su coste, y no como app autónoma.

Al cierre, se miran resultados, retorno y abandono. Una continuidad a un precio que fije el responsable del producto pesa más que una respuesta hipotética. El precio no sale de estos tests.

Eventos mínimos, si hacen falta: plan preparado, artefacto guardado, actividad registrada, revisión aplicada, retorno de esa semana. Sin contenido íntimo. Las cuentas reales no se mezclan con `@fixtures.mk.invalid`. No se mide éxito por pantallas vistas, por preguntas respondidas ni por subir la ficha.

Esto no autoriza contactar, cobrar ni cambiar el acceso. Cobro, renovación, cancelación y permisos siguen sin acreditarse.

### Preguntas para Rafa

No enviadas.

1. Vocación. El encabezado y la fila 226 no dicen lo mismo. ¿Cuál manda para el cruce?
2. La fila A258 no tiene escala. ¿Se queda la valoración cualitativa o hay una escala que reemplaza `cruce-cualitativo@1`?
3. Espíritu, Mente y Cuerpo. ¿Siguen siendo la ficha de nueve respuestas, o hay una fórmula aprobada desde el cuestionario? Hoy no la hay y no la inventé.
4. M1, M3 y C1 a C3 miran 14 días. En una cuenta nueva, ¿queda «sin información» hasta que exista esa ventana?
5. Las once guías son plantillas. ¿Alguna necesita un ejemplo trabajado con un caso real, y cuál?
6. Un valor guardado en el plan. ¿Basta con nombrarlo, o la conducta de la semana tiene que decir qué cambia por ese valor? El servidor ya exige que la frase automática no se guarde sola.
7. Precio, semanas y quién invita a las cinco personas. Es decisión comercial.

## Aceptación sin navegador

12 oct 2026, noche. Esta entrega no se observó en un navegador. No hay capturas, ni Playwright, ni un recorrido hecho a clic. La aceptación de esta pasada es otra: dominio, HTTP contra PostgreSQL desechable y componentes en jsdom.

La base de trabajo `maximuskratos` en localhost:5433 no se migró ni se borró en esta pasada. La suite crea `mk_journey_it` en el mismo servidor, aplica las migraciones vigentes desde una base vacía, corre y la elimina aunque haya fallos. PostgreSQL es el 16 del Compose local. No se usó SQLite ni un mock de Prisma.

### Qué cubre

| Capa | Comando | Resultado medido |
| --- | --- | --- |
| Dominio | `npm run test:domain -w @mk/api` | 56 de 56. El reloj de la suite midió 1 s. Vitest reportó 320 ms, de los cuales 30 ms son los tests. |
| Componentes | `npm run test:components -w @mk/web` | 14 de 14, en jsdom. 3 s. |
| PostgreSQL | dentro de `npm run test:acceptance` | Crear la base y aplicar 27 migraciones: 1 s. Incluye `20261012233000_action_occasion_review`. |
| HTTP | `npm run test:http -w @mk/api` | 5 de 5. 28 s de tests, después de compilar la API. La corrida completa del script salió en 36 s. |

Un escenario solo: `DATABASE_URL=postgresql://mk:mk_local_dev@127.0.0.1:5433/mk_journey_it npm run test:http -w @mk/api -- -t "recorrido HTTP A"`. El filtro vale igual para B, la compatibilidad de `@4` o el límite de peticiones. Esa base tiene que existir y estar migrada. `npm run test:acceptance` la crea y la destruye.

La compilación de la API entra antes del HTTP porque Vitest no emite la metadata de los decoradores de Nest. La aplicación de prueba arranca `dist`, con el mismo prefijo, la validación y los guards. El límite alto de peticiones queda solo en esa aplicación, por `MK_THROTTLE_DEFAULT_LIMIT`. El caso aparte pide 101 veces con el límite real de 100 y recibe 429.

### Recorridos HTTP

Catálogo activo de las cuentas nuevas: `formulario-completo@5`. Las respuestas salen de `apps/api/test/journey-scenario.json`, revisadas por referencia y valor, no por la función que puntúa. Si falta una opción, el recorrido falla con la referencia.

Recorrido A. Cuenta nueva. Instrumentos por `POST /diagnostic/response`, con el tipo que pide cada pregunta, cierre de módulo y retoma con otro agente después de logout y login. La profesión usa sus ámbitos, no los de pasión. La auditoría esperada es la suma de los valores del escenario, con cobertura 23 de 23. Dos combinaciones, edición libre del propósito, plan con vínculo directo, valor y revisión de propósito. El texto de ayuda queda. Acción con criterio, día y ocasiones de 21 días. Dos lecturas del calendario devuelven el mismo conjunto, sin duplicar. Se registran la actividad y el resultado. Una revisión reduce la frecuencia y mueve el día futuro. El criterio y el registro ya hecho siguen. Cerrar otra vez devuelve la misma semana. Una medición de alineación no cambia cuando, en una semana posterior, la revisión solo mantiene. Después se cierra el cliente de base, se abre otro sobre la misma base y se vuelve a entrar: el criterio sigue.

Recorrido B. Otra cuenta. `UNKNOWN`, `NOT_APPLICABLE` y `DECLINED` donde el catálogo los admite. La auditoría no tiene total: cobertura 22 de 23. El detalle condicional de un padre desconocido queda pendiente y no se acredita. No aparece la frase fabricada del propósito. Estado `EXPLORANDO`, plan protector, evidencia que no confirma la hipótesis y una sustitución. La acción vieja deja de estar activa. Queda una obligación.

Concurrencia, sobre la cuenta del recorrido A, sin insertar un diagnóstico ya cerrado para saltarse la puerta. Otra cuenta no lee el plan ajeno. Un vínculo a una acción de otra cuenta no se guarda. Una marca rechazada no persiste. Una marca permitida sí, y un PATCH que omite `contentTags` la conserva. Un fallo inyectado entre las escrituras de la revisión no deja la acción en pausa ni la semana cerrada. Dos respuestas solapadas a la misma pregunta dejan una fila y un 409.

Compatibilidad. Una sesión `COMPLETED` insertada sobre `formulario-completo@4`, que sigue inactiva, se lee por HTTP. La pregunta `formulario-v1:E-PER-000!R241` conserva el contexto `@actividad:pasion` y el texto guardado. La lectura avisa que la captura quedó en pasión y la fila de la fuente es profesión. No reescribe la respuesta ni la pregunta. Una cuenta nueva sigue abriendo `@5`.

### Componentes

jsdom y Testing Library. Consultas por rol y etiqueta. Cubre interacción, estados y el cuerpo que se envía. No cubre responsive, disposición, geometría, navegación completa, hidratación ni cookies de un navegador.

- Player: título y objetivo de Mentalidad e identidad, nota de evaluador ausente, escala, número en cm con tope, máximo de dos opciones. Continuar bloqueado fuera de rango. Guardado, fallo y 409 conservan la elección. La escritura manda la revisión que estaba cargada.
- Cruce: una combinación ya recibida, valoración parcial, retirar el vínculo, otra combinación, edición libre intacta.
- Plan: vínculo directo, valor y revisión de propósito en el payload. Un 403 de puerta muestra la alternativa y deja el borrador, incluido el texto de ayuda. Una restricción de inversión también.
- Revisión: la vista previa manda frecuencia y día. Un 409 deja la selección. La semana cerrada muestra el registro del snapshot. La semana siguiente muestra la acción nueva.
- Ficha: revisión, valores, fecha civil de Santiago y cobertura coinciden en perfil, inicio, propósito y calendario. Parcial sin total. El error de lectura no se presenta como ausencia. Marcar una tarea hecha no cambia la ficha mostrada.

### Diferencias que salieron al probar

- El cierre de módulo responde éxito y no el estado. El recorrido ahora vuelve a leer el estado. Antes se detenía en el primer módulo.
- El calendario mostraba la fecha UTC de la ficha. Ahora usa el mismo formato civil que las otras pantallas, y muestra el número de revisión.
- Si la ficha no se puede leer, propósito y calendario dicen que falló la lectura. Antes quedaban como si no hubiera ficha.

fast-check no está en el repositorio. Las invariantes siguen en casos tabulados: `iad-invariants`, `apply-week`, `answer-rules`, `purpose-synthesis`. No se agregó una dependencia para eso.

Typecheck de la web: siguen los 8 errores previos de tests de Lab (`expected_alerts` y `toContainText`). No aparecen en los archivos de esta pasada. `nest build` de la API terminó sin error.

## Recorrido del cuestionario al propósito y al plan

12 oct 2026, noche. Comprobado en este checkout, no con las cifras de una entrega anterior.

Respuesta corta: la cuenta sí entra a la auditoría, ve el título y el objetivo de la sección, y sigue por radiografías y perfil. Lo que no ocurría era el cruce. Las actividades no guardaban ámbito y opción, no había una fase para conectar columnas, y el propósito de la hoja no salía de lo que la persona elegía. Eso queda conectado ahora. La auditoría sigue sin demostrar numéricamente la alineación con un propósito escrito después.

| Tramo | Ruta | Qué lo ejecuta | Qué queda guardado | Fuente | Estado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Cuenta a auditoría con introducciones | `/diagnostico`, `/diagnostico/bienvenida` | `DiagnosticWelcome`, `DiagnosticPlayer` | Sesión de la versión activa | E-AUD-001 A2, A3, A4 | Implementado en `@5` | Navegador, 390 px. Capturas `tmp/recorrido-proposito/a-welcome-390.png` y `a-mentalidad-390.png` |
| 2. Auditoría a radiografías | Módulos `e-aud-*`, `f-rad-001`, `f-rad-002`, `f-rad-003` | Player y `diagnostic.service` | Respuestas por pregunta | Hojas del Excel | Implementado | Navegador: la misma cuenta cerró el cuestionario. Retoma `3 de 5` a `3 de 5` tras salir y volver a entrar |
| 3. Radiografías a perfil | `e-per-*` | Player | Texto, listas, números, excepciones | E-PER-000 | Implementado | La cuenta respondió origen, visión, valores, estándares, identidad y el resto hasta cerrar |
| 4. Actividades, cruce, borrador | Preguntas IKIGAI y `/proposito` | Player, `IkigaiCross`, `purpose-synthesis.ts`, `POST /journey/synthesis` | Actividad, vínculos, combinaciones, edición libre | C217:E245, A248:E260, `NO BORRAR` P:W | Implementado, con la corrección de `@5` | Navegador y fila en base. Pruebas de dominio |
| 5. Propósito a hoja, prioridad y plan | `/proposito`, `/planes` | `hdrp-contract.ts`, `createPlan` | Revisión de propósito, `linkKind`, `valueRef`, `purposeRevisionId` | Adaptación. La hoja sigue siendo E-PER-HdRP | Implementado | Navegador, 1440 px. `a-plan-1440.png` |
| 6. Plan a acción, registro y revisión con efecto futuro | `/calendario` | `apply-week.ts`, `review-guidance.ts` | Criterio, día futuro, semana cerrada | Adaptación de producto | Parcial | Pruebas de dominio. No observado de punta a punta en el navegador en esta pasada |

### Mapa posterior al cuestionario

La persona elige actividades, conexiones, partes del propósito, estado de la dirección, valor o estándar del plan, vínculo y, en la revisión, si mantiene, modifica o retira. El sistema propone la frase cuando las cuatro partes están elegidas, muestra lo que falta, ofrece las guías que ya existían y, en la revisión, una pregunta según lo que la persona marca. No cambia el plan solo.

| Regla | Fuente | En el producto | Sigue abierto |
| --- | --- | --- | --- |
| Auditoría 23 a 115, aparte de desarrollo y sentido, relaciones, finanzas, identidad, dificultades y personalidad | Excel y decisiones 1 a 6 | Sigue el cálculo ya probado. No lo volví a correr entero | Nada nuevo en la fórmula |
| La auditoría no es la alineación con el propósito | Este encargo | La ficha IAD sigue siendo otro instrumento, de nueve respuestas | No es una validación objetiva |
| Cruce sin escala en A258 | Excel, fila vacía | `cruce-cualitativo@1`: lo reconozco, lo reconozco parcialmente, no lo reconozco, todavía no tengo información | Si Rafa define una escala, reemplaza esta |
| Vocación | Encabezado contra fila 226 | El cruce pregunta por facilidad o capacidad de desarrollarse y conserva el nombre Vocación | Cuál de las dos definiciones manda |
| Propósito A260 | Plantilla | Borrador editable. La edición libre no se pisa. Si falta una parte, hay preguntas abiertas | Ninguna fórmula nueva |
| IAD-MK 0.1 | Código vigente | 1 a 5, normalizado `25 * (respuesta - 1)`, pilar con 3/3, total con 9/9 | Sigue siendo borrador |
| Revisión | `apply-week.ts` y `review-guidance.ts` | Modificar puede cambiar criterio o día futuro. Los registros viejos no se mueven. La pregunta de estrategia no se aplica sola | El horizonte de 21 días está en el calendario cuando la acción tiene día. No se creó una acción con día en el navegador |

### Trazabilidad de la cuenta `mk.cross.1791838450117@fixtures.mk.invalid`

Contraseña de la prueba: `Recorrido2026`. Cuestionario cerrado en el navegador, en `formulario-completo@4`.

| Paso | Dato |
| --- | --- |
| Valor | `E-PER-000!R40` y `R51`: Autodominio |
| Pasión | `R220`: ámbito Creación y Expresión, respuesta «Escribir ensayos para equipos» |
| Profesión | `R241`: «Diagnosticar problemas de un negocio». En `@4` la pregunta ofrecía ámbitos de pasión. En el cruce se eligió Consultoría y Asesoría Técnica |
| Cruce | 3 combinaciones y 4 vínculos. No salieron de emparejar filas |
| Propósito | Edición libre: «Quiero probar escribir ensayos para equipos.» Estado EXPLORANDO. Revisión de propósito `4dbc186c-9321-4eb6-896a-efe3e580c987` |
| Plan | «Un ensayo usable». Vínculo DIRECT. `valueRef` es el texto de Autodominio. El artefacto de la guía empieza por ese valor |

Ese valor no es un puntaje. La auditoría de esa cuenta no se convirtió en el propósito.

### Qué se corrigió

- `@5` para sesiones nuevas. Cada campo de IKIGAI tiene sus cinco ámbitos y las opciones del `SWITCH`, no las de la misma fila. `@4` no se reescribió.
- El player pide ámbito, desarrollo de idea y respuesta específica. Si cambia el ámbito, la opción se vacía y el texto queda.
- En `/proposito` hay cuatro columnas, conexión por clic o teclado, varias combinaciones, valoración cualitativa y borrador.
- El plan guarda vínculo, valor y revisión de propósito en columnas nuevas. Migración `20261012170000_plan_purpose_link`, aplicada en la base local `maximuskratos` de localhost:5433.
- La revisión puede cambiar el día futuro sin tocar los registros. La ayuda de la revisión está probada en dominio, no en el navegador.

### Pruebas de esta pasada

- `purpose-synthesis.test.ts`, `answer-rules.test.ts`, `question-capture.test.ts`, `apply-week.test.ts`, `plan-gate.test.ts`, `hdrp-contract.test.ts`, `instrumentos-score.test.ts`, `instrumentos-isolation.test.ts`: 50 de 50, y después el archivo de síntesis otra vez con 9 de 9.
- Typecheck de la API sin errores. La web sigue con los 8 errores viejos de tests de Lab.
- Navegador, Chromium, cuenta de arriba. Bienvenida y objetivo de Mentalidad e identidad a 390 px. Cuestionario completo por la interfaz, con salida, cierre de sesión y retoma. Cruce a 390 y 1440 sin scroll horizontal. Plan con el valor visible. Capturas en `tmp/recorrido-proposito/`.

### Pendiente

- El segundo recorrido, el de exploración con excepciones y sin propósito fabricado, no se hizo en el navegador.
- No se observó en el navegador una acción con día, el horizonte de 21 días, ni una revisión que cambie el futuro y conserve el registro.
- La ficha de alineación no se comparó entre Inicio, Perfil y Propósito en esta pasada. El cálculo de IAD-MK 0.1 no se tocó.
- `@4` sigue en la base con el contexto equivocado. Las sesiones de esa versión se leen por número de fila.

## Filas que faltaban

12 oct 2026. Revisión `formulario-completo@3`, activa para sesiones nuevas. `@1` y `@2` no se reescribieron. `@2` conserva sus sesiones.

Entraron seis filas del Excel que el extractor no copiaba:

- Origen, fila 23: qué parte de la herencia conservar, purificar y transmitir. El bloque de origen cortaba en la fila 22.
- Cintura, opcional, en centímetros. Cambios de peso de los últimos 6 a 12 meses. No tenían número en la columna A, y la revisión 2 se detuvo en la grasa corporal.
- Nivel de dolor, de 0 a 10, solo si el dolor no es «No».
- Texto de la otra fuente de estrés, solo si se marcó Otra.
- Por qué el cuerpo no refleja la versión deseada, solo si la respuesta no es sí.

Los títulos de los cinco factores de personalidad no se agregaron como preguntas. No son ítems. Las 15 frases ya estaban, y cada una muestra ahora el título del factor.

Las 45 frases de dificultades muestran el grupo y el ámbito: patrones repetitivos, emociones rechazadas, proyección, excusas y autoengaño, integración, con sus tres ámbitos cada una. No se crearon preguntas nuevas.

## Cuestionario completo en la interfaz

7 oct 2026, noche. Una cuenta nueva recorrió el cuestionario por el navegador, sin precargar respuestas, y volvió a encontrar la misma lectura. No cierra ocasiones ni la revisión versionada.

Versión

- La activa para sesiones nuevas es `formulario-completo@2`, mismo `definitionRef` `formulario-completo`. El archivo es `packages/database/definitions/formulario-completo@2.json`: 31 módulos y 233 preguntas.
- `formulario-completo@1` sigue publicada e inactiva. Había 11 sesiones en esa versión. No se reescribieron sus preguntas ni sus lecturas.
- El generador es `scripts/formulario/build_formulario_v2.mjs`. Parte de @1 y de las listas de NO BORRAR. No interpreta el Excel en cada petición.

Qué cambió de tipo

- Valores: selección múltiple, máximo 10, lista de NO BORRAR. Los tres esenciales salen de esa selección y el servidor rechaza uno que no esté entre los ya elegidos.
- Números con unidad: edad, altura, peso, grasa corporal, comidas y minutos. Desconocido no se guarda como cero. La grasa va de 0 a 100. El sueño sigue en horas, de 0 a 14.
- Salud, alimentación, actividad y percepción corporal usan opciones. El detalle condicional aparece solo si el padre lo pide. Si el padre queda desconocido, el detalle queda pendiente y no se marca como no aplicable.
- IKIGAI pide la actividad y en qué otros campos también se reconoce. No hay puntaje de cruce.
- Sexo, altura, peso y grasa estaban fuera de @1. Entran en @2. El relato de origen, visión, estándares y huella sigue en texto, porque la fuente es texto.

Excepciones y guardado

- Migración `20261008023000_response_revision`, local. `questions.allowed_exceptions` vacío por defecto. En `responses`: `exception_kind`, `exception_origin`, `revision`. Historial en `response_revisions`. No borra respuestas viejas.
- Excepciones que la persona puede elegir: no lo sé, no aplica, prefiero no responder. Pendiente de la persona no cierra el bloque. La que pone el servidor cuando el padre no define el detalle sí permite seguir, y archiva la respuesta anterior.
- Una escritura con revisión atrasada responde conflicto. Guardar y salir manda la respuesta válida. Si falla, el texto queda y se puede reintentar. El player dice Guardando o Guardado.

Recorrido observado

- Cuenta `mk.q.1791423130524@fixtures.mk.invalid`, clave `QuestionnaireWalk2026`. Registro por la interfaz. Chromium, 390 px.
- Después de tres respuestas: Guardar y salir, cerrar sesión, entrar de nuevo. La pregunta era la cuarta del primer módulo, no la primera.
- Cerró el cuestionario. Sesión COMPLETED en `formulario-completo@2`. Lectura `formulario-score@1`: auditoría 69 de 115, relaciones 36 de 60, finanzas 36 de 60, identidad 30 de 40. Arquetipo `sin-clasificar`.
- Otro ingreso mostró otra vez 69 de 115 y «Tu lectura». Sin scroll horizontal a 390 ni a 1440. Captura: `tmp/journey-gate/q-perfil-390.png`.
- Las respuestas de esta cuenta son opciones intermedias o textos cortos de prueba. No son una persona plausible.

Pruebas

- `answer-rules.test.ts`: 5. Cubren máximo, esenciales, número, IKIGAI, excepción excluyente, padre desconocido, revisión atrasada.
- `question-capture.test.ts`: 1.
- No corrí la suite API completa en esta pasada.

Sigue pendiente

- Ocasiones a 21 días y revisión que cambie frecuencia o sustitución.
- No está en controles cada fila de NO BORRAR. Faltan, entre otras, el nivel de dolor y parte del detalle de actividad. Esas filas no estaban en @1 y no se agregaron todas.
- El conflicto de dos pestañas no se vio en el navegador. La regla está en la prueba de revisión.
- El recorrido de esta cuenta no dejó un padre en desconocido. Ese caso está en la prueba de disposición, no en la captura.

## Aclaración de límites y marca permitida

7 oct 2026, noche. No cierra el encargo. Cierra el hueco que la entrada anterior dejó sin observar: una marca de salud que sí se guarda, la reactivación del plan y una salida cuando el texto o la conversación no alcanzan para decidir.

Mapa de lo que ya estaba conectado

- `completeDiagnostic` sigue creando el perfil. Si la versión es `formulario-completo`, después llama a `persistFormularioReading`. El arquetipo de esa versión queda `sin-clasificar`. La lectura va a `indices` y a `DiagnosticFormResult`. La columna `scores` del perfil todavía recibe el snapshot de dimensiones en el cierre; la pantalla de perfil no la usa para esta versión, elige la lectura por `scoringVersion`.
- La hoja sale de `hdrp-contract.ts` con hoja y celda. IAD sigue en la misma revisión de propósito.
- Quien escribe planes o tareas es `createPlan`, `patchPlan`, `addAction` y `addDomainAction`. No hay un plan creado solo por entrar a un ámbito. El correo a `@fixtures.mk.invalid` sigue suprimido.

Hecho

- Un texto de salud que no es un «No» exacto queda ambiguo. No se presenta como límite vigente. El aviso pide aclararlo. La respuesta original no se reescribe.
- La aclaración es otra fila, fechada, en `member_clarifications`. «No limita lo que voy a hacer» permite la marca. «Hay un límite vigente» la rechaza y no guarda esa acción. Una lesión descrita en el texto, aclarada como no vigente, no bloquea el esfuerzo.
- Confrontación sin respuesta pide «Puedo hacerla» o «No es segura». Preparar el paso sin esa marca sigue pudiendo guardarse. Si puede hacerla, la acción guarda `conversationOutcome` VIABLE.
- `patchPlan` a ACTIVE vuelve a pasar la puerta y revisa las marcas de las acciones activas. Con un límite vigente declarado, el plan sigue en borrador. Sin cuestionario, responde `FORMULARIO_REQUIRED` y también sigue en borrador.
- Un PATCH de acción que no envía marcas conserva las que ya tenía, incluida la de conversación.
- En Mente, el aviso y los dos botones quedan en pantalla, encima de Guardar tarea.

Migración

- `20261008013000_member_clarification`, aplicada en `maximuskratos` de localhost:5433. Tabla nueva e índice por usuario, alcance y fecha. Columna nula `conversation_outcome` en `plan_actions`. No toca respuestas ni puntajes. No se editó ninguna migración ya aplicada.

Observado en la cuenta `mk.evid.1791418534832@fixtures.mk.invalid`

- R27 sigue siendo «Respuesta local de prueba.» después de aclarar.
- Esfuerzo físico con «No limita lo que voy a hacer»: la acción queda con `PHYSICAL_EXERTION`. Otra sesión, por API y por navegador, la vuelve a leer.
- Con «Hay un límite vigente», el alta responde 403 y la acción no existe.
- El plan pasó a borrador. Reactivarlo en ese estado respondió 403 y siguió en borrador. Una aclaración posterior de que no limita, y entonces la reactivación devolvió ACTIVE.
- Confrontación sin respuesta: 403 `CLARIFICATION_REQUIRED`. Con «Puedo hacerla»: 201 y `conversationOutcome` VIABLE. Editar el título sin enviar marcas dejó la marca y VIABLE.
- Cuenta nueva sin cuestionario, con un borrador creado solo para probar la puerta: PATCH a ACTIVE dio `FORMULARIO_REQUIRED` y el estado siguió en DRAFT. Ese borrador no es un recorrido.
- Navegador, 375 px: esfuerzo físico permitido se ve en Cuerpo. Confrontación muestra los botones y conserva el texto. Sin scroll horizontal a 320 y 1440 px. Captura: `tmp/journey-gate/h-conversacion-aclarar-375.png`.

Pruebas de esta pasada

- `plan-gate.test.ts` 18, `instrumentos-score.test.ts` 12, `instrumentos-isolation.test.ts` 2, `hdrp-contract.test.ts` 2, `apply-week.test.ts` 2, `next-step.test.ts` 6, `mail-fixture.test.ts` 2. En una sola ejecución: 44 de 44. Typecheck de la API sin errores.
- No corrí la suite API completa ni la web completa en esta pasada.

Sigue sin ser el cierre

- Player con tipos del Excel, excepciones, autoguardado y reanudación desde la interfaz.
- Síntesis de la hoja que la persona elige frente a su texto, y exportación.
- Ocasiones a 21 días y revisión que cambie frecuencia o sustitución, no solo el criterio.
- Dos recorridos desde cuentas vacías, con el cuestionario hecho en el navegador.
- La columna `scores` del perfil todavía guarda el snapshot de dimensiones al cerrar. La pantalla no lo muestra como alineación.

## Marcas de contenido en la acción

7 oct 2026, noche. Cierra las cuatro decisiones que dejó la entrada anterior. Local, base `maximuskratos` en localhost:5433. Sin producción y sin commit.

Decisiones

- Migraciones aditivas en la base local, una por entrega, revisadas antes de aplicar. Esta es `20261007220000_action_content_tags`: una columna `content_tags` en `plan_actions`, texto en lista, vacía por defecto. Las filas ya creadas quedan sin marcas.
- La restricción no va en la guía. La persona marca, en esa acción, si implica esfuerzo físico, dieta, suplemento, medicación, confrontación, inversión o deuda. El servidor aplica `decideAction` a esa marca. Las 11 guías siguen sin etiquetas, porque `cuidado` y `dinero` son las alternativas que la regla recomienda y etiquetarlas las bloquearía.
- Acceso: se mantiene el código. Cualquier cuenta autenticada entra al cuestionario. Las dos pruebas de `diagnostic-member-preview` quedaron alineadas con eso. La de cierre sube el tope de 200 a 400 pasos y el tiempo a 120 s, porque el catálogo actual no cabe en 200. Resultado: 11 de 11, la de cierre en 8,4 s.
- Salud: se mantiene la lectura actual. Solo un «No» exacto cuenta como ausencia. Cualquier otro texto cuenta como sí.

Hecho

- `parseContentTags` acepta esa lista, ignora repetidos y rechaza lo demás con 400 «Marca de contenido desconocida.». `FINANCIAL_DECISION` no se ofrece.
- `addAction` y `addDomainAction` revisan las marcas. Sin marcas, la acción se guarda y `content_tags` queda vacío. El servidor no infiere marcas del título.
- Si la regla bloquea, responde 403 `RESTRICTED` con el motivo, las alternativas y enlace a /planes. El aviso muestra el motivo, «Puedes:» con las alternativas, y el enlace. El borrador y la marca se conservan. El aviso queda junto al botón de guardar.
- En la cuenta `mk.evid.1791418534832@fixtures.mk.invalid` las cinco celdas de salud son «Respuesta local de prueba.», así que se leen como límite vigente. Esfuerzo físico, dieta, suplemento y medicación se rechazan con «Hay un límite vigente que esta acción puede contradecir.» Inversión y deuda se rechazan siempre. Confrontación se rechaza con «Falta aclarar si la conversación es viable.», porque `conversationUnsafe` sigue en null y no hay dónde aclararlo.
- Una tarea sin marcas sí se guarda. En la respuesta de la API, `contentTags` es `[]`.

Pruebas

- `plan-gate.test.ts`: 16, incluidas las tres de `parseContentTags`. `guide-tags.test.ts`: 1. Typecheck de la API sin errores.
- API local, esa cuenta: 403 con alternativas para esfuerzo físico, inversión y confrontación. 400 para una marca desconocida. 201 con `contentTags: []` para una tarea sin marcas.
- Navegador, Chromium, 375 px, la misma cuenta. En /cuerpo, esfuerzo físico marcado: el aviso queda a unos 100 px del botón, nombra la alternativa y enlaza a /planes. El texto y la marca siguen. Sin la marca, la tarea se guarda. En /planes, inversión marcada: el aviso queda en ese formulario y el borrador sigue. Sin scroll horizontal a 320 y 375 px. Capturas: `tmp/journey-gate/e-cuerpo-marca-375.png` y `tmp/journey-gate/e-planes-inversion-375.png`.

No observado

- Una marca de salud guardada. En esta cuenta ninguna pasa la regla. El caso que sí pasa (todas las respuestas de salud en «No») está en la prueba de `decideAction`, no en una fila de la base.
- `patchPlan` a ACTIVE, igual que en la entrada anterior.

## formulario v1, escritura con puerta y primer recorrido en navegador

7 oct 2026, noche. Bloques A, B y C de la continuación: una sola puerta de escritura en servidor, lectura del formulario compatible, restricciones en servidor para acciones con guía y errores visibles en la interfaz. Local, con la base de desarrollo. Sin producción, sin migraciones, sin commits y sin correos a personas.

Hecho

- Puerta de escritura en `apps/api/src/journey/plan-gate.ts`. `createPlan`, `patchPlan` a ACTIVE, `addAction` y `addDomainAction` pasan por ella. Sin cuestionario cerrado responde 403 `FORMULARIO_REQUIRED` con enlace a /diagnostico. Sin dirección que permita planear responde 403 `DIRECTION_REQUIRED` con enlace a /proposito. EXPLORANDO, PROVISIONAL y CONFIRMADO_POR_USUARIO sirven; no hace falta confirmar la dirección.
- Se quitó `ensureActivePlan`, que creaba un "Plan vigente" sin que nadie lo pidiera. Una tarea de ámbito sin plan vigente responde 409 `NO_ACTIVE_PLAN` con enlace a /planes.
- `createPlan` exige que la nota de prioridad empiece por un vínculo válido: `DIRECT`, `ENABLING`, `PROTECTIVE` o `EXPLORATORY`.
- `formularioReading` busca una sesión COMPLETED de `formulario-completo` con su resultado `formulario-completo`. La puerta, Inicio y el estado usan esa lectura.
- Restricciones en servidor. `addAction` acepta `guideId`. Una guía desconocida responde 400. Una guía con etiquetas pasa por `decideAction` con las respuestas de salud de F-RAD-001 (celdas R18, R20, R22, R24 y R27). Si bloquea, responde 403 `RESTRICTED` con alternativas y enlace a /planes. Ninguna de las 11 guías lleva etiquetas todavía (`GUIDE_TAGS` está vacío), así que esa rama solo tiene pruebas de unidad.
- Siguiente paso en `apps/api/src/journey/next-step.ts`. Con dirección que permite planear y sin plan vigente, el paso es Crear el plan, sin exigir firma. Sin dirección, Abrir la hoja de ruta, indicando qué falta.
- Ficha IAD. `saveAlignment` actualiza el contenido de la revisión y no toca `confirmedAt`. Guardar la ficha no reabre la firma.
- Perfil. La vista del formulario se elige por `scoringVersion` que empieza por `formulario-score`, no por `auditTotal`. Si no hay auditoría, muestra Pendiente en lugar de "0 de 115".
- Errores visibles. `JourneyApiError` conserva estado, código y enlace. `JourneyNotice` muestra el motivo con el enlace. Plan y tareas de ámbito conservan el borrador si el servidor rechaza.
- Correo. `sendNewRegistrationNotify` no envía a `@fixtures.mk.invalid`.
- Copy. Con el paso Crear el plan, la tarjeta de Inicio dice "Falta un plan vigente". Antes decía "Sigue con el plan", que daba por hecho un plan que no existe (`AmbitStage.tsx`, `cardTitle`).

Pruebas

- Dominio y API, 22 de 22: `plan-gate.test.ts` (13), `next-step.test.ts` (6), `guide-tags.test.ts` (1, compara los ids de guía con `plan-guides.ts`) y `mail-fixture.test.ts` (2).
- API completa, en ese momento: 186 pasan, 1 omitida y 2 fallan, ambos en `diagnostic-member-preview.test.ts`. Este bloque no tocó ese archivo ni `member-access.ts`. Uno de los fallos espera rechazar una cuenta normal, mientras `member-access.ts` documenta que cualquier cuenta autenticada accede al cuestionario. El otro es un timeout de 5 s en una prueba con base de datos. La entrada siguiente los deja en verde.
- Web completa: 259 pasan y 2 se omiten.
- Typecheck: API sin errores. Web con 8 errores, todos en `apps/web/test/lab-*`. Ninguno en archivos de este bloque.
- Navegador, Chromium con Playwright, API en 127.0.0.1:4000 y web en 127.0.0.1:3000. Script `tmp/journey-gate/scripts/browser-check.mjs`: 21 de 21.
  - A. Cuenta creada por la interfaz, sin cuestionario. Registro. Plan y tarea rechazados con motivo y enlace. Borrador conservado. Sin scroll horizontal a 320, 375 y 1440 px.
  - B. Cuenta con cuestionario cerrado por la API y dirección EXPLORANDO sin firma. Siguiente paso Crear el plan, con el título "Falta un plan vigente". Tarea sin plan rechazada con enlace a /planes. Plan creado. Tarea guardada (B5).
  - C. Firma y ficha. Hoja firmada. Ficha guardada (201). La firma sigue visible tras guardar. No pide otra firma.
  - D. Perfil. "Tu lectura" y ningún "0 de 115".
- Capturas en `tmp/journey-gate/`: `a-planes-sin-cuestionario-375.png`, `a-mente-sin-cuestionario-375.png`, `b-panel-explorando-sin-firma-375.png`, `c-proposito-firmada-tras-ficha-375.png` y `d-perfil-375.png`.

Limitaciones de la evidencia

- Las cuentas de B, C y D no se registraron por la interfaz y el cuestionario no se completó por ella. Se cerró por la API con `walk-explore.mjs`, respondiendo siempre la primera opción o un texto corto. Eso prepara la cuenta, pero no es un recorrido de navegador desde cuenta vacía. El recorrido completo, con cuestionario, sigue pendiente.
- La cuenta `mk.evid.1791418035736` ya tiene firma y plan, así que no sirve para repetir B. Para repetirlo, crea otra cuenta con `walk-explore.mjs`.
- Como ninguna guía tiene etiquetas, el bloqueo `RESTRICTED` no se ha visto ni en la interfaz ni en la API con contenido real.
- `patchPlan` a ACTIVE no tiene prueba propia, ni de API ni de navegador.
- Correo: el filtro tiene prueba de unidad. No puedo comprobar desde aquí si los registros anteriores al filtro enviaron la notificación al equipo.

Migraciones

- Ninguna en este bloque. Prisma sin cambios.
- Cuentas de prueba creadas en esta tanda, en la base de desarrollo local: 3 `mk.ui.*` por la interfaz y 1 `mk.evid.1791418534832` por la API. La cuenta `mk.evid.1791418035736` es de la pasada anterior.

Estado de este bloque

| Elemento | Dominio | Integración o navegador | Pendiente |
| --- | --- | --- | --- |
| Puerta de escritura | `plan-gate.test.ts` | Navegador: plan (A2, B4) y tarea de ámbito (A6, B2, B5) | Acción de plan con guía y `patchPlan` a ACTIVE |
| Lectura del formulario compatible | No dedicada | Navegador: B1 | Cuenta completada desde la interfaz |
| Restricciones con guía etiquetada | Mapper y `decideAction` | No | Etiquetas y fuente de `conversationUnsafe` |
| Siguiente paso | `next-step.test.ts` | Navegador: B1 y B1b | Ninguno en este bloque |
| Ficha sin reabrir firma | No dedicada | Navegador: C1 a C3, ficha con 201 | HdRP-v1 y firma exacta (Entrega 2) |
| Perfil por procedencial formulario | No dedicada | Navegador: D1 y D2 | Ninguno en este bloque |
| Errores con motivo y borrador | No | Navegador: A2 a A7 a 320, 375 y 1440 px | Ninguno |
| Correo a fixtures | `mail-fixture.test.ts` | No | Envíos anteriores al filtro, no verificable |

Decisiones que quedaron abiertas en esta entrada. La entrada siguiente las cierra.

1. Migraciones aditivas en la base local. Excepciones tipadas, ocasiones, revisión versionada, `AlignmentCheckpoint`, artefactos de guía y `accountKind` FIXTURE no caben en el esquema actual. El brief pide no migrar.
2. Etiquetas de guía. Hoy ninguna guía está etiquetada. Si la guía de conversación lleva `CONFRONTATION`, sus pasos quedan bloqueados mientras `conversationUnsafe` sea null, y el mapper de salud todavía no lo calcula.
3. Política de acceso. `member-access.ts` da acceso a cualquier cuenta autenticada. Dos pruebas de `diagnostic-member-preview` esperan lo contrario.
4. Preguntas de salud. Hoy solo un «No» exacto cuenta como ausencia de restricción y cualquier otro texto cuenta como sí. Una lista cerrada necesita `formulario-completo@2`.

Del brief, sin cerrar

- Entrega 1. Player con tipos del Excel, excepciones tipadas, autoguardado con estados, `ResponseRevision`, devolución y práctica por bloque, atestación 18+, puntajes por instrumento con `FormularioReading`, prueba de aislamiento y fixture que completa el formulario.
- Entrega 2. HdRP-v1 sobre `PurposeRevision` con `directionStatus`, firma exacta, export, `AlignmentCheckpoint`, `PriorityProposal`, `MemberContext` con zona, `PlanVersion` y `HelpArtifact` en las 11 guías.
- Entrega 3. Hoy, `PlannedOpportunity` con horizonte de 21 días, `ActionRecord` extendido, `ChangeObservation`, revisión versionada preview/apply, writers antiguos en 410, accountKind FIXTURE, `SimulationClock`, endpoints ADMIN, seed de cuatro fixtures, `JourneyEvent` sin contenido y los e2e `formulario-full-journey` y `formulario-exploring`.
- Entrega 4. Casos críticos, móvil y accesibilidad, permisos, `FORMULARIO_REVISION_MANUAL.md`, `MK_COPY_PUBLICO_PROPUESTO.md`, `MK_PRUEBA_5_PERSONAS.md` (solo protocolo), `FORMULARIO_COBERTURA.md` y la tabla final de aceptación.
- Segundo recorrido de navegador desde cuenta vacía, con cuestionario completado por la interfaz.

## Rutas sin el nombre anterior

7 oct 2026. Las carpetas y archivos de código pasaron a `apps/api/src/instrumentos`, `packages/database/src/formulario-completo.ts`, `packages/database/src/formularios-previos.ts`, `packages/database/definitions/formulario-completo@1.json`, `scripts/formulario/extract_formulario_v1.py` y `apps/web/lib/plan-guides.ts`. La migración aplicada quedó como `20261007190000_formulario_completo_source`. El identificador de versión en la base sigue siendo el que ya tienen las sesiones.

## formulario v1, ficha en Inicio y hoja trazada

7 oct 2026. Sobre la cuenta local ya cerrada. No abre otra versión del catálogo ni migra el esquema.

Mapa de lo que ya estaba conectado: una sesión nueva usa `formulario-completo@1`, el cierre llama a `persistFormularioReading`, y la ficha IAD vive en `PurposeRevision.content.iad`. Inicio no leía esa revisión. `hdrpFacts` buscaba el módulo `e-per-000`, que esta versión no tiene, y por eso los artículos salían pendientes. El calendario leía el criterio vigente también en una semana ya cerrada. `WeekReview.snapshot` ya guardaba el criterio anterior.

- Inicio, perfil y propósito leen la misma ficha. En la cuenta local: 50, método en revisión, 7 oct 2026, espíritu 75, mente 50, cuerpo 25. Si no hay ficha, la placa dice que no está guardada. Si falla la lectura, lo dice aparte.
- La hoja toma hoja y celda (`E-PER-000!R30`, no solo `R30`). Con respuestas de texto muestra el borrador. Identidad remite al total del perfil y no confirma la hoja. Personalidad se marca como lectura descriptiva. IKIGAI muestra actividades y deja el cruce sin elegir. Relaciones y finanzas muestran la banda del formulario. No escriben horas ni un porcentaje para invertir o endeudarse.
- La semana cerrada conserva «Hay un parrafo» y el registro Hecho. La semana siguiente muestra «Hay un parrafo sin diseno».
- En planes, el borrador de valores de la hoja aparece junto a la guía. Elegir «Traducir un valor en estándar» parte de ese texto.

Pruebas: `npm run test -w @mk/api -- test/instrumentos-score.test.ts test/instrumentos-isolation.test.ts test/hdrp-contract.test.ts test/apply-week.test.ts`. 18 en verde. La nueva comprueba que la ficha guardada se lee y no se recalcula. Las de HdRP ya no esperan horas ni porcentajes de inversión. Esas pruebas no cubren el navegador ni dos cuentas vacías.

Observado en navegador, 320, 375, 390, 768 y 1440, sin scroll horizontal: `/panel`, `/perfil`, `/proposito`, `/calendario` y `/planes` de la cuenta local.

Sigue pendiente: player con tipos del Excel, dos recorridos desde cuentas vacías, ocasiones a 21 días, y una revisión que cambie frecuencia sin nueva tabla. Esta continuación no migra Prisma.

## formulario v1, una cuenta nueva en local

7 oct 2026. API en el puerto 4000 y web en el 3000. Cuenta `formulario.local.1791413575216@fixtures.mk.invalid`, clave `LocalWalk123`. Las 229 respuestas pasaron por la API.

- 229 respuestas y 31 módulos. La sesión cerró con `sin-clasificar`.
- Un login distinto volvió a leer el mismo perfil. En `/perfil`: auditoría 23 de 115, categoría por debajo de 46. Relaciones 12 de 60, detrimento. Finanzas 12 de 60, crítico. Identidad 10 de 40. Desarrollo y sentido 10 de 50. Cinco grupos de dificultades en 18 de 18. Cinco descriptores de personalidad, entre ellos sensibilidad emocional. Esas cifras salen de la primera opción de cada pregunta, o de un texto corto cuando no había opciones.
- Hoja en EXPLORANDO, con la referencia guardada. Ficha IAD: espíritu 75, mente 50, cuerpo 25, total 50. En `/proposito` los nueve selectores quedan en 4, 4, 4, 3, 3, 3, 2, 2, 2. Guardar la hoja conserva la ficha junto con el contenido anterior.
- Plan «Borrador local» con el texto de ayuda. Acción hecha el primer día de la semana. El cierre cambió el criterio a «Hay un parrafo sin diseno». `/calendario` muestra ese criterio, el estado Hecho y la semana cerrada.

Inicio sigue con el índice vacío. Los artículos de la hoja siguen en Pendiente aunque el perfil ya tenga lectura. `auditBand` en el JSON queda vacío. La categoría va en `auditNote` y es la que se ve en el perfil. No hay un segundo recorrido ni versiones anteriores de la acción.

## formulario v1, ficha y guía en la interfaz (parcial)

7 oct 2026.

- La hoja de ruta muestra la ficha «Alineación declarada» con las nueve preguntas. Guardar llama a `POST /journey/alignment`, calcula IAD-MK 0.1 y lo deja en la revisión de propósito. No bloquea el plan. «No tengo información suficiente» deja ese criterio pendiente.
- El plan ofrece once guías con pasos y un texto inicial editable. Lo que la persona corrige se guarda en el plan.
- El perfil, si la lectura los trae, muestra los cinco grupos de dificultades y los descriptores de personalidad.

No hay recorrido de navegador. No hay ocasiones a 21 días ni versiones históricas de cada acción.

## formulario v1, la revisión escribe el plan (parcial)

7 oct 2026. El cierre de semana ya no se queda en la foto.

- `applyWeekDecisions` retira la acción o le escribe el criterio nuevo. Modificar sin texto nuevo se rechaza.
- `closeWeek` aplica eso en una transacción y, si se repite, devuelve la misma semana.
- Inicio ya no dice que el plan se ajustó si el cierre no escribió. El texto ahora dice que las decisiones quedaron en el plan vigente, porque el cierre sí las aplica.
- Confirmar un plan exige cuestionario cerrado y una dirección EXPLORANDO, PROVISIONAL o CONFIRMADO_POR_USUARIO en la hoja de ruta.
- La hoja pide esa dirección y una referencia editable. El plan pide un vínculo y un texto de ayuda que queda guardado en el plan.

Prueba de dominio: `test/apply-week.test.ts`, junto con las 15 anteriores.

No observado en el navegador. La ficha IAD sigue solo en el cálculo, no en la pantalla. No hay ocasiones de 21 días ni los dos recorridos de extremo a extremo.

## formulario v1, catálogo conectado al cierre (parcial)

7 oct 2026, continuación. El cálculo anterior sigue. Ahora una sesión nueva usa `formulario-completo@1`.

- `scripts/formulario/extract_formulario_v1.py` leyó el Excel y escribió `packages/database/definitions/formulario-completo@1.json`: 31 módulos y 229 preguntas, entre ellas 23 de auditoría, 10 de desarrollo y sentido, 12 de relaciones, 12 de finanzas, 10 de identidad, 45 de dificultades y 20 de IKIGAI.
- Migración `20261007190000_formulario_completo_source` aplicada en la base local. `ensureFormularioCompleto` sembró el catálogo. `formularios-x-paso` quedó inactivo y legible. Preguntas con `sourceRef`: 229.
- Al cerrar una sesión de esa versión, `persistFormularioReading` guarda la lectura del formulario en el perfil y no usa el arquetipo de dimensiones. El perfil muestra auditoría, relaciones, finanzas, identidad y desarrollo y sentido cuando hay total.

Sigue sin estar el ciclo pedido: hoja de ruta con los tres estados, ficha IAD en pantalla, plan, ayuda, Hoy y revisión que cambie el futuro. Tampoco hay recorrido de navegador de una cuenta nueva.

## formulario v1, núcleo de cálculo (parcial)

7 oct 2026. Primera entrega ejecutable del prompt `MK_prompt_ejecucion_v1_revisado.md`. No es el recorrido completo.

Hecho y probado:

- Puntajes puros en `apps/api/src/instrumentos/score.ts`: auditoría 23 a 115 con cortes 46, 69 y 92, desarrollo y sentido aparte, identidad 10 a 40 sin categoría, cinco grupos de dificultades de 0 a 18, personalidad con ítems inversos.
- Alertas en `apps/api/src/instrumentos/signals.ts`: regla nativa y adaptación `alertas-aud@1` en las secciones 4 y 5. Sueño y grasa corporal con la conversión de porcentaje.
- Ficha IAD-MK 0.1 en `apps/api/src/instrumentos/iad.ts`: 0, 100, 50 y 58,33. Sin total si falta una respuesta.
- Restricciones en `apps/api/src/instrumentos/restrictions.ts`: una lesión pasada no bloquea el esfuerzo; un límite vigente sí.
- El quinto factor de personalidad se llama sensibilidad emocional en `hdrp-contract.ts`.
- El correo no sale hacia `@fixtures.mk.invalid`.
- Decisiones en `packages/database/definitions/formulario-completo.DECISIONES.md`.

Pruebas reales: `npm run test -w @mk/api -- test/instrumentos-score.test.ts test/instrumentos-isolation.test.ts test/hdrp-contract.test.ts`. 15 pruebas en verde.

Pendiente, y no presentado como hecho: catálogo `formulario-completo@1` en la base, player, hoja de ruta nueva, plan, Hoy, revisión aplicada, fixtures de cuatro personas y los dos recorridos de extremo a extremo.

## Segunda pasada de composición en Inicio

Registro versionable de lo que se implementa y se verifica en cada entrega. La auditoría del 30 de septiembre y el plan del Excel viven en `docs/`, que no está en git; este archivo no los reemplaza.

## Segunda pasada de composición en Inicio

30 sep 2026. Encima del contrato ya instalado. No cambia puntajes ni el cuestionario.

Inicio deja de repetir el mismo estado en cuatro cajas. Hay un encabezado con el estado de la auditoría, una sola explicación de por qué Mente, Espíritu y Cuerpo no tienen cifra, y el placeholder — en los tres pilares y en el índice. La acción siguiente usa un título distinto del botón. El texto que hablaba del servidor pasó a «Retoma tu auditoría donde la dejaste».

En escritorio la escena y la acción comparten un bloque con una separación de 40 px, dentro de un contenedor de 1120 px. En ventanas bajas la escena se reduce. En móvil la estatua ocupa la mayor parte de un encuadre de unos 280 px, las lecturas van en una franja y la acción queda debajo. Más y el avatar tienen 44 px y una separación. Escape cierra Más y devuelve el foco.

La escena de la estatua es la misma en móvil y en escritorio: los tres círculos quedan sobre la figura. Entrar a Mente, Espíritu o Cuerpo abre la pantalla desde ese círculo. Volver al panel cierra la vista hacia el mismo punto. Con movimiento reducido, el cambio de ruta es inmediato.

## Contrato de UI y corrección del shell de miembros

30 sep 2026. No cambia puntajes, permisos, metodología ni el cuestionario.

El contrato activo es `DESIGN.md` en la raíz. El export Aethelgard quedó en `docs/design-history/`, fuera de las reglas que carga Cursor. Reglas activas de UI: `mk-ui-contract`, `mk-member-ui`, `mk-public-ui`, `mk-player-ui`, `mk-admin-ui`. Salieron de `.cursor/rules` las que se contradecían: `ui-sources`, `ui-surface-contract`, `ikigai-player`, `public-section-alignment`, `avoid-ai-design`, `cinematic-scroll`. Siguen Matrix, sesiones y copy.

Tipografía comprobada en el repo. Bitte BC es el display de marca (`apps/web/public/fonts/bitte-bc.woff`), no una serif. El fallback es Barlow Condensed. La interfaz es Hanken Grotesk. El rol editorial es Noto Serif, ya alojada, token `--font-editorial`. No hay un archivo serif de BrandCrowd. La acción compartida es `--color-action` (`#c00100`). `--color-crimson` (`#ff0000`) sigue en los CTA de marketing.

Inicio usa la estatua RGBA `statue-standing.png`, círculo, cuadrado y triángulo. En escritorio los tres indicadores van sobre la escena. En móvil quedan debajo, con el texto legible. La placa no pinta 0, 100 ni los porcentajes de la referencia. Dice Por completar, No disponible, Cargando o Error. La acción es la de `GET /journey/state`.

El panel ya no devuelve al diagnóstico a quien acaba de salir. Entrar sigue abriendo el diagnóstico si el paso de la cuenta es ese. Guardar y salir se queda en Inicio.

Calendario: siete celdas del mismo ancho y alto. Seleccionar no cambia el tamaño. El rango se lee como 28 sep a 4 oct. La zona que muestra la API es la del producto. El fondo del shell de miembros es plano, sin la foto de columnas. La revisión semanal sigue aparte. Un guardado fallido de tarea deja el texto escrito.

Navegación en escritura normal. En escritorio el sidebar incluye las rutas de miembros, también Ruta, Propósito y Cuenta. En móvil, la barra inferior reserva la safe area y Más abre el resto.

Comprobado en Chromium, cuenta local de revisión, sin producción:

| Comando | Resultado |
| --- | --- |
| `npx playwright test e2e/dashboard-ambitos.spec.ts --project=chromium` | 3 de 3. Placa, días equivalentes a 1440 y a 320, sin overflow horizontal del contenido, Más con Propósito y Cuenta, borrador de tarea conservado si el POST falla, reduced motion con la escena y la acción visibles. |
| `npx playwright test e2e/member-preview.spec.ts --project=chromium` | 4 de 4. Teclado, Guardar y salir, reintento con la selección conservada, perfil servido. |

WebKit está instalado en la máquina. Una corrida del spec de dashboard no salió de la home de marketing al intentar entrar, y cortó a los 180 s. No queda verificado en WebKit ni en un teléfono real.

Capturas revisadas en `tmp/member-ux-despues/`: inicio a 1440, 390, 375 y 320, la acción a 320, calendario a 1440 y 320, tareas de Mente a 1440. No hay baselines de píxeles: la semana del calendario cambia y el texto de Inicio depende del estado de la cuenta. El CI (`.github/workflows/ci.yml`) no ejecuta Playwright.

Esos specs mueven la cuenta local de revisión: el de dashboard deja `onboardingStep` en `PROFILE_COMPLETE` para poder ver el panel, y `member-preview` reinicia el diagnóstico y, si llega al final, lo completa.

## Corrección visual del producto de miembros

30 sep 2026. No cambia puntajes, permisos ni la landing.

Inicio ya no muestra el porcentaje de tareas de la semana como índice de alineación. Ese 100% salía de `executionReading`. Los tres círculos y la placa dicen Por completar mientras el paso siguiente es el diagnóstico, y No disponible cuando las fichas ya no son el paso siguiente, porque la API no entrega un índice de Mente, Espíritu o Cuerpo. La acción principal es la que devuelve `GET /journey/state`.

El día seleccionado del calendario usaba `.mk-btn-primary`, que es `width: 100%`. Por eso ocupaba una franja y los otros días no. Ahora los siete días son celdas del mismo grid. Las tareas muestran Hecho como acción principal y el resto en Otros estados. La revisión semanal quedó aparte.

La estatua de cuerpo entero del repo era un JPG con fondo negro opaco. Los originales (`statue-aligned.jpg`, `statue-clean.jpg`) son bustos, no la figura de pie de la referencia. Se generó `statue-standing.png` volviendo transparente el negro de ese JPG. No es un recorte del asset clásico original, porque ese archivo no está en el proyecto.

Capturas anteriores: `tmp/member-ux-antes/`. Después: `tmp/member-ux-despues/`. `e2e/dashboard-ambitos.spec.ts` comprueba que la placa no es 100% y que los siete días conservan el mismo ancho al seleccionar uno.

## Dashboard de los tres ámbitos

30 sep 2026. Encima del recorrido. Spec: `MK_PROMPT_DASHBOARD_AMBITOS.md`.

Inicio de la cuenta de revisión es el panel de la estatua. Espíritu, Mente y Cuerpo abren `/espiritu`, `/mente` y `/cuerpo`. Una acción nueva lleva ámbito. El círculo y la placa muestran el porcentaje de tareas de la semana marcadas hechas, calculado en el servidor. Sin tareas, la placa queda vacía. No se pintan 74, 82, 65 ni 78.

Prueba visual: `e2e/dashboard-ambitos.spec.ts`. Capturas en `tmp/dashboard-ambitos/`.

## Recorrido de revisión (en curso, encima de la Entrega 0)

30 sep 2026. No reemplaza la Entrega 0. La especificación de ejecución es `MK_PROMPT_MAESTRO_RECORRIDO.md`.

Hecho en esta pasada:

- Historial: `DiagnosticSession.status` (`ACTIVE`, `COMPLETED`, `ABANDONED`), un índice único parcial de una sesión activa por cuenta, `MasterProfile.isCurrent` con un índice único parcial del perfil vigente. La versión `1.0` no se reescribió. Sigue con 24 preguntas. La que falta en la base, y está en el JSON, no se agregó.
- Catálogo nuevo `formularios-x-paso`, activo para sesiones nuevas. La `1.0` queda inactiva y legible. Incluye la auditoría E-AUD-001 (secciones 1 a 5 dentro del total de 115, sección 6 de Brooks aparte), F-RAD-001, F-RAD-002, F-RAD-003 y un Perfil del Cliente en textos y una elección de arquetipo. No es cada fila del Excel: E-PER de sombra, Big Five e IKIGAI del libro siguen como textos, no como las matrices de 45 ítems.
- Puntaje en el servidor (`excel-score.ts`): suma de auditoría hasta 115 con bandas 46, 69 y 92. Relaciones y finanzas hasta 60. La sección 6 no entra en las 115. Si no hay respuestas de pareja, la banda relacional queda pendiente, no se rellena con ceros. Pilares sin fórmula: el perfil lo dice.
- `POST /diagnostic/restart` abandona la sesión activa incompleta y abre otra. No borra una sesión cerrada.
- Hoja de ruta, planes personales, calendario semanal, cierre de semana con fotografía, y solicitud de orientación. Rutas `/proposito`, `/planes`, `/calendario`, `/asesores`.
- Escritorio: barra lateral. Teléfono: Inicio, Ruta, Calendario, Perfil. Cuenta sigue en el avatar.
- Estatua de cuerpo entero generada en `apps/web/public/images/landing/statue-standing.jpg`. Las del repo son un busto o un fondo, no el cuerpo entero de la referencia.
- Comentarios del Excel leídos: nota de Brooks (gobierno emocional, no supresión) y las escalas de deuda, ahorro, ingresos y planificación, usadas como anclas de la sección 4. No había nombres definidos ni filas ocultas de contenido. Las filas ocultas son subtotales. Las columnas E y F ocultas son avance y alerta.

Comprobado el 30 sep 2026, cuenta `revision.dev`, base local, sin producción:

- `e2e/member-preview.spec.ts`: 4 pruebas en verde. La cuenta de revisión recorre el catálogo nuevo, guarda y sale, reintenta si la red corta, y el perfil muestra el `auditTotal` que devolvió el servidor. La cuenta normal sigue en el panel de fundador y el diagnóstico responde 403.
- `e2e/journey-review.spec.ts`: Inicio muestra una sola acción, "Abrir la hoja de ruta", a 1440 y a 390. El calendario, con la semana ya cerrada, deshabilita el cierre y lo dice en el botón. Capturas en `tmp/recorrido-qa/` y `tmp/entrega0-qa/`.
- API, misma cuenta: confirmar la hoja guarda la revisión 1. Editar después crea la revisión 2 y no reescribe el propósito confirmado. Un registro repetido no duplica la fila. Cerrar la semana dos veces devuelve la misma fotografía. Cambiar el título del plan deja el título viejo dentro de esa fotografía. Otra cuenta recibe 403 al escribir el plan o el registro ajenos.
- `apps/api/test/excel-score.test.ts`: 115 con Brooks fuera, alerta de la sección 1 solo en 1, alerta de la sección 3 en 2, omisión de pareja que no es cero y deja la banda pendiente, bandas propias de relaciones y finanzas.

Sigue pendiente, y no se presenta como cerrado:

- E-PER no está ítem por ítem. Sombra, Big Five e IKIGAI del Excel siguen como textos, no como las matrices de la hoja. La HdRP no genera el párrafo de horas ni el de sombra: esas fórmulas siguen cortadas.
- El player no tiene número con unidad, lista de `NO BORRAR` con tope, ni un control de omitir distinto de dejar la pregunta. La banda de pareja queda pendiente si faltan respuestas o hay una omisión.
- El calendario lista los siete días y el registro de cada uno. No reprograma una acción futura ni distingue una hora de un día completo más allá de la fecha civil.
- Cuerpo no lista todavía los registros del método. Asesores no lista las alertas de la ficha: guarda una solicitud de texto.
- En escritorio la barra superior sigue junto a la lateral. "Más" queda oculto desde 960 px. La estatua es de cuerpo, generada, y los tres anclajes dicen lectura pendiente.

## Entrega 0: acceso privado de revisión y contrato de sesión

Fecha: 30 sep 2026. Base: rama `pilot/ikigai-lista`, commit `108f572`. Sin commit, sin merge, sin deploy. No se tocaron datos de producción. `EARLY_ACCESS_MODE` sigue en `true` en API y web, y el sitio público conserva sus mensajes.

Alcance: MK-01 (acceso privado por cuenta), MK-03 (sesión para un cliente nativo sin cookies), Guardar y salir sin perder la respuesta seleccionada, motivo visible del Continuar deshabilitado, y el recorrido FASE1 existente en una cuenta de revisión. El catálogo FASE1 se usa como prototipo privado; esto no decide qué catálogo se publica.

### Qué funciona ahora

- Una cuenta listada en `MEMBER_PREVIEW_USER_IDS` entra al diagnóstico desde el login, responde, sale, vuelve en otro navegador donde lo dejó, termina y ve el perfil que calcula el servidor.
- Una cuenta no listada sigue en el panel de acceso anticipado. La API le responde 403 al iniciar o responder, también si manda `X-MK-Client`.
- La cuenta de revisión conserva rol `USER` y su suscripción `TRIAL` sin `trialEnd`. No pasa por rutas de admin (403).
- La web conserva la cookie `mk_refresh` httpOnly y nunca recibe el refresh token en JSON.
- Un cliente `ios` o `android` recibe access y refresh token en el cuerpo, sin cookie, rota el refresh por cuerpo y puede cerrar una sesión o todas.
- Guardar y salir envía la selección válida pendiente antes de salir. Si falla, la selección y la pantalla se quedan, aparece un error y se puede reintentar.
- Continuar deshabilitado explica en texto qué falta.
- La versión privada muestra una nota discreta de que el diagnóstico es un prototipo en evaluación: bienvenida, inicio de cada módulo, panel y perfil.
- `mk_global` y `clarity` se muestran como "Promedio general" y "Claridad", con una línea que dice que todavía no son los índices de Alineación y Profundidad. No cambió ningún cálculo ni histórico.

### Contrato final

`GET /api/v1/auth/me` agrega:

```json
"access": { "canUseMemberProduct": true, "isMemberPreview": true }
```

Lo decide el servidor con el `sub` del JWT verificado. Con acceso anticipado activo, solo las cuentas listadas tienen `canUseMemberProduct`. Con acceso anticipado desactivado, toda cuenta autenticada lo tiene y `isMemberPreview` es `false`. El permiso no toca `Subscription` ni reemplaza reglas comerciales futuras.

`X-MK-Client` solo elige la forma de la respuesta. No autoriza nada.

| Valor | Contrato |
|---|---|
| ausente o `web` | web |
| `ios`, `android` | nativo |
| cualquier otro | 400 |

| Endpoint | Web | Nativo |
|---|---|---|
| `POST /auth/register`, `/auth/login` | `{ accessToken, user }` y cookie `mk_refresh` | `{ accessToken, refreshToken, user }`, sin cookie |
| `POST /auth/refresh` | token del cuerpo, si no la cookie. Responde `{ accessToken }` y renueva la cookie | exige `refreshToken` en el cuerpo, ignora la cookie. Responde `{ accessToken, refreshToken }` |
| `POST /auth/logout` | token del cuerpo o de la cookie; revoca y limpia la cookie | exige `refreshToken` en el cuerpo (400 si falta); no toca cookies |
| `POST /auth/logout-all` (Bearer) | revoca todos los refresh de la cuenta y limpia la cookie | igual, sin cookie. Responde `{ success, revokedSessions }` |

Rotación: el token presentado se consume y el nuevo se crea en una sola transacción. La condición es `revokedAt: null` y sin expirar, con `count === 1`. Dos rotaciones simultáneas del mismo token dejan una sola sesión nueva. Si falla la escritura del reemplazo, el token anterior sigue siendo válido. El access JWT se firma antes de la transacción.

Tokens: refresh aleatorio de 48 bytes, guardado solo como sha256, 30 días (`REFRESH_TOKEN_TTL_DAYS`). Access JWT de 15 minutos (`ACCESS_TOKEN_TTL`). No hay credenciales en logs; al arrancar, la API registra solo cuántas cuentas de revisión hay.

Después de `logout-all`, los access JWT ya emitidos siguen válidos hasta que expiran, como máximo 15 minutos. No hay invalidación inmediata de access tokens.

Diagnóstico: `start`, `state`, `response`, `welcome-seen` y `outro-seen` exigen `JwtAuthGuard` y después `DiagnosticOpenGuard`, que lee el usuario autenticado. `progress` y `profile` siguen siendo lectura de la propia cuenta, sin ese guard.

Integración nativa futura, no implementada: guardar el refresh token en SecureStore de Expo (Keychain en iOS, Keystore en Android), el access token solo en memoria, enviar `X-MK-Client: ios` o `android` en register, login, refresh y logout, y reemplazar el refresh guardado en cada rotación. Esta entrega lo comprobó por HTTP sin cookie jar; no hay app Expo.

### Configuración (por nombre)

- `MEMBER_PREVIEW_USER_IDS`: solo en `apps/api/.env`. Ids de `users.id` separados por coma. Reiniciar la API al cambiarla. Nunca con prefijo `NEXT_PUBLIC_`. Documentada en `.env.example` sin valores.
- `EARLY_ACCESS_MODE`: sin cambios (`true`) en `apps/api/src/product-phase.ts` y `apps/web/lib/product-phase.ts`.

Para designar la cuenta real de Rafa: buscar su id en `/admin/users` (o en `users.id`), agregarlo a `MEMBER_PREVIEW_USER_IDS` del entorno que corresponda y reiniciar la API. No se configuró ninguna cuenta real.

### Archivos cambiados

API:

- `apps/api/src/auth/member-access.ts` (nuevo): `resolveMemberAccess`, `MemberAccessService`.
- `apps/api/src/auth/client-kind.ts` (nuevo): `parseClientKind`, `presentedRefreshToken`.
- `apps/api/src/auth/dto/logout.dto.ts` (nuevo). `dto/refresh.dto.ts`: rechaza token vacío.
- `apps/api/src/auth/auth.controller.ts`, `auth.service.ts`, `auth.module.ts`: contrato web y nativo, rotación atómica, `logout-all`, `access` en `/auth/me`.
- `apps/api/src/diagnostic/diagnostic-open.guard.ts`: acceso por usuario autenticado.
- `apps/api/src/diagnostic/diagnostic.service.ts`, `diagnostic.controller.ts`: correcciones del recorrido (sección siguiente).
- `.env.example`.

Web:

- `apps/web/lib/member-access.ts` (nuevo), `lib/api.ts` (`MeResponse.access`), `lib/auth-redirect.ts`, `lib/use-require-guest.ts`, `app/login/page.tsx`, `app/register/page.tsx`, `app/app/page.tsx`.
- `apps/web/components/diagnostico/DiagnosticAccessGate.tsx` (nuevo), `app/diagnostico/layout.tsx`, `DiagnosticEntry.tsx`, `app/(member)/diagnostico/resultado/page.tsx`.
- `DiagnosticPlayer.tsx` (Guardar y salir, motivo de Continuar), `QuestionCard.tsx` (`continueHint`), `ModuleOutro.tsx` (error visible), `DiagnosticWelcome.tsx`.
- `components/app-shell/ReviewVersionNote.tsx` (nuevo), `InicioDashboard.tsx`, `PerfilContent.tsx`, `RutaContent.tsx`, `CuentaContent.tsx`, `profile/SystemReport.tsx`, `lib/mk-system.ts` (etiquetas), `lib/product-phase.ts` (quité `isFounderAccessPhase`, que quedó sin uso).
- `apps/web/app/globals.css`: motivo de Continuar, foco visible en controles del player y del panel, área táctil de Guardar y salir, nota de revisión.

Pruebas:

- `apps/api/test/member-access.test.ts`, `auth-session-contract.test.ts`, `diagnostic-member-preview.test.ts`.
- `apps/web/test/member-access.test.ts`.
- `e2e/member-preview.spec.ts`.

`apps/web/tsconfig.tsbuildinfo` ya venía modificado antes de esta entrega; quedó igual que estaba.

### Defectos del recorrido encontrados y corregidos

1. **Finalización prematura del diagnóstico.**
   - Causa: `markOutroSeen` hacía dos escrituras separadas (`outroSeen` y abrir el módulo siguiente), y `GET /diagnostic/state` finaliza el diagnóstico si no ve un módulo activo. La pantalla de cierre lee `state` mientras la persona presiona Continuar.
   - Evidencia: reproducido en el navegador. Después de terminar solo el módulo 1, la sesión quedó `completed_at` con un `MasterProfile` de 6 respuestas. Ese perfil parcial es el que se habría servido al final.
   - Corrección: las escrituras van en una transacción, y `buildState` solo finaliza si todos los módulos están COMPLETE con cierre visto; si no, responde 409.
2. **Doble finalización concurrente.** Dos lecturas de `state` al terminar intentaban crear el mismo `MasterProfile`: una fallaba con 500 (P2002) y la pantalla de cierre quedaba sin avanzar. Ahora, si otra petición ya lo creó, se devuelve el perfil existente.
3. **429 silencioso en el cierre de módulo.**
   - Causa: el throttler global `auth` (30 req/min por IP) se aplicaba también al diagnóstico. Una respuesta cuesta varias llamadas. `GET /diagnostic/state` devolvía 429 y el botón Continuar del cierre fallaba sin mensaje.
   - Corrección: `DiagnosticController` se excluye de ese límite, como ya hacían `refresh`, `logout` y `me`. El límite general de 100 req/min por ruta e IP sigue vigente.
   - `ModuleOutro` ahora muestra un error si no puede continuar, en lugar de quedar mudo o en "Cargando…".

Las tres correcciones tienen prueba: `diagnostic-member-preview.test.ts` falló contra el código anterior (P2002 y un `diagnostic_complete` con un módulo bloqueado) y pasa ahora, tres corridas seguidas. No se cambió scoring ni reglas del motor.

Hallazgo sin corregir: la base local tiene la versión `1.0` con 24 preguntas, mientras `fase1.questionnaire.json` tiene 25 (`habitos-acciones`: 5 frente a 6). El bootstrap solo sincroniza textos de una versión existente. Hay que revisarlo antes de activar otro catálogo (ver pendientes).

### Verificación realizada

| Comprobación | Cómo | Resultado |
|---|---|---|
| Tests API | `npm run test -w @mk/api` con `DATABASE_URL` local | 137 pasan, 1 omitido (ya omitido antes). Línea base: 103 y 1 |
| Tests web | `npm run test -w @mk/web` | 259 pasan, 2 omitidos (e2e de Lab, ya omitidos). Línea base: 256 y 2 |
| Typecheck API | `tsc --noEmit` | sin errores |
| Typecheck web | `tsc --noEmit` | 8 errores previos en tests de Lab (`lab-render`, `lab-validation`, `lab-simulate-e2e`); ninguno nuevo |
| Build | `nest build`, `next build` | ambos pasan |
| Contrato HTTP sin cookie jar | script local contra la API en ejecución | 29 de 29 |
| Navegador | `e2e/member-preview.spec.ts`, Chromium, 390 px y 1440 px | 4 de 4, sin reintentos |

Los once casos pedidos:

1. Cuenta designada entra; normal y sin autenticación no: HTTP (201, 403, 401) y navegador.
2. El header no concede acceso ni ADMIN: 403 con `X-MK-Client: ios`; 403 en `/admin/users`; guard con rol ADMIN no listado.
3. Web conserva la cookie httpOnly y el JSON no trae refresh: HTTP y test de contrato.
4. Nativo recibe y rota el refresh; el anterior da 401: HTTP y test.
5. Cuerpo y cookie: rota el del cuerpo; la sesión de la cookie sigue válida.
6. Nativo con solo cookie: 401, nada expuesto, la cookie no se consume.
7. Carrera: 5 rotaciones simultáneas en test y 2 por HTTP; una sola tiene éxito y queda un solo reemplazo activo. También se probó la reversión cuando falla la escritura.
8. Logout nativo y `logout-all` invalidan los refresh; el access previo sigue válido hasta expirar (documentado).
9. Guardar y salir persiste la selección (el servidor pasa de 1 a 2 respuestas); con la red cortada, la selección, la pantalla y el contador se quedan, el servidor sigue en 2 y el reintento llega a 3.
10. Otro navegador, con contexto nuevo, retoma en la pregunta siguiente, y el texto coincide con `/diagnostic/state`. La recarga también retoma.
11. Completar el diagnóstico en la UI: los valores de "Promedio general" y "Claridad" coinciden con `/diagnostic/profile`, y el perfil servido coincide con el guardado (test de API).

Teclado: la opción se elige y Continuar se activa solo con Tab y Enter, con contorno de foco visible (`outline-style: solid`). Movimiento reducido: el recorrido completo se hizo con `reducedMotion: reduce`.

Capturas (no versionadas, en `tmp/entrega0-qa/`): bienvenida, motivo de Continuar, foco de teclado, error de guardado y panel a 390 px; panel de fundador, reanudación en otro navegador, perfil y panel con perfil a 1440 px.

### Guion de prueba local

1. Docker Desktop encendido. `npm run dev:db`, luego `npm run dev:prepare`.
2. Con la API en marcha (`npm run dev:api`), crear dos cuentas locales desde `/register` o `POST /api/v1/auth/register`: una de revisión y una normal, con la contraseña que prefieras.
3. Copiar el `id` de la cuenta de revisión (respuesta del registro o `/admin/users`) en `MEMBER_PREVIEW_USER_IDS` de `apps/api/.env` y reiniciar la API. El log dice "Member preview enabled for 1 account(s)".
4. `npm run dev:web`. Entrar con la cuenta normal: panel de acceso anticipado, y `/diagnostico` vuelve al panel. Entrar con la de revisión: bienvenida, módulo, pregunta.
5. Probar Continuar sin elegir, elegir una opción y usar Guardar y salir, volver desde el panel, recargar, abrir otra ventana privada y seguir, completar y ver el perfil.
6. Navegador automático: exportar `E2E_PREVIEW_EMAIL`, `E2E_NORMAL_EMAIL`, `E2E_PASSWORD` y `DATABASE_URL` local, y correr `npx playwright test e2e/member-preview.spec.ts`. El spec reinicia el diagnóstico de la cuenta de revisión y se niega a correr si la base no es local. Dejar un minuto entre corridas: el límite de 100 req/min por ruta e IP y el doble efecto de `next dev` hacen fallar dos corridas seguidas.

### Límites y lo no verificado

- No hay app Expo. El contrato nativo se comprobó por HTTP.
- Solo Chromium. No se probaron Safari, Firefox, teléfonos reales, lector de pantalla, zoom de texto al 200% ni medición formal de contraste.
- Las sesiones que se hayan finalizado antes por la carrera conservan su perfil parcial. En acceso anticipado no hay cuentas reales con diagnóstico; las de prueba se reinician.
- El throttler `auth` de 30 req/min sigue aplicándose a otras rutas que no lo excluyen (IKIGAI, admin, Lab, billing). Conviene limitarlo a endpoints de credenciales en un ticket aparte.
- Espíritu, Mente y Cuerpo, y los ámbitos, siguen promediándose en el cliente (`computePillarScores`). No se inventaron pesos, pero esa agregación no es una fórmula aprobada.
- La API responde 409 si detecta un módulo bloqueado sin módulo activo. Con la transacción no debería ocurrir; si ocurre, el player muestra "No se pudo cargar el diagnóstico" y se puede reintentar.

### Pendiente y decisiones posteriores (no implementado)

Aclaraciones sobre el informe anterior:

- Calendario y Tareas, Asesores, auditorías posteriores y la Hoja de Ruta de Propósito tienen alcance por definir: ni cancelados ni aceptados como secciones vacías.
- Un párrafo de dirección, un plan 1+1+1 y un sí o no semanal son propuestas de prueba, no decisiones de Rafa.
- Ruta MK mantiene su lenguaje y su escalera de auditorías.
- La interfaz se desarrolla junto con los recorridos reales.
- El módulo IKIGAI público sigue separado: no se conecta a `User` y sus tokens no cambian.

El plan del Excel ("Producto MK desde el Excel original", cadena completa por entregas) queda como propuesta posterior, con estas condiciones:

- Importar el Excel puede ser la dirección de producto elegida, pero eso no aprueba cada corrección de sus reglas.
- Cambiar una alerta de `=2` a `<=2`, escalar bandas al omitir pareja, resolver el hueco de Identidad o elegir entre fórmula y texto cambia resultados. Cada cambio necesita fuente, razón y decisión explícita; no se presenta como errata.
- Las fórmulas truncadas o ambiguas (plan financiero de la HdRP, diagnóstico general de Sombra) requieren recuperar su definición completa. No se implementa una aproximación para después probarla contra la misma suposición.
- Activar un catálogo nuevo debe conservar las sesiones antiguas y una definición inmutable e identificable. Un hash identifica una definición, pero no es por sí solo versionado; la diferencia de 24 y 25 preguntas en la versión `1.0` lo muestra.
- MK-02 necesita diseñar el historial junto para `DiagnosticSession` y `MasterProfile` (hoy ambos 1:1 con el usuario) antes de ofrecer reinicios. Quitar solo el unique de la sesión no garantiza perfiles históricos: hay que conservar el resultado de cada sesión completada y distinguir el vigente sin sobrescribir la historia.
- Llegar a una HdRP completa no implementa ejecución, seguimiento, revisión ni ajustes del plan. El roadmap debe mantener visible esa diferencia.
- Un ejercicio IKIGAI dentro del Excel (E-PER-008) necesita una decisión explícita sobre su función y su relación con el módulo público.
- La validación del recorrido y de la interfaz acompaña cada entrega.
- Expo se prueba pronto contra esta misma API, sin esperar a que existan semanas y revisión.

Siguiente entrega técnica viable, como propuesta: una prueba Expo mínima contra esta API. Login nativo con el refresh en SecureStore, una respuesta, reabrir la app y ver el mismo progreso, y leer el mismo perfil que en la web. MK-03 ya da el contrato y el costo es acotado. En paralelo, el diseño de historial de sesión y perfil (MK-02), que es requisito para activar cualquier catálogo nuevo, incluido el del Excel.

## F0/F1: hilo del propósito en docs y dominio puro

21 oct 2026. Rama de trabajo local `pilot/ikigai-lista`, commit `0e72f69`. Sin commit de esta entrega. No se tocaron migraciones, endpoints, pantallas ni archivos del player sin commitear.

Documentos actualizados: `MK_PLAN_MAESTRO_IMPLEMENTACION.md` (hilo del propósito, D-PURP, T1.7, M1/M3 ampliados) y `MK_ESPECIFICACION_UI_UX.md` (S-01, S-06, S-08, S-10, S-12, S-14, S-15, copy, R-11 a R-13, B-19 a B-21, tabla 11.1).

Dominio nuevo (solo archivos nuevos y `test:domain`):

- `apps/api/src/instrumentos/territory-catalog.ts`, `answer-ledger.ts`
- `apps/api/src/journey/week-count.ts`, `action-schedule.ts`, `review-reading.ts`, `plan-lifecycle.ts`, `purpose-link.ts`, `civil-week.ts`
- `apps/api/src/journey/accompaniment/personalization.ts`
- Pruebas homónimas en `apps/api/test/`

### Línea base T0.1 (21 oct 2026, `0e72f69`)

| Suite | Resultado | Notas |
| --- | --- | --- |
| `npm run test:domain -w @mk/api` | 196 passed (23 files) | Incluye 49 pruebas nuevas del bloque F1 |
| `npm test -w @mk/api` | 345 passed, 26 skipped; fallos previos en auth/diagnostic/ikigai HTTP | No corregidos en esta entrega |
| `npm test -w @mk/web` | 367 passed, 2 skipped; 2 failed en `journey-followup.test.tsx` | Fallos previos, no corregidos |
| `npx tsc --noEmit -p apps/api/tsconfig.json` | Errores previos fuera de F1; sin errores en los módulos F1 tras ajuste de tipos en `answer-ledger.ts` | |

Segunda corrida tras F1: mismos conteos de dominio (196/196 en verde). `execution.ts` no se modificó.

### Refs por ámbito (`formulario-completo@6`, corte sección 8)

Revisión de Rafa: conjuntos disjuntos probados en `territory-catalog.test.ts` para `@2` a `@6`.

| Ámbito | Conteo | Referencias |
| --- | --- | --- |
| Mentalidad | 11 | `E-AUD-001!R6` a `R10`, `R19`, `R20`, `R26`, `R27`, `R29`, `R30` |
| Salud física | 54 | `E-AUD-001!R16` a `R18` más todo `F-RAD-001` (`f-rad-001-s1` a `s7`) |
| Relaciones | 17 | `E-AUD-001!R28`, `R46` a `R49` más todo `F-RAD-002` |
| Finanzas | 19 | `E-AUD-001!R37` a `R40` más todo `F-RAD-003` incluido `f-rad-003-proy` |

Fuera del denominador de cobertura: `e-aud-s6`, `e-per-*`, preguntas con `exceptionOrigin = CONDITION`.
