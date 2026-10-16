# Revisión de admin: recorrido de una cuenta

Nota de lo que se armó el 16 de octubre de 2026. Es consulta. No edita respuestas, firmas ni planes, y no entra a la cuenta del miembro.

Antes, `/admin` listaba correo, rol, onboarding y suscripción. El Lab revisa metodología con casos propios. No había una pantalla para abrir lo que una persona guardó. El único rastro de alertas era `alertCount` dentro del perfil, y ese número también salía en el JSON del miembro.

## Cómo entrar

La cuenta local de admin es `admin@maximus-kratos.local`. La clave quedó otra vez en la del seed, `ChangeMeAdmin123!`. `/login` con rol `ADMIN` abre `/admin`.

En Usuarios, cada fila tiene **Ver recorrido**. El menú tiene **Alertas**.

## Pantallas

| Ruta | Qué muestra |
|---|---|
| `/admin/users` | La lista de siempre, más el enlace al recorrido. |
| `/admin/users/[userId]/recorrido` | La cuenta elegida. Si hay varias sesiones, se elige una. Por defecto va la de actividad más reciente, no la que tenga más respuestas. |
| `/admin/alertas` | Bandeja de todas las alertas registradas, de 30 en 30. |

El recorrido está en cinco bloques:

1. Resumen: auditoría, relaciones, finanzas, identidad, desarrollo y sentido.
2. Cuestionario: módulos de esa versión, con título, objetivo y cuántas respuestas hay. Al abrir un módulo se piden sus preguntas, de 30 en 30, con el texto, el tipo, la respuesta, los anclajes y el estado (respondida, no respondida, desconocido, no aplica, prefiero no responder, omitida).
3. Perfil e índices: dificultades y personalidad como vienen guardadas, sin un total mezclado. Las lecturas de `core_readings` (índice de alineación MK) con general, pilares, cobertura, fecha y método. La ficha de alineación declarada, aparte. Si no hay ficha, dice «Ficha ausente».
4. Dirección, IKIGAI y hoja. La dirección y el texto de propósito son los de la revisión más nueva. Si hay una firma anterior y un borrador posterior, se ven los dos y el borrador no pisa lo firmado.
5. Alertas de esa cuenta y de la sesión elegida.

Un cero se muestra como cero. Un nulo sale como «No disponible». Si no hay pareja, no se publica un total de 60.

La página no se prerenderiza con datos de miembros (`force-dynamic`) y las lecturas piden `cache: no-store`. Al cambiar de cuenta se vacía lo anterior antes de pintar lo nuevo.

## API

Todas bajo `/api/v1/admin`. Piden token y el rol `ADMIN` leído de la tabla `users` en esa petición. No alcanza el rol que quedó dentro de un token viejo: si se quita `ADMIN`, la siguiente llamada recibe 403. Un miembro, aunque escriba la URL, también recibe 403. Sin token, 401.

`Cache-Control: private, no-store`.

| Método | Ruta |
|---|---|
| GET | `/admin/users/:userId/journey?sessionId=` |
| GET | `/admin/users/:userId/sessions/:sessionId/responses?module=&page=` |
| GET | `/admin/users/:userId/alerts` |
| GET | `/admin/alerts` |
| POST | `/admin/alerts/reconstruct` |

La sesión, si se manda, tiene que ser de esa cuenta. Si el `sessionId` es de otra persona, responde 404 y no devuelve esas respuestas.

Cada consulta escribe `admin_access_logs`: administrador, cuenta, tipo de recurso, id de sesión si hay, y el id de la petición. No guarda el texto de la respuesta, ni el token, ni la firma.

El POST de reconstrucción recibe `userId`, `sessionId` y `execute`. Con `execute: false` solo cuenta cuántas reglas dispararían. Con `true` graba. No se corrió contra la base habitual.

## Alertas

La regla sigue siendo la que ya estaba en `auditSignals`, versión `alertas-aud@1`. No se cambiaron umbrales ni se inventó severidad.

- Filas 6 a 20 de la auditoría: dispara si el valor es 1.
- Filas 26 a 30: dispara si el valor es 2 o menos.
- Desde la fila 37: la adaptación de producto dispara si el valor es 2 o menos. La regla nativa de esas filas era «igual a 2». Las dos quedan anotadas en la fila (`nativeRule` y `productRule`). Se guarda una sola ocurrencia, la de producto.

Una respuesta con excepción (desconocido, no aplica, prefiero no responder, pendiente), omitida o vacía no dispara. No se rellena con cero.

La clave de la ocurrencia es `cuenta:sesión:pregunta:alertas-aud@1:r{revisión}`. No es global entre cuentas. Repetir el cierre o la reconstrucción no duplica esa clave. Si la transacción se revierte, no queda la fila.

