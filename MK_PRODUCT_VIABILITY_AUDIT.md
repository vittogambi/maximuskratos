# Auditoría de viabilidad de producto: Maximus Kratos

Fecha: 5 de noviembre de 2026. Alcance: inspección del repositorio y ejecución de pruebas de dominio que no tocan bases de datos. No se modificó aplicación, esquema, datos ni configuración.

Esta auditoría contrasta la visión (acompañamiento desde el autoconocimiento hasta un cambio concreto) con el ciclo que el código deja completar hoy. `PRODUCTO_VIABLE.md` describe ese ciclo y no es, por sí solo, evidencia de que una persona lo haya usado.

Leyenda de estado:

| Estado | Significado en este documento |
|---|---|
| Implementado y verificado | El comportamiento está en código y una prueba de dominio o de interfaz se ejecutó en esta auditoría |
| Implementado, no reejecutado | El comportamiento está en código y hay tests en el repo. Esta auditoría no los volvió a correr |
| Implementado, no verificado | Se leyó el código. No hay prueba ejecutada aquí que lo cubra |
| Parcial | Existe una parte. La otra no llega a la pantalla o no cambia una decisión |
| Documentado, no montado | Hay componente, endpoint o texto. Ninguna ruta vigente de miembro lo usa |
| Pendiente de definición | El código eligió una regla y el propio contrato dice que Rafa no la firmó |
| Hipótesis sin evidencia | Afirmación de negocio. No hay usuarios, pagos ni retención observados |
| Fuera de alcance | Decisión deliberada o pieza que el ciclo viable declara ajena |

Hecho, inferencia y recomendación van marcados. Una inferencia no es un resultado de usuario.

## 1. Resumen ejecutivo

Maximus Kratos ya puede llevar a una cuenta desde el registro hasta un plan activo y una revisión semanal, sin exigir diagnóstico ni propósito. El recorrido es Inicio, cuatro ámbitos (Mentalidad, Finanzas, Relaciones y Salud física) y tres fases (Descubre, Diseña y Actúa). Diseñar tiene cinco pasos. Activar crea acciones. La semana registra si se hicieron. El resultado se anota aparte. La revisión propone y no cambia el plan hasta que la persona aplica la decisión, desde un lunes futuro.

Ese ciclo está implementado. En esta auditoría pasaron 139 pruebas de dominio de la API y 11 de interfaz (panel, carga del diseño y arranque de dirección). No se reejecutaron las pruebas HTTP ni el navegador. No hay resultados de uso real.

Eso no es valor comprobado. El sitio describe otro producto: auditoría entre valores y vida, Hoja de Ruta de Propósito, Perfil Maestro, Ruta MK e índice de alineación, en Espíritu, Mente y Cuerpo. La cuenta no ve ese perfil ni ese índice. `/perfil` y el cierre del cuestionario redirigen a Memoria, que no lee el parámetro. El Perfil Maestro se guarda al completar el formulario y no tiene pantalla de miembro.

El diagnóstico persiste respuestas. Solo un subconjunto, en banda baja, reconocido y marcado por la persona, suma peso a unas plantillas. El catálogo general tiene 31 módulos y 239 preguntas. Salud física cuenta 54 referencias de cobertura para como máximo tres lecturas. Sin datos, Diseñar lo dice y abre el catálogo. El plan puede salir igual.

Propósito guarda una frase de la persona, en tres modos, con historial. El IKIGAI del cuestionario se muestra y se cruza a mano. `/ikigai` es otra sesión, sin cuenta. Ninguno elige estrategia ni acción. El vínculo con un plan nace desmarcado.

Las seis formas de trabajo, los pesos (lectura 2, tipo de cambio 1, máximo tres) y el aviso de plan exigente (más de 300 minutos o más de tres acciones) están en código. El contrato dice que Rafa no los firmó. El tope de 1680 minutos sí bloquea. El aviso no.

No hay cobro. `SubscriptionGuard` deja pasar siempre. No hay cliente ni webhook de Mercado Pago. Cualquier cuenta autenticada usa el producto. El seed y `/precios` publican un catálogo cuyos beneficios prometen el Perfil Maestro. Eso no es disposición a pagar.

Tampoco hay medición del ciclo. El admin cuenta cuentas y leads. El correo de reenganche queda apagado en acceso anticipado y apunta al cuestionario, no a la semana.

Veredicto: MVP funcional del ciclo de plan y semana. No es un producto con valor validado ni está listo para pilotar la promesa pública. El camino corto es un piloto chico de «armar un plan y registrarlo una semana», con la promesa alineada y cuatro eventos. Monetizar antes sería cobrar una hipótesis.

## 2. Veredicto actual

**MVP funcional.**

Justificación, en este orden:

1. El recorrido central se puede completar sin diagnóstico y sin propósito. El borrador nace en el paso 1, la activación materializa acciones, la semana guarda registros y la revisión aplica cambios solo hacia adelante. Las reglas de dominio que sostienen ese recorrido pasaron pruebas en esta auditoría.
2. No es un prototipo de pantallas: hay persistencia, validación de servidor, controles de salud, conversación, inversión y deuda, e idempotencia por `commandKey`.
3. No es un MVP listo para pilotaje de la promesa que ve quien llega por el sitio. Esa promesa (perfil, hoja de ruta, índice, transformación) no es el ciclo montado. Un piloto reclutado con ese texto mediría otra cosa.
4. No es un producto con valor validado. No hay retención, resultado útil observado ni pago. Tener precios en base no demuestra demanda.

Condición para subir de veredicto: un grupo pequeño completa un plan específico en la primera sesión, al menos una parte vuelve a registrar la semana siguiente, y el equipo puede mostrar esos hechos con eventos, no con una encuesta de intención.

Lo que esta auditoría no vuelve a certificar: el recorrido en navegador que `DISENA_REDISENO.md` declara hecho el 5 de noviembre de 2026. Ese informe queda como evidencia documental del equipo, no como verificación de este documento.

## 3. Inventario de funcionalidades y evidencia

### 3.1 Autenticación, registro e inicio

| Pieza | Estado | Qué hace el sistema | Evidencia |
|---|---|---|---|
| Registro | Implementado, no reejecutado | Correo y contraseña de al menos 8 caracteres. Crea `User` con rol `USER` y suscripción `TRIAL` con `trialEnd` nulo. `onboardingStep` queda `TERMS_PENDING` por defecto de esquema | `apps/web/app/register/page.tsx`, `apps/api/src/auth/auth.service.ts`, `packages/database/prisma/schema.prisma` (`User.onboardingStep`) |
| Destino tras entrar | Implementado y verificado en test de interfaz | `getPostAuthPath` manda a `/panel`. Admin va a `/admin`. El paso de onboarding no cambia el destino | `apps/web/lib/auth-redirect.ts`, `apps/web/test/member-access.test.ts` (existe; no reejecutado), comportamiento de panel vacío cubierto por `apps/web/test/dashboard-next.test.ts` ejecutado aquí |
| Primer pantallazo | Implementado y verificado en dominio y en la función de tarjeta | Sin planes, la tarjeta es «¿Qué te gustaría mejorar?», primario a `/disenar`, secundario a `/diagnostico?alcance=general`. Cuatro ámbitos sin empezar | `apps/web/lib/dashboard-next.ts`, `apps/api/src/journey/dashboard.ts`, tests `dashboard-next.test.ts` y `dashboard.test.ts` |
| Orientación inicial | No existe como tour | No hay secuencia obligatoria. `TERMS_PENDING` no abre términos. Pasa a otros valores solo cuando hay sesión de diagnóstico | `apps/api/src/diagnostic/diagnostic.service.ts` (cambios de `onboardingStep` al crear o cerrar sesión). No hay pantalla que exija aceptar términos |
| Navegación | Implementado, no verificado en navegador | Escritorio: Inicio, Semana, Diseñar, Planes, Propósito, Memoria, Cuenta. Móvil: Inicio, Semana, Planes y Más | `apps/web/components/app-shell/MemberSideNav.tsx`, `BottomTabBar.tsx` |
| Continuidad de sesión | Implementado, no reejecutado | Access en almacenamiento del navegador. Refresh en cookie `httpOnly`. El access no lleva `expiresIn`. La fila de refresh no caduca por fecha. La cookie se declara en unos 400 días | `apps/api/src/auth/auth.module.ts`, `apps/api/src/auth/auth.constants.ts`, tests `auth-session-contract.test.ts` y `auth-token-lifetime.test.ts` en el repo |
| Estados vacíos | Implementado, verificado solo el de Inicio | Semana sin plan, Planes vacío, Diseñar sin ámbito y Memoria sin planes tienen copia propia. No se recorrieron en navegador | `CalendarScreen.tsx`, `PlansIndex.tsx`, `DesignStudio.tsx`, `MemoryScreen.tsx` |
| `/bienvenido` | Redirección | Reemplaza por `/panel` | `apps/web/app/bienvenido/page.tsx` |
| Pilares Mente, Espíritu, Cuerpo | Fuera del ciclo de miembro | `/mente`, `/cuerpo` y `/espiritu` redirigen a `/panel` | `apps/web/next.config.ts` |

Inferencia: la primera sesión pide elegir entre crear un plan y explorar con preguntas. No explica todavía qué se obtiene al final de la hora. Eso es una decisión de entrada, no un fallo de registro.

### 3.2 Descubre y diagnóstico

| Pieza | Estado | Qué hace | Evidencia |
|---|---|---|---|
| Catálogo activo | Hecho de repositorio | `formulario-completo@6`: 31 módulos, 239 preguntas | Conteo sobre `packages/database/definitions/formulario-completo@6.json` en esta auditoría |
| Player | Implementado, no verificado en navegador | Un paso, guardar, salir, continuar. Excepciones: no sé, no aplica, no quiero responder | `DiagnosticPlayer.tsx`, `POST /diagnostic/response` |
| Persistencia | Implementado, no reejecutado | `Response` más `ResponseRevision` al editar. `answerLedger` lee la revisión más alta y deja null si hay excepción | `diagnostic.service.ts`, `answer-ledger.ts`, test `answer-ledger.test.ts` ejecutado |
| Cobertura por ámbito | Implementado y verificado | Conteo, no puntaje. Estados Sin empezar, En curso, Explorado. Denominadores observados en el test de catálogo: Mentalidad 11, Finanzas 19, Relaciones 17, Salud física 54 | `territory-catalog.ts`, salida de `territory-catalog.test.ts` |
| Índices y Matriz v2 | Fuera del ciclo de miembro | Ningún archivo de `apps/web` importa `@mk/matrix-engine`. El laboratorio admin sí usa el motor | Búsqueda en `apps/web`. Regla de congelamiento de Matriz v2 |
| `ScoreSnapshot` | Parcial, sin valor práctico en el ciclo | Cada respuesta escribe snapshot. Las opciones del formulario completo se siembran con deltas vacíos, así que las dimensiones numéricas no discriminan | `diagnostic.service.ts`, `packages/database/src/formulario-completo.ts` |
| Cierre visible dentro del player | Parcial | Casi todos los módulos siguen sin pantalla de resultado. `e-aud-s6` muestra suma y rótulo de auditoría. Personalidad y sombra muestran etiquetas en el player. Al terminar el general, la ruta `/diagnostico/resultado` va a `/memoria?vista=documentos` | `AuditCloseScreen.tsx`, `next.config.ts`. `MemoryScreen.tsx` no lee `vista` |
| Perfil Maestro | Documentado y persistido, no montado | `completeDiagnostic` crea `MasterProfile`. En formulario completo el arquetipo primario es `sin-clasificar`. `PerfilContent` no está importado por ninguna pantalla | `diagnostic.service.ts`, `schema.prisma` modelo `MasterProfile`, búsqueda de imports de `PerfilContent` |
| Lecturas que pueden orientar un plan | Implementado y verificado en dominio | Escala 1 o 2 abre candidata. 3 no. 4 o 5 no. Excepción no se lee como sí ni como no. La persona tiene que reconocer y marcar «Quiero tenerlo en cuenta» | `engine.ts` `band`, `buildReadings`. Tests `intervention-mentalidad.test.ts`, `plan-design.test.ts` |
| Síntesis en la ficha de ámbito | Implementado, no verificado en navegador | Hasta seis líneas, no un índice. No sustituye a las lecturas del paso 1 | `journey.service.ts`, `TerritoryScreen.tsx` |