Al cerrar el cuestionario el formulario, `persistFormularioReading` sigue calculando la ficha y, en la misma operación, graba las alertas disparadas con procedencia `RECORDED`. La fecha de la respuesta y la fecha de detección van separadas. Si la tabla todavía no existe, el cierre de la ficha no se cae: se omite solo el guardado de alertas.

Si la persona cambia la respuesta, la evidencia vieja sigue ligada a su revisión. En la bandeja queda marcada como no vigente. No hay un flujo para «resolver» la alerta.

Estados distintos en la pantalla:

| Estado | Cuándo |
|---|---|
| Sin alertas registradas en lo evaluado | La ficha se calculó, el contador es 0 y no hay filas. |
| Evaluación pendiente | La sesión no está cerrada y no hay ficha. |
| Detalle histórico no disponible | Hay ficha y el contador es mayor que 0, pero no hay filas. Pasa con cierres anteriores a esta tabla. |
| No se pudo consultar las alertas | La consulta falló. No se presenta como «sin alertas». |

Las cuentas cerradas antes de esta tabla no se reconstruyen al abrir la página. El POST de reconstrucción las marca `RECONSTRUCTED` y la fecha de detección es el momento del comando, no la del cuestionario.

## Qué dejó de ver el miembro

`withoutInternalAlerts` saca `alertCount` y `auditAlerts` del JSON, también si están anidados. Se aplica en:

- `GET /api/v1/diagnostic/profile` (`indices`)
- `GET /api/v1/journey/state` (`form`)

Las señales del índice de alineación (`signals` de `ia-mk-cuest@0.1`) no son estas alertas y se quedan.

El admin, en el recorrido, sí recibe el `alertCount` guardado en la ficha. La evidencia está en `questionnaire_alerts`, no en ese número.

## Migración

`packages/database/prisma/migrations/20261016190000_admin_journey_alerts`

Crea `questionnaire_alerts` y `admin_access_logs`. No toca respuestas, perfiles, revisiones ni documentos firmados.

Se aplicó en `mk_journey_it` (vacía, para el HTTP) y en `mk_journey_rep` (primero el esquema anterior, con un usuario y una revisión firmada «TEXTO FIRMADO», y después esta migración). El texto firmado siguió ahí. Esas dos bases se eliminaron. No se aplicó a `maximuskratos`, ni a staging, ni a producción.

Hasta aplicarla en la base local, el recorrido puede abrir sesiones y la hoja, pero las alertas responden como consulta fallida y no hay filas históricas.

## Pruebas

Node 22.

- `apps/api/test/admin-alerts.test.ts`: la regla real dispara o no, la clave lleva la cuenta, y el JSON del miembro pierde `alertCount` sin perder las señales del índice. 3 pruebas.
- `apps/web/test/admin-recorrido.test.tsx`: hoja firmada distinta del borrador, cero válido, sin pareja, ficha ausente, detalle histórico no disponible, y error de alertas distinto de «sin alertas». 2 pruebas.
- `apps/api/test/admin-journey.http.test.ts`, contra la API compilada y `mk_journey_it`: 401, 403 de miembro, 403 después de quitar el rol, recorrido de la cuenta correcta, snapshot firmado intacto, borrador posterior visible y separado, 404 al cruzar sesión, reconstrucción en vista previa sin escribir, segunda ejecución sin duplicar, rollback sin fila, evidencia vieja no vigente, y el estado del miembro sin `alertCount`. 1 prueba. La base se borró al terminar.

No se usó navegador. jsdom no demuestra disposición ni contraste.

## Qué no hace

- No pagina en el servidor la lista de usuarios. Esa lista sigue siendo la de cuentas, sin respuestas. Las respuestas y las alertas sí van de 30 en 30.
- No recalcula índices ni profundidad al abrir el admin. La profundidad MK no está guardada como lectura: lo que se muestra del núcleo es `core_readings`. No se llama a `depthView`.
- No incluye planes ni revisiones semanales.
- No hay severidad ni estado de resolución. No existían en la regla.
- No exporta ni manda avisos.
- El Lab no da este permiso. Solo el rol `ADMIN` de la cuenta.

## Archivos

API: `admin-actor.guard.ts`, `no-store.interceptor.ts`, `public-reading.ts`, `member-journey.controller.ts`, `member-journey.service.ts`, `dto/reconstruct-alerts.dto.ts`, `instrumentos/alert-store.ts`. Enganches en `reading.ts`, `diagnostic.service.ts`, `journey.service.ts` y `admin.module.ts`.

Web: enlace en `app/admin/users/page.tsx`, ítem en `components/admin-shell.tsx`, `app/admin/users/[userId]/recorrido/page.tsx`, `components/admin/recorrido-screen.tsx`, `components/admin/recorrido-view.tsx`, `app/admin/alertas/page.tsx`, tipos y fetch en `lib/api.ts`.

Esquema: `packages/database/prisma/schema.prisma` y la migración citada.