Pregunta de producto. El diagnóstico ayuda a decidir el después solo en un corredor estrecho: respuesta en banda baja, lectura no rechazada, casilla marcada, plantilla que esa lectura declara. El resto informa, o ni siquiera se muestra después. No es un mapa de «qué hacer». Es un archivo de respuestas con unas pocas puertas hacia el catálogo.

Hecho concreto de pérdida. R10 de la auditoría («¿Qué historia me cuento…?») entra en la cobertura de Mentalidad y no está entre las escalas del pack `intervencion-mentalidad@0.1`. Contar la pregunta no produce una lectura. Las 128 preguntas de `e-per-*` y las 10 de sentido (`e-aud-s6`) quedan fuera de los 101 ítems de cobertura y no eligen plantilla.

### 3.3 Propósito e IKIGAI

| Pieza | Estado | Qué obtiene la persona | Evidencia |
|---|---|---|---|
| `/proposito` | Implementado, tests de dominio ejecutados, pantalla no reejecutada | Tres modos: claro (`CONFIRMADO_POR_USUARIO`), idea (`PROVISIONAL`), todavía no lo sé (`EXPLORANDO`). Cada guardado crea `PurposeRevision`. Se puede ir a Diseñar sin dirección | `DirectionScreen.tsx`, `member-direction.ts`, tests `member-direction.test.ts`, `direction-exploration.test.ts` |
| Exploración guiada | Implementado y verificado en dominio | No compone una frase. Pone como máximo dos respuestas de la persona lado a lado y pide que ella escriba | `direction-exploration.ts`, `direction-exploration.test.ts` |
| `/proposito/respuestas` | Implementado, no verificado en navegador | Visión, Valores e IKIGAI literales, sin puntaje. Cruce manual de dos actividades de campos distintos | `PurposeAnswersScreen.tsx`, `PurposeIkigaiCross.tsx`, `purpose-evidence.ts` |
| Efecto sobre el plan | Opcional y sin elección de estrategia | En el paso 1 el vínculo nace desmarcado. Si se marca, guarda `purposeRevisionId` y un `linkKind` opcional. `recommendStrategies` no recibe la dirección | `StepChange.tsx`, `plan-design.ts` `recommendStrategies` |
| IKIGAI público `/ikigai` | Implementado como producto aparte | Sesión sin `userId`, acceso por token. Motor `@mk/ikigai-engine` sobre ese borrador | `schema.prisma` `IkigaiSession`, `apps/api/src/ikigai` |
| `IkigaiExperiment` y `IkigaiCross` | Documentado, no montado en el ciclo | El experimento nace del acompañamiento `X-IKIGAI`. `PlansScreen` y `PurposeScreen` solo aparecen en tests | Búsqueda de imports en `apps/web` |
| Hoja de ruta firmada, IAD, contrato HDRP | Fuera del ciclo | El propio `docs/product/PROPOSITO.md` (local, `docs/` está en gitignore) los declara no montados | Ese archivo, sección 1. `RoadmapClose` no está en una ruta de `app/` |

Pregunta de producto. La persona puede salir con una frase propia. No sale con una dirección que el sistema haya convertido en criterio de plan. Completar IKIGAI no cambia la semana.

### 3.4 Diseña

Cinco pasos, un contrato `diseno-plan@1` en `plan_proposals.payload.design`.

| Paso | Qué queda guardado | Estado |
|---|---|---|
| 1. Tu cambio | Título del plan, motivo opcional, tipo de cambio opcional, lecturas marcadas, vínculo opcional con la dirección. El `POST` crea el borrador | Implementado. Reglas de semillas, pesos y tope cubiertas por `plan-design.test.ts` |
| 2. Resultado | Modo resultado o exploración, criterio, evidencia opcional, horizonte. El cliente ofrece 1, 2, 3, 4, 5, 6 y 8 semanas. El servidor acepta hasta 12 | Implementado, no verificado en navegador el desfase 8 contra 12 |
| 3. Estrategia | Plantilla del catálogo o forma propia. Siembra acciones. Si ya se editaron, pregunta conservar, sumar o reemplazar | Implementado y verificado en dominio |
| 4. Acciones | Hasta 6. Frecuencia semanal o una vez en una semana del ciclo. Cuándo en texto, criterio de hecho, mínima, obstáculos, cuidado, confirmación de carga | Implementado y verificado en dominio |
| 5. Activar | Confirmación explícita. Aclaraciones de salud o conversación si hay marcas. Crea `PlanAction` y, si es de una vez, `ActionSchedule` flexible | Implementado. HTTP de activación no reejecutado |

Catálogo vigente en código: Mentalidad 9 (`MEN-A1` a `MEN-F1`, incluido el disparador `MEN-C2`), Finanzas 5, Relaciones 5, Salud 3. Comentario de pack: reglas beta, no revisadas por Rafa (`mentalidad.ts`, `finanzas.ts`, `relaciones.ts`). Salud añade que no es prescripción.

Seis formas, sin peso entre sí. Solo `EXPLORE` entra a las sugerencias, y solo si el modo es exploración:

| Id | Nombre | Siembra |
|---|---|---|
| `HABIT` | Repetir algo cada semana | 1 acción, 3 veces, 15 minutos |
| `STEPS` | Avanzar por pasos | Hasta 3 acciones de una vez |
| `DECISION` | Preparar una decisión | Tres textos fijos |
| `CONVERSATION` | Preparar una conversación | Escribir qué decir. En Relaciones marca `CONFRONTATION` |
| `EXPLORE` | Explorar con pruebas pequeñas | Una prueba y anotar lo aprendido |
| `FREE` | Empezar desde cero | 1 acción vacía, 1 vez, 15 minutos |

Fuente: `WORK_PATTERNS` y `patternSeeds` en `apps/api/src/journey/intervention/plan-design.ts`.

Carga. `designLoad` marca `demanding` si el máximo supera 300 minutos o hay más de 3 acciones. Eso avisa y no entra en `designReadiness`. Más de 1680 minutos en una semana sí impide activar (`LOAD_MAX`). Los minutos de otros planes activos se muestran y no se suman a ese tope.

Compatibilidad. Se puede activar sin lecturas (`entry` `NO_DIRECTION`) y sin dirección. Con lecturas reconocidas que la plantilla declara, `entry` queda `GOAL`. Al activar se vuelve a leer la firma. Si la respuesta cambió, esa lectura deja de orientar.

Pregunta de producto. Quien termina los cinco pasos y activa sale con un plan específico: cambio, resultado o exploración, estrategia, al menos una acción con criterio de hecho y un plazo. Qué tan realista y ligado a lo que quiere es otra cosa. El catálogo trae texto ya escrito. `FREE` y varias semillas nacen vacías y no activan hasta completarlas. La relación con el deseo depende de lo que la persona escribió en los pasos 1 y 2, no de un modelo que cierre esa relación por ella.

Decisiones de alcance que no son defectos: no hay día fijo de la semana por acción. `MEN-C2` sigue siendo disparador y no se convierte en ocasiones semanales. Al reemplazar o renombrar una acción de plantilla se pregunta si el indicador sigue sirviendo y la pregunta de resultado no se cambia.

### 3.5 Actúa y revisión semanal

| Pieza | Estado | Evidencia |
|---|---|---|
| Semana civil lunes a domingo, `America/Santiago` | Implementado | `civil-week.ts` |
| Registro hecho, omitido, no aplica, pendiente | Implementado, no verificado en navegador | `TaskRow.tsx`, `POST /records` |
| Hecho no acredita resultado | Implementado en copia y en modelo | Indicador aparte, `recordIndicator` |
| Porcentaje de ejecución | Implementado y verificado en dominio, con una salvedad frente a `PRODUCTO_VIABLE.md` | `executionFrom` usa hecho / (hecho + no hecho). Lo sin registro no entra en ese cociente. Si hay huecos, `reviewProposal` devuelve `NO_RECORDS` y no `KEEP` | `engine.ts`, `execution-coverage.ts` |
| Avance del indicador | Implementado y verificado en los tests de dominio del pack | No se compara con la respuesta del cuestionario. Un sí o no con una sola medida usable queda `UNKNOWN`, no avance. Hacen falta dos medidas. `PRODUCTO_VIABLE.md` sección 9 todavía dice que el último sí basta | `progressFrom` en `engine.ts` |
| Propuesta KEEP, CHECK, LIGHTER_OK, EXPLORE, NO_RECORDS, COMPATIBILITY | Implementado. La persona puede no seguirla | `reviewProposal`, `followsProposal` |
| Decisiones por acción | Implementado y verificado en dominio | `KEEP`, `REDUCE`, `MODIFY`, `RESCHEDULE`, `SUBSTITUTE`, `RETIRE`, más alta. Efecto el lunes siguiente. La historia no se reescribe | `action-review.ts`, `action-review.test.ts` |
| Varios planes | Implementado | No hay tope por ámbito en `createDesign`. El panel muestra uno representativo. El resto está en `/planes` | `dashboard.ts` `pickRepresentativePlan` |
| Logro y mantenimiento | Implementado, no verificado aquí | Evidencia obligatoria para declarar logro. Una medida semanal no sustituye ese paso | `PRODUCTO_VIABLE.md` sección 11, rutas `/logro` y `/mantener` |
| Recordatorio de volver | Parcial y apagado para el plan | Si `daysAway` es 7 o más y hay titular, la tarjeta de Inicio propone ver la semana. No hay push ni correo de la semana. `ReengagementService` sale de inmediato si `EARLY_ACCESS_MODE` y, cuando corre, empuja a `/diagnostico` | `dashboard-next.ts`, `reengagement.service.ts`, `product-phase.ts` |

Pregunta de producto. La plataforma es más que una lista: separa ejecución y resultado, conserva la historia y obliga a decidir el futuro de cada acción. Si la persona solo marca hecho y no mira el indicador ni aplica la revisión, el uso real colapsa a una lista. Eso no se puede saber sin usuarios. El sistema deja las dos conductas disponibles.

`COMPATIBILITY` existe en el motor. La semana no marca sola una restricción nueva. El código lo dice en el texto de la propia propuesta y en `PRODUCTO_VIABLE.md`.

### 3.6 Administración, seguridad y monetización

| Pieza | Estado | Evidencia |
|---|---|---|
| Admin de cuentas, leads y stats | Implementado | `GET /admin/users`, `GET /admin/leads`, `GET /admin/stats`. Stats: total y últimos 7 días de cuentas y leads. Nada de planes activados ni semanas cerradas | `admin.service.ts` |
| Recorrido de una cuenta y alertas de cuestionario | Implementado para admin | `member-journey.controller.ts`. No es una herramienta de miembro |
| Laboratorio Matriz v2 | Fuera del ciclo de miembro | `apps/web/app/admin/lab`. Congelado como autoridad diagnóstica |
| Controles de contenido | Implementado | `decideAction` en `restrictions.ts`. Inversión y deuda se rechazan siempre. Esfuerzo, dieta, suplemento y medicación exigen un cuadro de salud compatible. Conversación insegura se rechaza. Conversación sin aclarar pide viabilidad. El texto del cuestionario que no es un no claro queda ambiguo y pide aclaración. No reescribe la respuesta original | `plan-gate.ts` `healthFactFromAnswers`, `assertMemberContentTags` |
| IA generativa en el ciclo | No está | Búsqueda en `apps/` sin cliente de modelo. `DISENA_REDISENO.md` sección 2 descarta IA para proponer planes. `llms.txt` es texto público, no un modelo |
| Pagos | Catálogo sin transacción | `BillingController` solo `GET /billing/plans`. `SubscriptionGuard.canActivate` devuelve `true` y no está aplicado como control real de acceso. No hay `mercadopago.client.ts` ni webhook | `subscription.guard.ts`, `billing.service.ts` |
| Precios visibles | Hipótesis comercial escrita en seed | Cuatro plazos, beneficios que incluyen «Perfil Maestro MK: arquetipo, sombra e índices». Semestral lleva `highlightLabel` «Recomendado» y un comentario de seed que lo trata como opción a empujar. `/precios` los muestra y, en acceso anticipado, dice que hoy no hay cobro | `packages/database/prisma/seed.ts`, `precios-content.tsx`, `precios-offer.tsx` |
| Derechos de un pago | No existen | `resolveMemberAccess` pone `canUseMemberProduct: true` para cualquier `userId` autenticado, con o sin early access | `member-access.ts` |
| Privacidad operativa | Parcial | Respuestas de diagnóstico, dirección y planes cuelgan de `userId`. El admin con rol puede abrir el recorrido de otra cuenta y queda registro de acceso (`AdminAccessLog`). IKIGAI público no está ligado a la cuenta: quien tiene el token de esa sesión lee ese borrador | `schema.prisma`, `ikigai-access.guard.ts` |

No se reproducen aquí los montos del seed. Están en el archivo citado. Mostrarlos no es una recomendación de precio ni evidencia de pago.

## 4. Mapa del recorrido real del usuario

```text
/register o /login
        |
        v
     /panel
   tarjeta única + matriz 4 x 3
        |
        +-- Crear un plan --> /disenar --> 5 pasos --> activar --> /semana
        |
        +-- Explorar con preguntas --> /diagnostico (general, 239 ítems)
        |         o Descubre del ámbito (solo módulos con alguna pregunta de ese ámbito)
        |
        +-- Propósito (opcional) --> frase versionada
                  |
                  +-- se puede vincular, desmarcado, en el paso 1

/semana
   marcar ocasión (no es el resultado)
   indicador o comprobación propia
        |
        v
/semana/revision
   propuesta
   decisión por acción
   aplicar --> lunes futuro
```

Continuidad entre sesiones: el refresh vuelve a dejar entrar en `/panel`. El borrador de diseño está en servidor desde el paso 1, así que cerrar el navegador no borra el plan en preparación. La dirección también está en servidor. El access no caduca. Cerrar sesión revoca el refresh. Un JWT ya emitido sigue válido hasta que deje de usarse. Eso está comentado en `auth.constants.ts` y no se reejecutó el test HTTP.

Lo que el mapa no hace, aunque el sitio lo nombre:

- No entrega un Perfil Maestro ni un índice de alineación en Inicio.
- No obliga a cerrar Descubre antes de Diseñar.
- No convierte la dirección en la estrategia.
- No mueve una acción de disparador al calendario semanal.
- No cobra.

## 5. Evaluación de los seis problemas prioritarios

### 5.1 Propósito e IKIGAI

Hecho. Visión, valores, actividades IKIGAI y la frase de dirección se guardan y se pueden volver a leer. La exploración guiada no fabrica el propósito. El cruce IKIGAI exige una valoración de la persona y no cambia `statement`.

Hecho. Esas respuestas no eligen ámbito, plantilla ni acción. La única puerta hacia el plan es copiar texto (cambio deseado o motivo) si la persona pulsa el botón, o marcar un vínculo.

Inferencia. Quien no trae ya una frase termina un formulario largo de propósito sin una decisión de la semana. Quien sí la trae obtiene un recordatorio versionado, útil como contexto, débil como producto si se vende como «hoja de ruta que ordena las prioridades».

Redundancia real. Los cuatro campos existen tres veces con contratos distintos: módulo `e-per-ikigai` del cuestionario, cruce en `/proposito/respuestas`, y sesión anónima de `/ikigai`. No comparten usuario ni escriben el mismo plan.

Relación que el código ya permite, y que no conviene convertir en requisito: la dirección puede citarse en el plan. No debe bloquear Diseñar. `plan-gate.ts` marca `writerBlock` como legado y no lo llama el servicio de diseño.

Pendiente de Rafa, no de un módulo nuevo: si una dirección confirmada debe pesar en las sugerencias, y si el par de la exploración y la plantilla de frase IKIGAI son admisibles. La lista está en `docs/product/PROPOSITO.md` sección 9. Este documento no las da por resueltas.

### 5.2 Personalización de planes

Hecho. `recommendStrategies` suma 2 si una lectura reconocida y elegida declara la plantilla, y 1 si el tipo de cambio del paso 1 coincide con la meta de la plantilla. Ordena por ese puntaje y luego por el orden del catálogo. Corta en tres. No usa gravedad. Un uso anterior se menciona y no cambia el orden. Sin puntos, `basis: NONE` y el texto «Con lo que tenemos hasta ahora, no hay una estrategia que destaque. Puedes explorar el catálogo o crear la tuya.»

Hecho. Las seis formas están implementadas como semillas editables. No tienen pesos. No salen recomendadas por las respuestas, salvo `EXPLORE` cuando el modo del paso 2 es exploración.

Hecho. No hay recomendaciones opacas. Cada motivo nombra el dato. Tampoco hay personalización fina: dos personas con la misma lectura marcada y el mismo tipo de cambio ven el mismo orden. El texto de la acción de catálogo es de plantilla, rellenado con el cambio y el criterio que la persona escribió.

Quién valida. Rafa, antes de tratar el orden como método. Hasta entonces el pilotaje puede usar el catálogo completo y tratar las tres sugerencias como hipótesis de interfaz, no como prescripción. Desarrollo no puede «cerrar» esos pesos por su cuenta.

`PRODUCTO_VIABLE.md` todavía dice, en el caso sin datos, «todavía no hay datos para recomendar una estrategia». El código dice la frase citada arriba. La diferencia es de copy, no de comportamiento: en ambos casos el catálogo queda abierto.

### 5.3 Del diagnóstico a la acción

Cadena real, ejemplo R26 en 2. La pregunta es «¿Planifico mi semana o, en su mayoría, solo reacciono a ella?».

1. `submitResponse` guarda el valor y sube `revision`.
2. `answerLedger` expone `value: "2"` si no hay excepción.
3. El pack declara la escala R26. `band(2)` es `CANDIDATE`.
4. La lectura `planificacion` declara `MEN-A1` y `MEN-A2`, cita «marcaste 2 de 5» y firma fuente, catálogo y revisión.
5. En el paso 1 la persona responde si le representa y, solo entonces, puede marcarla para este plan.
6. `recommendStrategies` suma 2 a esas dos plantillas. El motivo visible incluye la interpretación de la lectura.
7. Elegir la plantilla siembra la acción. Activar es otro paso. Si antes cambió el 2, la firma caduca y la lectura deja de orientar.

Qué se pierde. El 3, el 4 y el 5 de cualquier escala. El «no» de una dificultad. Las excepciones. R10 y el resto de ítems que están en cobertura y no en un pack. Personalidad, sombra, arquetipo elegido, puntajes de hoja, casi todo el texto libre. La radiografía de salud salvo la indicación que dispara una aclaración, no una plantilla. Inversión y el orden de deudas, a propósito: no hay plan que diga en qué invertir ni qué deuda pagar primero.

Qué entiende la persona. Si marcó la lectura, la sugerencia dice que parte de esa lectura. Si no marcó nada, el sistema no inventa un porqué. No hay una pantalla que recorra «tu respuesta X produjo la acción Y» después de activar, más allá de las lecturas guardadas en la propuesta.

No se propone cambiar índices. El hueco es de uso, no de fórmula: la mayor parte del esfuerzo de responder no tiene consecuencia en el plan.

### 5.4 Flexibilidad de acciones

Antes de activar, en preparación, la persona puede agregar, quitar, reordenar y editar título, criterio, cuándo, frecuencia, duración, mínima y marcas. Cambiar el cambio o el resultado después de editar acciones obliga a confirmar que siguen sirviendo (`STALE`). Cambiar de estrategia con acciones ya tocadas pide conservar, sumar o reemplazar. No se puede activar con título corto, sin criterio de hecho, sin cuidado y sin «esto cabe en mi semana».

Después de activar, Diseñar no reescribe el plan. La ficha manda a la revisión. Ahí puede mantener, aligerar (no subir cifras), cambiar, reprogramar una de una vez, reemplazar o retirar con motivo, y agregar hasta seis acciones con ocasiones futuras. El resultado buscado se edita desde la ficha como versión nueva del contrato. Ajustar acciones no lo cambia.

Reglas deliberadas, no pendientes de «arreglar»:

- El día de la semana lo elige la persona al marcar. No hay lunes fijo.
- Un disparador de plantilla no acepta veces por semana.
- La sucesora de una acción de plantilla hereda origen y familia. La pregunta del indicador no se sustituye sola.

Qué falta que Rafa valide, ya listado en `DISENA_REDISENO.md` sección 12: semillas de las seis formas, pesos, textos de motivo, umbral de 300 minutos o 3 acciones, si la propuesta puede desobedecerse, si se puede ajustar antes de la fecha de revisión, y si al reemplazar basta con preguntar por el indicador sin cambiarlo. El tope de 6 acciones y de 1680 minutos está clasificado ahí como límite técnico revisable, no como método.

### 5.5 Exigencia y viabilidad

Hecho. La carga es la suma, semana a semana, de veces por minutos. Una acción de una vez solo pesa en su semana. Un disparador pesa todas las semanas. El aviso de plan exigente es no bloqueante. El tope de 28 horas bloquea esa semana del plan, no el conjunto de planes de la cuenta.

Orientación. El paso 4 lo dice. La persona confirma que cabe. En salud y en conversación, el paso 5 pide una aclaración y el servidor puede rechazar. En finanzas, marcar inversión o deuda impide activar esa acción, con alternativas de ordenar información, no de recomendar un producto.

Pendiente metodológico. Si 300 minutos y 3 acciones son el corte correcto. Si el aviso debería mirar también los otros planes activos. Si un disparador debe contar minutos todas las semanas. Esas tres no están firmadas. El bloqueo de 1680 es una guarda técnica para impedir una semana imposible, no una tesis de conducta.

Inferencia. Un plan de catálogo típico (una acción, 20 o 25 minutos) no dispara el aviso. El aviso importa cuando la persona suma varias acciones o elige formas que siembran tres pasos. Sin sesiones no se sabe si la gente lo lee o lo confirma por inercia.

### 5.6 Experiencia completa en cuatro escenarios

Los cuatro caminos existen en código. `DISENA_REDISENO.md` sección 13 dice que se recorrieron en navegador el 5 de noviembre de 2026 con capturas en `tmp/disena-ui/shots/`. Esta auditoría no abrió esas capturas ni repitió el recorrido. La columna de comportamiento de pantalla queda, en esa parte, no reejecutada.

**Sin diagnóstico y sin propósito.** Camino: `/panel` → Crear un plan → cinco pasos → catálogo abierto porque no hay datos → activar → semana. Valor posible: un plan escrito por la persona o tomado de una plantilla, con criterio de hecho. Fricción baja si elige una plantilla y no se pierde en el catálogo. Estado vacío de lecturas y de dirección: el paso 1 no muestra esos bloques. Dependencia innecesaria: ninguna para activar. Riesgo de abandono: no saber qué plantilla elegir cuando el sistema dice que ninguna destaca. No verificado: si esa frase se entiende como honestidad o como «esto no sirve».

**Con diagnóstico y sin propósito.** Camino: el anterior, más lecturas en el paso 1 si alguna fuente está en banda. Valor añadido solo si reconoce y marca. Si respondió mucho y nada quedó en 1 o 2, el paso 3 se parece al caso vacío. Fricción: el costo ya pagado en preguntas. Riesgo: esperar un perfil o una prescripción y encontrar una casilla. No verificado en una sesión real cuántas lecturas aparecen con un cuestionario de territorio completo.

**Sin diagnóstico y con propósito.** Camino: guardar una frase y, si quiere, vincularla. El paso 3 no se reordena por esa frase. Valor: el plan puede decir a qué dirección se engancha (`DIRECT`, `ENABLING`, `PROTECTIVE`, `EXPLORATORY`). Fricción: escribir la dirección y después reescribir el cambio de pocas semanas. El código avisa que hay que bajar la aspiración al ciclo. Riesgo: creer que la frase ya es el plan. No verificado: si el tipo de vínculo se entiende.

**Con diagnóstico y con propósito.** Es la suma de los dos. No hay una tercera síntesis que cruce lecturas y dirección en una sola recomendación. El valor máximo del sistema actual es una plantilla justificada por una lectura marcada, más un vínculo opcional que la persona entiende. La fricción máxima es hacer el cuestionario general, el cruce IKIGAI y los cinco pasos antes de la primera acción. Ese recorrido no es obligatorio. El sitio y la curiosidad por «el diagnóstico» pueden volverlo el camino por defecto. Riesgo de abandono alto en esa combinación. No verificado con tiempos reales.

## 6. Auditoría de propuesta de valor y viabilidad comercial

### 6.1 Problema y cliente

Hecho, desde el copy y el cuestionario, no desde clientes. El sitio se define como desarrollo personal para hombres y promete convertir un propósito en una ruta ejecutable (`LANDING_HERO` en `apps/web/lib/landing-copy.ts`). R6 pregunta por «el hombre que digo que quiero llegar a ser». Los cuatro ámbitos cubren conducta, dinero, vínculos y cuerpo, con límites explícitos para no prescribir deuda, inversión, dieta ni ruptura.

Inferencia. El problema que el ciclo sí ataca es más chico: elegir un cambio de pocas semanas, bajarlo a acciones con criterio de hecho y mirar la semana siguiente si ocurrió el resultado. El problema que el sitio enuncia es más grande: verse, alinear un propósito trascendental y medir coherencia con un índice.

No se puede saber, mirando el código, a quién le duele eso hoy, qué usa en su lugar (notas, coach, terapia, una app de hábitos, una hoja de cálculo) ni por qué dejaría esa alternativa. Eso es investigación, no un hallazgo de repo.

El diferencial que el código sostiene, si se dice con precisión: un plan que cita la respuesta que la persona aceptó como suya, separa «lo hice» de «pasó el resultado», y no reescribe la semana ya vivida. El diferencial que el código no sostiene: un perfil maestro, un índice de alineación y una hoja de ruta que decida por la persona.

### 6.2 Propuesta de valor

Primera sesión, si entra a Diseñar y no al cuestionario general. Puede terminar con un plan activo y la frase de qué hará esta semana. Eso es un resultado útil posible. No está garantizado: puede irse en el catálogo, en propósito o en las 239 preguntas.

Después de una semana. Puede ver qué ocasiones registró y, si el plan es de catálogo, responder el indicador. Con un solo dato de resultado, varios tipos quedan en desconocido y la propuesta no habla de avance. La segunda semana es donde el indicador numérico o de sí o no empieza a poder compararse.

Por qué volver la tercera y la cuarta. Motivos que el sistema ofrece, no motivos observados: la semana sigue pidiendo registros, la fecha de revisión pregunta si el resultado importa, y la decisión cambia la semana siguiente. No hay mensaje que traiga de vuelta a quien no abre la app. El retorno a los 7 días solo aparece si vuelve sola y hay un titular.

Qué justificaría recomendarlo. Hecho de producto, todavía no observado: «escribí un cambio, hice la acción, y a la segunda semana supe si el resultado se movió y qué voy a cambiar». Promesas no respaldadas por la experiencia de miembro: Perfil Maestro, índice de alineación, Hoja de Ruta de Propósito como criterio que ordena los planes, y «mide coherencia» en el paso 4 del sitio (`LANDING_HOW_IT_WORKS`).

### 6.3 Activación

Esfuerzo mínimo hasta el primer plan: cuenta, ámbito, cinco pasos, confirmación. Sin cuestionario eso puede ser una sesión. Esfuerzo máximo si sigue la historia del sitio: diagnóstico general, propósito, cruce, y después el plan. El general son 239 preguntas antes de cualquier acción.

El diagnóstico de Salud, incluso acotado al ámbito, pide del orden de 54 ítems de cobertura para tres lecturas posibles. Eso es fricción excesiva si la persona entró a «descubrirse» esperando que esas respuestas elijan el plan.

Aha moment que el ciclo puede producir, como hipótesis de diseño y no como hallazgo de usuarios: ver la ficha del plan activo con una acción que ella reconoce como suya y un criterio de hecho que no es «marcar la casilla». Cómo medirlo: tiempo desde el registro hasta `activatedAt`, y si en esa sesión existe al menos una acción con título y `doneWhen` no vacíos. Esos eventos no se emiten hoy a ningún sistema de medición.

### 6.4 Retención

Motivo real implementado para volver: la semana abierta no trata lo no marcado como fallo, y al cerrarse lo vacío pasa a sin información. Hay una razón de producto para registrar antes de que la semana se cierre. No hay una razón implementada que avise fuera del producto.

La revisión produce una propuesta y una decisión por acción. Es útil en el modelo. No está demostrado que una persona la entienda ni que cambie su semana por ella.

Evolución observable dentro de la cuenta: historial de dirección, serie del indicador en la ficha, semanas cerradas, acciones terminadas con motivo. No hay un gráfico de «cómo voy» en Inicio. El porcentaje de la matriz es ejecución, y solo cuando no hay huecos.

Ciclo sostenible, como diseño: plan corto, registro, revisión, ajuste, otro ciclo. Como hábito soportado por el producto: incompleto, porque el recordatorio de plan no existe y el de diagnóstico está apagado.

Eventos que permitirían comprobarlo y hoy no están: plan activado, primera ocasión registrada, indicador guardado, revisión aplicada, días entre activación y segundo registro, plan cerrado con motivo. Existen filas (`PersonalPlan`, `ActionRecord`, `PlanEvidence`, `WeekReview`) con las que un análisis manual podría reconstruir una cohorte. No hay tablero ni definición de cohorte. `GET /admin/stats` no sirve para esto.

### 6.5 Monetización

Hay funcionalidad de catálogo y de estado de suscripción. No hay funcionalidad de pago. Un usuario «de pago» y uno gratuito reciben el mismo producto, porque el acceso no mira `Subscription.status`.

Razón clara para pagar, hoy: no está implementada. El seed enuncia beneficios que el miembro no recibe (perfil, arquetipo, índices, ruta). Cobrar por eso sería cobrar una pantalla que no existe.

Problema que sí podría sostener una suscripción, como hipótesis y no como oferta: acompañar varios ciclos de plan y revisión cuando la persona ya vio que el primero le sirvió. Capacidades ya presentes que podrían ser el núcleo de esa hipótesis: más de un plan, historial, revisión que ajusta, memoria. Capacidades ausentes que suelen hacer falta para cobrar en serio, y que no se propone construir ahora: cobro, recibo, y una diferencia honesta entre gratis y pago. Primero hay que ver si el ciclo gratis se usa dos semanas.

Hipótesis que exigen investigación, sin cifra: si el segmento del copy (hombres que quieren convertir un propósito en conducta) paga por seguimiento, o si solo pagaría por un perfil. Intención declarada en una entrevista no cuenta como pago. El comentario del seed que llama al semestral «sweet spot» es una hipótesis de pricing escrita por el equipo, no un resultado.

### 6.6 Confianza

Claridad. Donde el ciclo habla de lecturas, cita la pregunta y el número. Donde no hay datos, lo dice. Eso es más honesto que un índice inventado.

Riesgo de lectura psicológica. El player aún puede mostrar rótulos de auditoría, sombra y personalidad. El cierre del formulario guarda un perfil con arquetipo `sin-clasificar` y totales de instrumento. El miembro no tiene una pantalla de perfil, pero el admin sí ve personalidad en el recorrido, y el sitio sigue prometiendo arquetipo. Quien complete el cuestionario puede haberse encontrado etiquetas dentro del player que el ciclo de planes después ignora. No reejecutado en navegador el texto exacto de esas pantallas.

Salud, relaciones y dinero. Los controles de `restrictions.ts` están. Las notas de las plantillas dicen que no es terapia, dieta, prescripción de ejercicio, consejo de inversión ni orden de pago de deudas. El riesgo que queda es de expectativa: el marketing de «mide coherencia» y «principales bloqueos» suena a diagnóstico clínico o de personalidad. El ciclo operativo no lo es. Conviene que la entrada lo diga antes del pilotaje.

IA. No hay modelo generando planes ni interpretaciones. No hace falta un aviso de IA en el ciclo. Si más adelante se añade, tiene que ser visible. Hoy el riesgo no es opacidad de un modelo. Es opacidad de reglas no firmadas presentadas como sugerencia con número.

Control. La persona confirma la activación, puede rechazar una lectura, puede no seguir la propuesta de revisión y puede desvincular la dirección. El sistema no aplica la revisión solo. Eso está bien y hay que conservarlo.

Privacidad. El contenido es sensible (dinero, cuerpo, vínculos, propósito). El admin puede leer el recorrido. Hace falta, antes de un piloto externo, decir quién lo ve y para qué. No se auditó el texto legal de `/privacidad` contra el flujo real de admin. Queda no verificado ese contraste fino.

Riesgo de prometer transformación. Alto en el sitio. Bajo en el paso 5, que dice que hacer la acción no es el resultado. El pilotaje tiene que hablar con la voz del paso 5, no con la del hero.

## 7. Matriz priorizada de brechas

P0 impide entregar o comprobar el valor central. P1 lo debilita. P2 puede esperar. El valor central, para esta priorización, es: una persona entiende qué va a probar, lo activa y puede aprender de una semana. No es completar el cuestionario.

### H1. La promesa pública no es el ciclo que la cuenta recibe

- Área: marketing, precios, cuenta, confianza.
- Problema: el sitio, las etapas de producto y los beneficios del seed hablan de Perfil Maestro, hoja de ruta, índice y Espíritu, Mente y Cuerpo. La cuenta entra a cuatro ámbitos y a un plan.
- Evidencia: `apps/web/lib/landing-copy.ts` (`LANDING_HERO`, `LANDING_HOW_IT_WORKS`, `SUBPAGE_PRIMARY_CTA`), `apps/web/lib/product-stages.ts`, `packages/database/prisma/seed.ts` `PLAN_BENEFITS`, redirecciones de `/perfil` y `/ruta` en `next.config.ts`.
- Estado: implementado el desajuste. No es un bug de una pantalla.
- Consecuencia: quien entra por el sitio espera un perfil. Quien mide un piloto con ese reclutamiento no mide el ciclo.
- Impacto: activación y confianza. También monetización, si se cobra el texto del seed.
- Tipo: hipótesis comercial ya escrita en interfaz, más riesgo de confianza.
- Prioridad: P0.
- Esfuerzo: bajo en copy, si Rafa confirma cuál es la promesa del piloto. No es un rediseño.
- Siguiente decisión: Rafa, con negocio.
- Próximo paso: una frase de promesa del piloto, y un inventario de pantallas públicas que la contradicen. No publicar otra cosa mientras tanto.

### H2. No se puede comprobar si alguien vuelve

- Área: retención y aprendizaje.
- Problema: no hay eventos del ciclo ni un tablero. Stats de admin son cuentas y leads.
- Evidencia: `admin.service.ts` `stats`. `trackIkigai` solo dispara `mk:ikigai` en la ventana. `reengagement.service.ts` retorna si hay acceso anticipado y el enlace es `/diagnostico`.
- Estado: medición no implementada. Los datos están en tablas, sin pregunta definida.
- Consecuencia: a las dos semanas no se sabrá, sin un conteo manual frágil, si el piloto sirvió.
- Impacto: retención y cualquier decisión de monetizar.
- Tipo: validación técnica y de producto.
- Prioridad: P0 para un piloto. No es P0 para seguir desarrollando en local.
- Esfuerzo: bajo si se limita a cuatro eventos de servidor ya existentes, exportables. Alto si se compra una plataforma de analytics antes de tener la pregunta.
- Siguiente decisión: desarrollo, después de que Rafa fije el piloto. No hace falta una herramienta nueva para la primera cohorte de cinco personas: basta un registro append-only o una consulta acordada.
- Próximo paso: definir los cuatro eventos de la sección 9 y probar que se escriben en un alta de fixture, sin mirar producción.

### H3. El camino largo puede tragarse el primer resultado

- Área: activación.
- Problema: el atajo a un plan existe, pero el cuestionario general tiene 239 preguntas y Salud cuenta 54 referencias de cobertura para tres lecturas. El secundario de la tarjeta vacía abre el general.
- Evidencia: conteo del JSON `@6`. Salida de `territory-catalog.test.ts`. `dashboard-next.ts` acción secundaria `/diagnostico?alcance=general`. `diagnostic-territory.ts`: un módulo entra al ámbito si alguna pregunta suya pertenece a ese ámbito.
- Estado: implementado. Descubre es opcional por decisión. El costo de usarlo no está acotado al subconjunto que orienta planes.
- Consecuencia: alguien que «empieza por el principio» puede irse sin un plan.
- Impacto: activación.
- Tipo: UX y decisión de producto. No es un defecto de la opcionalidad.
- Prioridad: P0 si el piloto recluta con el sitio actual. P1 si el piloto entra directo a «crea un plan» y el cuestionario queda aparte.
- Esfuerzo: bajo para cambiar el énfasis de la tarjeta y del reclutamiento. Alto, y no recomendado ahora, reescribir el catálogo.
- Siguiente decisión: Rafa. ¿El piloto entra por el plan o por el cuestionario?
- Próximo paso: no añadir preguntas. Decidir la puerta del piloto.

### H4. La mayor parte del diagnóstico no cambia el plan

- Área: Descubre → Diseña.
- Problema: la cadena útil es banda baja más reconocimiento más casilla más plantilla. El resto se guarda.
- Evidencia: `recommendStrategies`, packs, `band` en `engine.ts`. R10 en cobertura y ausente de `SCALES` en `mentalidad.ts`. `PerfilContent` sin imports. Tests de dominio ejecutados.
- Estado: parcial a propósito. No es un índice roto.
- Consecuencia: esfuerzo alto, consecuencia baja. Sensación de que «el sistema ya me conoce» cuando no usa esas respuestas.
- Impacto: valor percibido de Descubre. No impide el plan.
- Tipo: decisión metodológica y de comunicación. No proponer módulos ni nuevos índices.
- Prioridad: P1.
- Esfuerzo: bajo para decir, en la entrada de Descubre, qué respuestas pueden aparecer después en Diseñar y cuáles quedan solo guardadas. Medio si Rafa quiere acotar qué se pide en un ámbito sin tocar el instrumento.
- Siguiente decisión: Rafa.
- Próximo paso: una lista, por ámbito, de «esto puede abrir una lectura» y «esto se guarda y no elige plan». Mostrarla o no es decisión de él. No cambiar scoring.

### H5. Propósito e IKIGAI no se convierten en una decisión de plan

- Área: Propósito.
- Problema: hay formularios y una frase. No hay consecuencia sobre la estrategia salvo un vínculo voluntario.
- Evidencia: `DirectionScreen`, `recommendStrategies` sin dirección, `PurposeIkigaiCross`, `IkigaiSession` sin `userId`, `PurposeScreen` solo en tests.
- Estado: implementado como opcional. La hoja de ruta completa está fuera de alcance a propósito.
- Consecuencia: quien busca «mi propósito» puede completar pantallas y seguir sin saber qué hacer el lunes.
- Impacto: valor de esa sección. Riesgo de abandono si se presenta como fase obligatoria. Hoy no lo es.
- Tipo: decisión metodológica.
- Prioridad: P1.
- Esfuerzo: nulo para dejarlo opcional, que es lo correcto mientras no haya firma. Alto si se pretende que el propósito genere planes.
- Siguiente decisión: Rafa.
- Próximo paso: no unir `/ikigai` a la cuenta en este ciclo. Confirmar que el piloto no exige propósito.

### H6. Sugerencias, formas y exigencia sin firma metodológica

- Área: Diseña.
- Problema: el orden de las tres sugerencias y el aviso de plan exigente parecen criterio de producto. El contrato dice que no están aprobados.
- Evidencia: `plan-design.ts` constantes `DEMANDING_WEEKLY_MINUTES`, `MAX_WEEKLY_MINUTES`, `recommendStrategies`. `DISENA_REDISENO.md` sección 12. Comentarios de versión en los packs.
- Estado: pendiente de definición, ya implementado como sugerencia no bloqueante (excepto 1680 y los controles de seguridad).
- Consecuencia: un piloto que «confirma el método» estaría confirmando reglas provisionales.
- Impacto: valor y confianza del piloto. No impide usar el catálogo.
- Tipo: decisión metodológica.
- Prioridad: P1.
- Esfuerzo: bajo para rotular en la interfaz que es una sugerencia provisional, si Rafa lo pide. Cero si el piloto usa el catálogo sin destacar tres.
- Siguiente decisión: Rafa.
- Próximo paso: las preguntas 2, 3 y 4 de la sección 8. No ajustar números «para que se vea mejor».

### H7. La revisión puede quedar en propuesta no usada

- Área: Actúa.
- Problema: el mecanismo de aprendizaje está en la revisión, no en marcar hecho. No hay señal externa para volver, y con una sola medida muchos indicadores no declaran avance.
- Evidencia: `progressFrom`, `reviewProposal`, `dashboard-next.ts` línea del retorno a 7 días, `reengagement.service.ts`.
- Estado: implementado el mecanismo. No verificado que alguien lo use. El correo de plan no existe.
- Consecuencia: la segunda semana depende de la memoria de la persona.
- Impacto: retención.
- Tipo: validación con usuarios, más un hueco de aviso.
- Prioridad: P1.
- Esfuerzo: el aviso (correo o no) es medio y no debe construirse antes de ver si quienes vuelven solos entienden la revisión. Observar es bajo.
- Siguiente decisión: usuarios de prueba, luego Rafa si hay que avisar.
- Próximo paso: en el piloto, no recordar por fuera la primera semana. Medir si vuelven. Si nadie vuelve, el aviso pasa a ser hipótesis, no un feature por defecto.

### H8. El catálogo de precios cobra una promesa que el miembro no tiene

- Área: monetización.
- Problema: beneficios de perfil, arquetipo e índices. Guard de suscripción inerte. Sin Mercado Pago.
- Evidencia: `seed.ts`, `subscription.guard.ts`, `member-access.ts`, `billing.controller.ts`.
- Estado: hipótesis comercial sin evidencia. El catálogo sí está implementado como lectura.
- Consecuencia: riesgo de vender algo distinto de lo que se entrega, el día que se encienda el cobro.
- Impacto: monetización y confianza. Cero impacto en el valor de esta semana, porque no se cobra.
- Tipo: hipótesis comercial.
- Prioridad: P1 como riesgo latente. No es el trabajo de las próximas dos semanas.
- Esfuerzo: bajo para no mostrar beneficios que el ciclo no cumple, cuando Rafa lo decida. Alto para un cobro de verdad, y fuera de lugar ahora.
- Siguiente decisión: negocio y Rafa.
- Próximo paso: no integrar Mercado Pago hasta tener el criterio de la sección 10.

### H9. Deriva entre el documento del ciclo y el motor de revisión

- Área: Actúa, operación interna.
- Problema: `PRODUCTO_VIABLE.md` sección 9 dice que el denominador del porcentaje incluye lo sin registro y que un sí final cuenta como avance aunque sea la única respuesta. El código separa cobertura y cumplimiento, y un sí o no con una sola medida queda `UNKNOWN`.
- Evidencia: `executionFrom`, `executionStats`, `progressFrom`, `reviewProposal` en `engine.ts`. Tests de dominio del pack pasaron con ese código.
- Estado: el código es el comportamiento. El documento quedó atrás.
- Consecuencia: quien opere el piloto con el markdown puede explicar mal un `NO_RECORDS` o un «todavía no se ve avance».
- Impacto: confianza del equipo y de la explicación al usuario. No cambia el motor.
- Tipo: validación técnica y de copy interno.
- Prioridad: P2. No es urgente para el usuario. Sí antes de interpretar un piloto.
- Esfuerzo: bajo. Actualizar el documento, no el motor, salvo que Rafa quiera el otro criterio.
- Siguiente decisión: Rafa solo si el criterio de «un solo sí es avance» debe volver. Si no, desarrollo corrige el documento.
- Próximo paso: no parchear `progressFrom` en silencio.

### H10. Sesión larga y etiqueta de fundador para cualquier cuenta

- Área: confianza y acceso.
- Problema: el access no expira. `TERMS_PENDING` no pide términos. Toda cuenta no admin se llama «Miembro Fundador» en Cuenta.
- Evidencia: `auth.module.ts`, `auth.constants.ts`, `CuentaContent.tsx`, esquema `onboardingStep`.
- Estado: implementado.
- Consecuencia: expectativa de estatus y una sesión que no caduca aunque se rote el refresh. El JWT ya emitido sigue. Los tests de auth del repo lo afirman. No se reejecutaron aquí.
- Impacto: confianza. Bajo para el primer piloto de cinco personas conocidas. Sube si hay cuentas externas.
- Tipo: validación técnica.
- Prioridad: P2.
- Esfuerzo: medio para expirar el access y alinear el texto de Swagger, que según el test de contrato dice 15 minutos y el código no lo hace.
- Siguiente decisión: desarrollo puede proponer el arreglo de expiración sin Rafa. El nombre «fundador» es de negocio.
- Próximo paso: no bloquear el piloto interno por esto. No ignorarlo si el piloto sale del círculo.

### H11. Motores y pantallas que ya no están en el recorrido

- Área: mantenimiento.
- Problema: `PlansScreen`, `PurposeScreen`, `IkigaiCross`, `PerfilContent`, acompañamiento y `home-board` siguen en el repo. Parte tiene tests. No están montados en `app/`.
- Evidencia: búsqueda de imports. `PRODUCTO_VIABLE.md` sección 22.
- Estado: documentado, no montado, o legado.
- Consecuencia: un cambio futuro puede «arreglar» el camino viejo creyendo que es el vigente. No le pasa hoy a la persona.
- Impacto: ninguno directo en activación.
- Tipo: deuda. No es un bug de usuario.
- Prioridad: P2.
- Esfuerzo: medio para retirar o aislar. No es el camino corto al valor.
- Siguiente decisión: desarrollo, cuando no haya un piloto en curso.
- Próximo paso: no borrar en esta etapa. No construir encima.

### H12. Dos enlaces de la interfaz no llevan a lo que prometen

- Área: UX menor.
- Problema: la matriz enlaza excepciones con `?excepciones=1` y la ficha de ámbito no lee el parámetro. Cuenta y el fin del diagnóstico mandan a `vista=documentos` y Memoria no lee `vista`.
- Evidencia: `next.config.ts`, `MemoryScreen.tsx` sin `vista`. El parámetro de excepciones lo reportó la lectura de `JourneyMatrix` y `TerritoryScreen`. No se reabrió el click en navegador.
- Estado: implementado el enlace, no el destino.
- Consecuencia: quien busca sus excepciones o «el resultado» cae en una memoria de planes, vacía si todavía no hay.
- Impacto: confianza puntual después del cuestionario. No impide diseñar.
- Tipo: bug de navegación.
- Prioridad: P2.
- Esfuerzo: bajo.
- Siguiente decisión: desarrollo, sin Rafa, siempre que no se invente una pantalla de resultados.
- Próximo paso: o se quita el enlace, o el destino muestra las excepciones y se dice que no hay un informe de perfil. Verificar en navegador si se toca.

Nada de lo anterior pide un módulo nuevo. H1, H3 y H5 se resuelven diciendo la verdad del ciclo y no empujando el camino largo. H2 se resuelve midiendo. H6 se resuelve con una firma o con un rótulo de provisional.

## 8. Preguntas que debemos resolver con Rafa

Estas no las puede cerrar desarrollo sin cambiar el significado del producto. Los bugs H10 (expiración) y H12 (enlaces rotos) no están en esta lista.

### 1. ¿Cuál es la promesa del próximo piloto?

Decisión: una frase que diga qué obtiene la persona, y qué no.

Por qué importa: el sitio y el ciclo cuentan historias distintas. Sin esto, el reclutamiento invalida el aprendizaje.

Qué hace hoy: el ciclo entrega un plan y una revisión. El sitio entrega la expectativa de perfil, hoja de ruta e índice.

Opciones: (a) pilotar solo «un cambio de pocas semanas, con registro y revisión», y bajar el copy público a eso. (b) Seguir prometiendo perfil e índice, y entonces el ciclo actual no alcanza. (c) Dejar el sitio como está y reclutar por fuera, sin usar el hero.

Consecuencia de (b): meses de producto que esta auditoría no recomienda, porque reconstruye una promesa que el ciclo viable ya apartó. Consecuencia de (a) y (c): se puede aprender en semanas.

Hipótesis: (a) es el camino corto. Es hipótesis.

Desarrollo que depende: copy de entrada, tarjeta de Inicio y criterios de reclutamiento. No depende el motor de planes.

### 2. ¿El piloto entra por el plan o por el cuestionario?

Decisión: puerta única del piloto.

Por qué importa: 239 preguntas, o 54 en Salud, pueden impedir llegar al plan.

Qué hace hoy: las dos puertas existen. La tarjeta vacía ofrece primero el plan y después el cuestionario general.

Opciones: plan primero, cuestionario de ámbito primero, o general primero.

Hipótesis: plan primero, con Descubre disponible y no asignado como tarea. Si alguien quiere responder, que sea después de tener una acción, o solo las preguntas que abren lectura. Eso último ya es otra decisión (pregunta 5).

Desarrollo: ningún flujo nuevo si se elige plan primero. Solo la consigna del piloto.

### 3. ¿Las seis formas y sus semillas se pueden mostrar en un piloto?

Decisión: usarlas como están, esconder la estrategia propia, o cambiar semillas.

Por qué importa: tiempos y textos de `HABIT`, `STEPS`, `DECISION`, `CONVERSATION`, `EXPLORE` y `FREE` orientan lo que la persona escribe.

Qué hace hoy: están en `WORK_PATTERNS` y `patternSeeds`. El documento las marca como no firmadas.

Opciones: aceptarlas como andamio provisional del piloto, o dejar solo el catálogo y `FREE`.

Hipótesis: aceptarlas como andamio, dicho en voz alta al participante, y no tratar el resultado del piloto como validación del método.

Desarrollo: ninguno si se aceptan en provisional. Ocultar formas sería un cambio chico, solo si Rafa lo pide.

### 4. ¿Los pesos 2 y 1, y el máximo de tres, se muestran como sugerencia?

Decisión: dejar el orden, quitar el destaque de tres, o no usar lecturas para ordenar hasta firmar.

Por qué importa: es la única personalización automática del catálogo.

Qué hace hoy: `recommendStrategies`, con motivo visible. Sin datos, no destaca ninguna.

Opciones: (a) dejarlo y rotular «sugerencia provisional». (b) No destacar tres y mostrar el catálogo parejo, aunque haya lecturas. (c) Firmar los pesos para el piloto.

Hipótesis: (a), no (c). Firmar sin haber visto a nadie usar las sugerencias adelanta el método.

Desarrollo: un rótulo es bajo. Quitar el corte de tres es bajo. No cambiar los números por iniciativa técnica.

### 5. ¿Qué debe prometer Descubre, sin tocar índices?

Decisión: silencio, mapa de «qué de esto puede usarse», o acotar lo que se pide en un ámbito.

Por qué importa: si no se dice, la persona infiere que todo lo respondido dirige el plan.

Qué hace hoy: guarda todo. Usa un subconjunto, y solo con reconocimiento.

Opciones: explicar en la entrada. O pedir en el piloto solo las escalas que el pack sabe leer, dejando el resto del instrumento intacto para otro momento. O no cambiar nada y aceptar la decepción.

Hipótesis: explicar, y no recortar el instrumento todavía. Recortar es una decisión de instrumento, aunque no cambie fórmulas, y no debería colarse en un piloto de planes.

Desarrollo: copy de entrada de Descubre, después de la frase que Rafa apruebe. Cero cambios en `band`, cobertura o Matriz.

### 6. ¿La dirección tiene que pesar en el plan?

Decisión: contexto voluntario, o criterio que ordene estrategias.

Por qué importa: hoy se puede vender propósito como fase y no producir una decisión.

Qué hace hoy: frase versionada, vínculo desmarcado, sin efecto en `recommendStrategies`.

Opciones: dejarlo así. Hacer el vínculo obligatorio, lo que cierra un caso que el producto decidió dejar abierto. O sumar peso si hay dirección confirmada, que es método nuevo.

Hipótesis: dejarlo voluntario y no presentarlo como paso previo del piloto.

Desarrollo: ninguno.

### 7. ¿Qué es IKIGAI en el producto de miembros?

Decisión: cruce opcional del cuestionario, herramienta pública aparte, o insumo de planes.

Por qué importa: hay tres IKIGAI. Solo el cruce está al lado de la dirección, y no crea un plan.

Qué hace hoy: lo descrito en la sección 3.3. La plantilla de frase existe y Propósito no ofrece armar una nueva, a la espera de firma.

Opciones: mantener las tres piezas separadas. Apagar el enlace al cruce en el piloto para no sumar formularios. Unir la sesión pública a la cuenta.

Hipótesis: mantenerlas separadas. No unir `/ikigai` a la cuenta. En el piloto, no asignar el cruce.

Desarrollo: ninguno obligatorio.

### 8. ¿Un solo sí en el indicador es avance?

Decisión: el criterio de `progressFrom` (hacen falta dos medidas. Un solo sí es desconocido) o el texto viejo de `PRODUCTO_VIABLE.md` (el último sí basta).

Por qué importa: cambia `KEEP` y `CHECK` en la segunda semana, que es justo cuando el piloto mira si hubo aprendizaje.

Qué hace hoy: el código pide dos medidas. Un no final es sin avance. La percepción no entra.

Opciones: dejar el código y corregir el documento. O volver al «último sí basta», lo que hay que tratar como cambio de método, no como bug.

Hipótesis: dejar el código. Una sola respuesta no alcanza para decir que hubo avance. Es hipótesis de medida, no de conducta.

Desarrollo: corrección documental. El motor no se toca salvo respuesta contraria.

### 9. ¿El aviso de plan exigente se queda como está?

Decisión: más de 300 minutos o más de tres acciones, no bloqueante. ¿Sirve, se mueve, o se apaga en el piloto?

Por qué importa: puede asustar o puede ser la única protección contra un plan que la persona no va a cumplir. El bloqueo de 1680 es otra cosa y puede quedarse como límite técnico.

Qué hace hoy: avisa. No mira la suma de otros planes.

Opciones: dejar el aviso. Apagarlo y observar qué planes arma la gente. Incluir otros planes en la cuenta, lo que cambia la regla.

Hipótesis: dejar el aviso no bloqueante y anotar en el piloto si alguien lo ve y qué decide. No subir el rigor antes de esa observación.

Desarrollo: ninguno hasta la respuesta.

### 10. ¿Quién entra al piloto, y quién no?

Decisión: perfil de cinco a ocho personas.

Por qué importa: el copy dice hombres y desarrollo personal. Eso no está validado como segmento. Un piloto con el equipo o con amigos que ya conocen MK no mide activación.

Qué hace hoy: cualquier correo puede registrarse y usar todo.

Opciones: personas que ya intentan cambiar una conducta concreta en uno de los cuatro ámbitos, y que no necesitan que se les explique el método. Excluir a quien busca terapia, un plan de inversión o una dieta.

Hipótesis: ese filtro, dicho en la invitación, alineado con los controles que el producto ya tiene.

Desarrollo: ninguno. Es reclutamiento.

### 11. ¿Qué tendría que pasar para hablar de pago?

Decisión: criterio de evidencia, no un precio.

Por qué importa: el seed ya tiene plazos y un «recomendado». Es fácil encender el cobro creyendo que el catálogo es un modelo de negocio.

Qué hace hoy: no cobra. Muestra precios de lanzamiento futuro y beneficios que no coinciden con el ciclo.

Opciones: no hablar de precio en el piloto. O, solo después de uso repetido, una prueba de pago real (transferencia, enlace manual, o checkout) con el beneficio que de verdad existe. Una pregunta «¿pagarías?» no es una opción válida como evidencia.

Hipótesis: cero precio en el primer piloto. La pregunta de pago se abre solo si se cumple el hito de la sección 10.

Desarrollo: no hay integración de Mercado Pago en estas ocho semanas, salvo que el hito se cumpla y negocio abra ese proyecto aparte.

### 12. ¿Los controles de salud, conversación y dinero se quedan literales?

Decisión: confirmar que el piloto no afloja `decideAction`.

Por qué importa: son lo que impide que una sugerencia se vuelva prescripción. Están implementados y no dependen de la firma de los pesos.

Qué hace hoy: rechazan inversión y deuda. Piden aclaración si el texto de salud no es un no claro o si hay conversación difícil. Un límite vigente bloquea la acción marcada.

Opciones: dejarlos. O permitir más, lo que esta auditoría no recomienda.

Hipótesis: dejarlos literales. Si una plantilla de Relaciones no trae la marca y la persona escribe una conversación difícil en texto libre, el control no la ve. Eso es un límite conocido, no una invitación a leer el texto con un modelo.

Desarrollo: ninguno si se confirman. Si Rafa quiere que el texto libre dispare la aclaración, es un cambio de seguridad y hay que especificarlo aparte, sin ampliar el catálogo.

## 9. Plan de validación con usuarios

Esto es un diseño de piloto. No hay resultados.

### Hipótesis

1. Una persona que ya quiere cambiar algo concreto en un ámbito puede dejar un plan activo en una sesión, sin responder el cuestionario y sin escribir un propósito.
2. Al terminar esa sesión puede decir, con sus palabras, qué va a hacer y cómo sabrá si el resultado ocurrió. Si solo puede decir «marqué el plan», el resultado no es útil.
3. Una parte vuelve a registrar al menos una ocasión entre el día 7 y el día 14, sin un recordatorio externo.
4. En la revisión, distingue «lo hice» de «pasó lo que quería», y toma una decisión sobre la semana siguiente (mantener, aligerar, cambiar, retirar) que luego se ve en el plan.
5. Descubre y Propósito, si se ofrecen y no se asignan, no hacen falta para ese resultado. Si se meten en la primera sesión por curiosidad, alargan el tiempo hasta el plan.

No se prueba en esta ronda: disposición a pagar, superioridad de los pesos 2 y 1, ni que el cuestionario «ayuda a conocerse».

### Participantes

Cinco a ocho personas. No el equipo que construyó el flujo. Criterio de la pregunta 10, cuando Rafa lo confirme. Una sola conducta que quieran mover en Mentalidad, Finanzas, Relaciones o Salud, compatible con los límites del producto (nada de inversión, dieta prescrita ni conversación que la persona tema).

Si Rafa no ha respondido la pregunta 10, no se recluta con el hero del sitio.

### Tarea de la sesión inicial

Consigna, sin tour:

«Queremos ver si puedes dejar listo un plan para las próximas semanas sobre algo que ya quieras cambiar. Diagnóstico y propósito están en el menú. Úsalos solo si tú los necesitas para armar el plan. Al terminar, deberías poder decir qué vas a hacer y cómo vas a saber si funcionó.»

No indicar la plantilla. No pedir que reconozcan lecturas. No pedir IKIGAI.

Duración máxima observada: 60 minutos. Si a los 45 no hay plan activo, se corta y se anota dónde se detuvo. Eso ya es un resultado.

### Qué observar en la sesión

- Minuto en que existe un plan activo, o el punto de abandono.
- Si abre Descubre o Propósito, y si eso acerca o aleja el plan.
- Si entiende por qué una sugerencia está arriba, cuando la hay.
- Si el aviso de plan exigente aparece y qué hace.
- Si puede repetir el criterio de hecho y el de resultado sin leer en voz alta la pantalla palabra por palabra.
- Dónde duda más de treinta segundos.
- Si busca un perfil, un puntaje o un índice y qué hace al no encontrarlo.

El facilitador no explica el método. Puede desbloquear un error de producto (no carga, no guarda). Eso se anota como fallo, no se disimula.

### Día 7

Sin mensaje de producto, porque el piloto quiere ver el retorno espontáneo. Sí un contacto humano breve, el día 7, que no elogia:

- ¿Abriste la semana desde la sesión? ¿Qué día?
- ¿Registraste alguna ocasión? ¿Qué te detuvo?
- ¿Respondiste la pregunta de resultado? ¿Qué crees que mide, distinta de haber hecho la acción?
- ¿El plan sigue siendo el que harías esta semana?

No preguntar «¿te resultó útil?» como primera pregunta.

### Días 14 a 28

Si llegó la fecha de revisión del plan (muchas plantillas usan 2 a 4 semanas. Quien eligió 8 semanas no llega a esa fecha en esta ventana: anotar el horizonte que eligió).

- ¿Aplicó una decisión o dejó todo en «se mantiene»?
- ¿Puede decir qué aprendió que no supiera el primer día?
- ¿Seguiría con este plan, lo bajaría o lo dejaría? ¿Por qué, en concreto?
- ¿Volvió a abrir Descubre o Propósito después? ¿Para qué?

Abandono: cero registros y cero aperturas. Fricción: abrió y no registró, o registró todo hecho el mismo día de la sesión para «dejarlo listo». Comprensión: no separa ejecución y resultado. Utilidad: describe un cambio de conducta o de decisión que atribuye al plan, con un ejemplo fechado, no un adjetivo.

### Preguntas que no inducen

Usar hechos: «¿Qué hiciste el martes?» «¿Qué esperabas ver y qué viste?» «¿Qué parte saltaste?» «Si no volviste, ¿en qué momento se cayó?»

No usar: «¿sentiste que te ayudó a crecer?», «¿recomendarías MK?», «¿esto vale una suscripción?», «¿el diagnóstico te dio claridad?».

Si se habla de dinero, solo al final de la ventana y solo si hubo uso repetido. Formulación: «Este mes no se cobra. Si dentro de un mes el acceso a este ciclo dejara de estar abierto, ¿qué harías?» Las respuestas son hipótesis. No son demanda.

### Evidencia mínima para una prueba de pago

Todas a la vez, en esta cohorte o en la siguiente, no en una encuesta:

- Al menos cuatro de ocho activan un plan en la primera sesión.
- Al menos tres registran algo en una segunda semana, sin recordatorio del producto.
- Al menos dos aplican una revisión que no sea dejar todas las acciones en mantener por defecto, o explican por qué mantener es la decisión.
- Ninguno describe el valor como «me dio mi perfil» o «me dijo mi puntaje». Si ese es el valor que buscan, la hipótesis de monetizar el ciclo de planes es falsa para ese grupo.
- Después de eso, y no antes, una prueba en la que el pago sea real: el dinero se mueve o la persona rechaza un enlace de pago concreto. Intención verbal no alcanza.

### Qué se puede medir ya y qué no

| Se puede reconstruir a mano, con acceso a la base de un piloto | No se puede medir hoy |
|---|---|
| Que existe `PersonalPlan.activatedAt` | Embudo automático desde el anuncio |
| Que existe `ActionRecord` por día | Apertura de la app sin registro |
| Que existe `PlanEvidence` de indicador | Por qué no volvió, si no se le pregunta |
| Que existe `WeekReview` y `pendingReviews` | Disposición a pagar |
| Conteo de cuentas y leads en admin | Retención de cohorte |
| Eventos `DiagnosticEvent` del cuestionario, no del plan | Si la sugerencia de las tres plantillas se eligió por el motivo |

No inventar un porcentaje de este piloto: no se ha hecho.

## 10. Criterios para alcanzar un MVP viable

### MVP funcional

La persona puede completar el recorrido central sin errores bloqueantes.

Requisitos:

- Crear cuenta y caer en Inicio.
- Diseñar en un ámbito sin diagnóstico y sin propósito.
- Activar un plan con al menos una acción, criterio de hecho y confirmación de carga.
- Registrar una ocasión en la semana.
- Guardar el resultado aparte del hecho.
- Llegar a una revisión y aplicar, o dejar constancia, sin que el sistema cambie el plan solo.
- Que los controles de salud, conversación, inversión y deuda sigan rechazando lo que ya rechazan.

Qué ya se cumple, por código y por pruebas de dominio de esta auditoría: los contratos de diseño, carga, sugerencia, ejecución, avance y revisión de acciones. La tarjeta vacía de Inicio. La dirección opcional, en dominio.

Qué falta para declararlo con la misma fuerza en la interfaz: un pase de navegador del alta real, no de fixtures, en móvil, de los cuatro escenarios de la sección 5.6. `DISENA_REDISENO.md` afirma un pase el 5 de noviembre. No se repitió aquí. Hasta ese pase, el funcional queda **soportado por tests de dominio y no cerrado en navegador por esta auditoría**.

Validación externa: no es necesaria para decir que el software recorre el ciclo. Sí es necesaria para decir que una persona que no conoce el repo lo recorre sin un facilitador.

Evidencia para declararlo alcanzado: el pase de navegador anterior, con una cuenta nueva, más los tests de dominio en verde. No hace falta Rafa para este hito, salvo que el pase muestre un bloqueo.

### MVP con valor validado

La persona comprende el beneficio, consigue un resultado útil, vuelve, y hay evidencia inicial de que el problema merece una solución por la que podría pagar.

Requisitos:

- Promesa de entrada igual al ciclo (H1 resuelto).
- Puerta del piloto definida (pregunta 2).
- Los cuatro hechos de la sección 9, en una cohorte real.
- Una prueba de pago real, posterior, con rechazo o aceptación. El catálogo actual no cuenta.

Qué ya se cumple: la posibilidad técnica de producir el resultado útil. Nada de la evidencia.

Qué falta: reclutamiento, observación, medición mínima, y no ampliar el producto mientras eso ocurre.

Validación externa: toda. Rafa define la promesa y qué reglas son provisionales. Las personas demuestran uso. Negocio no fija precio antes del uso.

Evidencia para declararlo: el registro de la cohorte (aunque sea una tabla mantenida a mano) más el resultado de la prueba de pago. Una frase de «nos dijeron que les gustó» no alcanza. Un precio en el seed no alcanza.

## 11. Próximos pasos recomendados

Dependen de las respuestas de Rafa. No son un compromiso de calendario cerrado. Si la pregunta 1 se responde con «hay que construir el perfil y el índice», estos pasos no aplican y el proyecto vuelve a definición de producto, no a piloto.

### En 2 semanas

Condición: Rafa responde las preguntas 1, 2, 6 y 10. Sin eso, no hay reclutamiento.

- Fijar la frase del piloto y la puerta (plan primero, como hipótesis).
- Lista de frases públicas que la contradicen. No reescribir el sitio entero. Sí impedir que la invitación del piloto use Perfil Maestro, índice u hoja de ruta.
- Acordar los cuatro eventos o la consulta manual equivalente: activación, primer registro, indicador, revisión aplicada.
- No integrar pagos. No añadir módulos. No cambiar pesos ni umbrales.
- Pasar en navegador, con una cuenta nueva, el escenario sin diagnóstico y sin propósito, en un ancho de móvil. Si ese pase falla, se corrige ese bloqueo y no se recluta.

Hecho que demuestra avance: una cuenta nueva, ajena al seed de simulación, deja un plan activo y el equipo puede señalar la fila.

### En 4 semanas

Condición: el pase anterior existe y hay cinco personas reclutadas con el filtro acordado.

- Correr las sesiones iniciales.
- No mandar recordatorio de producto.
- A los 7 días, la entrevista corta de la sección 9.
- Anotar abandonos con el paso exacto, no con un atributo de personalidad.

Hecho que demuestra avance: una tabla de ocho filas como máximo, con tiempo hasta activar, si usó Descubre, si registró algo antes del día 7, y una cita textual de cómo explica el resultado. Si menos de la mitad activa, se detiene la construcción y se revisa la puerta. No se «mejora el diagnóstico» como reacción automática.

### En 8 semanas

Condición: se sostuvo el retorno espontáneo descrito en la sección 9.

- Entrevistas de la ventana 14 a 28 con quienes eligieron un horizonte corto.
- Rafa mira, con esos casos, si los pesos y el aviso de exigencia produjeron planes absurdos o simplemente pasaron. Ahí sí puede firmar, cambiar o retirar. No antes.
- Solo si se cumple la evidencia mínima de uso, negocio diseña la prueba de pago real, con el beneficio que las personas nombraron, no con el del seed.
- Si no hubo retorno, el paso no es un módulo de engagement. Es volver a la pregunta 1: quizá el problema que el ciclo resuelve no es el que trae a nadie de vuelta.

Estos plazos se corren si Rafa no responde. No se rellenan con funcionalidad.

## 12. Incertidumbres y aspectos no verificados

No verificado en esta auditoría:

- Recorrido en navegador, móvil y escritorio, de registro, diseño, semana y revisión. Incluidas las capturas citadas en `tmp/disena-ui/` y `tmp/proposito-ui/`.
- Pruebas HTTP (`apps/api/vitest.integration.config.ts`). Exigen `DATABASE_URL` de la base desechable `mk_journey_it`. No se corrieron para no crear ni borrar bases.
- `npm run test:acceptance`. El script tira esa base al terminar. No se ejecutó.
- Correos reales de bienvenida, reset y reenganche. El reenganche además está apagado por `EARLY_ACCESS_MODE`.
- Datos de producción, Railway, cookies en un dominio público, y si alguien usa el producto fuera de local.
- Contenido efectivo de `/privacidad` y `/terminos` frente a lo que el admin puede leer. Se vio que Cuenta enlaza a esas páginas y que el registro no pide aceptarlas.
- Si `TerritoryScreen` ignora `excepciones` en el click. El código de Memoria sí ignora `vista`. El de excepciones quedó en la lectura de componentes, sin prueba de interfaz ejecutada.
- Tiempos reales de una persona en el cuestionario.
- Cualquier cifra de conversión, retención o pago. No existen en el repo como resultados. No se estimaron.

Verificado en esta auditoría, el 5 de noviembre de 2026:

- 139 pruebas de dominio en `apps/api`, archivos listados en el anexo. Todas pasaron. Incluyen intervención, territorios, diseño, revisión de acciones, dirección, evidencia de propósito, tablero, cobertura, ledger y compuerta de plan.
- 11 pruebas de interfaz en `apps/web`: `dashboard-next.test.ts`, `design-flow.test.ts`, `direction-unknown-welcome.test.tsx`.
- Conteo del catálogo: 31 módulos, 239 preguntas.
- Denominadores impresos por `territory-catalog.test.ts`: Mentalidad 11, Finanzas 19, Relaciones 17, Salud física 54.
- Lectura directa de `executionFrom`, `progressFrom`, `reviewProposal`, `recommendStrategies`, `designLoad`, `designReadiness`, `SubscriptionGuard`, `resolveMemberAccess`, `EARLY_ACCESS_MODE`, seed de beneficios, hero y etapas públicas, redirecciones, ausencia de imports de `PerfilContent` y de `@mk/matrix-engine` en `apps/web`.

Inferencias que no hay que citar como hechos: que el camino largo provoca abandono, que el aha es la ficha del plan, que cinco de ocho activarán, y que una suscripción futura debería cobrarse por ciclos de revisión. Son hipótesis de las secciones 6, 9 y 11.

Desalineaciones de documentación que no se «corrigieron» en el código, porque el encargo es auditar:

- `PRODUCTO_VIABLE.md` sección 9 frente a `progressFrom` y `executionStats` (H9).
- La frase de «no hay datos» en ese mismo documento frente al texto actual de `recommendStrategies`.
- El comentario de `product-phase` dice que las cuentas autenticadas entran al cuestionario. `getPostAuthPath` las deja en `/panel`.
- `PRODUCTO_VIABLE.md` habla de 16 pruebas de Mentalidad. El archivo ejecutado tiene 19 tests y pasó.

`docs/` está en `.gitignore`. `docs/product/PROPOSITO.md` existe en el disco de trabajo y se usó como contraste. No forma parte del árbol que git publica, salvo que alguien lo versiona por otro medio. No se comprobó.

## 13. Anexo de rutas, archivos, tests y evidencia técnica

### Rutas de miembro que arman el ciclo

| Ruta | Qué monta |
|---|---|
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Acceso. Tras entrar, `/panel` |
| `/panel` | `StartDashboard` dentro de `InicioDashboard` cuando hay acceso de miembro |
| `/ambito/[territory]` | Ficha del ámbito |
| `/diagnostico`, `/diagnostico/bienvenida`, `/diagnostico/modulo/[moduleSlug]/pregunta` | Player |
| `/disenar`, `/disenar/[planId]` | `DesignStudio`, `PlanDesignFlow` |
| `/semana`, `/semana/revision` | `CalendarScreen`, `WeekReviewScreen` |
| `/planes`, `/planes/[planId]`, `/logro`, `/mantener` | Lista, ficha, logro, mantenimiento |
| `/proposito`, `/proposito/respuestas` | `DirectionScreen`, `PurposeAnswersScreen` |
| `/memoria` | `MemoryScreen` |
| `/cuenta` | `CuentaContent` |
| `/ikigai`, `/ikigai/empezar`, `/ikigai/s/[sessionId]` | Herramienta aparte, sin cuenta |
| `/precios` | Catálogo público, sin cobro en acceso anticipado |
| `/admin`, `/admin/users`, `/admin/planes`, `/admin/lab` | Operación y laboratorio. No es el producto de miembro |

Redirecciones que vacían la promesa vieja hacia el ciclo nuevo: `/mente`, `/cuerpo`, `/espiritu`, `/asesores`, `/ruta` → `/panel`. `/perfil` y `/diagnostico/resultado` → `/memoria?vista=documentos`.

### Archivos que sostienen las afirmaciones de comportamiento

- Acceso: `apps/api/src/auth/auth.service.ts`, `auth.module.ts`, `auth.constants.ts`, `member-access.ts`, `subscription.guard.ts`, `apps/api/src/product-phase.ts`.
- Tablero: `apps/api/src/journey/dashboard.ts`, `apps/web/lib/dashboard-next.ts`, `apps/web/components/member/StartDashboard.tsx`.
- Cuestionario: `apps/api/src/diagnostic/diagnostic.service.ts`, `apps/api/src/instrumentos/answer-ledger.ts`, `territory-catalog.ts`, `reading.ts`, `packages/database/definitions/formulario-completo@6.json`.
- Lecturas y revisión: `apps/api/src/journey/intervention/engine.ts`, `execution-coverage.ts`, `mentalidad.ts`, `finanzas.ts`, `relaciones.ts`, `salud.ts`.
- Diseño: `apps/api/src/journey/intervention/plan-design.ts`, `intervention.service.ts`, `apps/web/components/member/design/`.
- Seguridad de contenido: `apps/api/src/instrumentos/restrictions.ts`, `apps/api/src/journey/plan-gate.ts`, `journey.service.ts` `assertMemberContentTags`.
- Semana: `apps/api/src/journey/intervention/action-review.ts`, `apps/web/components/journey/WeekReviewScreen.tsx`, `ActionReviewPanel.tsx`.
- Dirección: `apps/api/src/journey/member-direction.ts`, `direction-exploration.ts`, `purpose-synthesis.ts`, `purpose-evidence.ts`.
- Cobro: `apps/api/src/billing/billing.service.ts`, `billing.controller.ts`, `packages/database/prisma/seed.ts`.
- Copy público: `apps/web/lib/landing-copy.ts`, `apps/web/lib/product-stages.ts`.

### Pruebas ejecutadas el 5 de noviembre de 2026

API, todas verdes, 139 tests:

`execution.test.ts`, `answer-ledger.test.ts`, `purpose-evidence.test.ts`, `member-direction.test.ts`, `direction-exploration.test.ts`, `territory-catalog.test.ts`, `dashboard.test.ts`, `plan-gate.test.ts`, `purpose-synthesis.test.ts`, `intervention-mentalidad.test.ts`, `action-review.test.ts`, `intervention-territories.test.ts`, `plan-design.test.ts`.

Web, todas verdes, 11 tests:

`dashboard-next.test.ts`, `design-flow.test.ts`, `direction-unknown-welcome.test.tsx`.

### Pruebas existentes y no ejecutadas aquí

HTTP de diseño, revisión, dirección y aceptación: `plan-design.http.test.ts`, `action-review.http.test.ts`, `purpose-direction.http.test.ts`, `direction-cycle.http.test.ts`, `intervention-mentalidad.http.test.ts`, más el resto de `vitest.integration.config.ts`.

Auth de sesión: `auth-session-contract.test.ts`, `auth-token-lifetime.test.ts`.

Navegador: `e2e/` y los guiones citados en `DISENA_REDISENO.md` y `docs/product/PROPOSITO.md`.

IKIGAI público: `packages/ikigai-engine/test/engine.test.ts`, `apps/api/test/ikigai.test.ts`, `e2e/ikigai.spec.ts`.

### Contratos que esta auditoría no reabre

Matriz v2, índices, denominadores de cobertura como definición, y textos de ítem del cuestionario. Los controles de `restrictions.ts`. La opcionalidad de Descubre y Propósito. Los cinco pasos. Los cuatro ámbitos. La ausencia de día fijo, el disparador que no se vuelve ocasión semanal, y la conservación de la plantilla al reemplazar una acción.
