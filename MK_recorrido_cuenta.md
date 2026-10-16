# Recorrido que una cuenta puede hacer hoy

7 oct 2026. Hecho vigente en el checkout local. No es el plan de producto completo ni una promesa de lo que falta.

Sirve para que otro modelo continúe sin reconstruir el ciclo ni tratar como hecho lo que todavía no está. Si este archivo contradice el código, manda el código.

## Quién entra

Cualquier cuenta autenticada puede usar el producto de miembros. `resolveMemberAccess` devuelve `canUseMemberProduct: true` si hay `userId`. La lista `MEMBER_PREVIEW_USER_IDS` solo marca `isMemberPreview`. No abre ni cierra el recorrido.

`EARLY_ACCESS_MODE` sigue activo. No se cambian roles, suscripciones ni el acceso público. El correo hacia `@fixtures.mk.invalid` no se envía.

Tras el login, si el paso de la cuenta sigue en el cuestionario, el destino es `/diagnostico`. Si ya salió de ese paso, el destino es `/panel`.

## Orden que sí recorre

```text
Cuenta
  -> /diagnostico
  -> /perfil
  -> /proposito
  -> /planes
  -> /calendario
  -> cierre de semana
  -> semana siguiente
```

`/panel` no es un paso que escriba. Lee la ficha y el siguiente paso.

Hay dos salidas después del cuestionario. Las dos permiten crear un plan en `/planes`.

1. Explorando. La persona no cierra un propósito. Puede dejar una referencia y una ficha. El plan usa un vínculo exploratorio, habilitante, de protección o directo.
2. Provisional o confirmada por la persona. Elige una dirección y puede confirmar el texto que ve.

La ficha de alineación no abre ni cierra el plan. Puede quedar pendiente.

## 1. Cuestionario

Ruta: `/diagnostico`.

Sesiones nuevas usan la versión activa `formulario-completo@1`, `definitionRef` `formulario-completo`. El archivo de esa definición se llama `packages/database/definitions/formulario-completo@1.json`. El identificador en la base no se renombró: las sesiones ya guardadas lo usan. Una sesión conserva la versión con la que empezó. `formularios-x-paso` queda inactivo y legible.

El catálogo tiene 31 módulos y 229 preguntas. Tipos reales en el catálogo: `SCALE_1_5`, `SINGLE_CHOICE` y `FREE_TEXT`. No hay todavía selección con máximo, número con unidad, listas dependientes ni fila de IKIGAI con opciones encadenadas. Esos ejercicios están como texto libre o como escala.

El player existente guarda cada respuesta con `POST /api/v1/diagnostic/response`, marca la bienvenida y el cierre de cada módulo, y `GET /api/v1/diagnostic/state` retoma. Al cerrar los 31 módulos, `completeDiagnostic` escribe el perfil. Para esta versión el arquetipo guardado es `sin-clasificar`. No se calcula arquetipo de dimensiones.

La lectura queda en `MasterProfile.indices` y en `DiagnosticFormResult` con `formCode` `formulario-completo`. La escribe `persistFormularioReading` en `apps/api/src/instrumentos/reading.ts`.

Contrato de lo que el perfil puede mostrar, solo si hay cobertura:

| Instrumento | Qué se calcula |
| --- | --- |
| Auditoría | 23 ítems, 23 a 115. Categoría solo con 23 de 23. El campo `auditBand` queda vacío. La frase va en `auditNote`. |
| Desarrollo y sentido | 10 ítems, aparte de la auditoría. Sin bandas. |
| Relaciones | 12 ítems, 12 a 60. Bandas solo con 12 de 12. |
| Finanzas | 12 ítems, 12 a 60. Bandas propias. La proyección no entra en ese total. |
| Identidad | 10 ítems, 10 a 40. Sin categoría, incluidos 34 y 35. |
| Dificultades | Cinco grupos de 0 a 18. Interferencia y recursos no se suman en un total. |
| Personalidad | Cinco factores. El ítem del medio de cada trío es inverso. El quinto es sensibilidad emocional. Sin promedio global. |
| IKIGAI | Actividades en texto. Sin valoración numérica. |
| Cuerpo | Declaraciones en texto. Sin índice. |

Una respuesta faltante no se rellena con cero. Una alerta de auditoría no bloquea el resto del recorrido.

## 2. Perfil

Ruta: `/perfil`.

Si `indices.auditTotal` es un número, se muestra `ExcelProfile`. Si no, cae al informe viejo de dimensiones.

Muestra auditoría, relaciones, finanzas, identidad, desarrollo y sentido, los cinco grupos de dificultades y los descriptores de personalidad cuando la lectura los trae.

También lee `GET /api/v1/journey/state` y, si hay ficha guardada, muestra la misma alineación declarada que Inicio: total, fecha, cobertura y los tres pilares. Si no hay ficha, dice que no está guardada. Si la lectura falla, lo dice aparte.

## 3. Hoja de ruta

Ruta: `/proposito`.

Guarda en `PurposeRevision.content`:

- `directionStatus`: `EXPLORANDO`, `PROVISIONAL` o `CONFIRMADO_POR_USUARIO`.
- `statement`: referencia editable.
- `name`.
- `iad`: ficha, si se guardó.
- `contract`: texto congelado al confirmar.

`POST /api/v1/journey/purpose` mezcla el contenido nuevo con el anterior. Guardar la hoja no borra la ficha.

`POST /api/v1/journey/purpose/confirm` congela el texto del contrato en esa revisión. Si ya estaba confirmada, no la reescribe. Una edición posterior de la hoja crea otra revisión.

Los artículos salen de las respuestas de la sesión `formulario-completo` cerrada, por hoja y celda (`E-PER-000!R30`, no solo `R30`).

| Artículo | Si hay respuesta | Si falta |
| --- | --- | --- |
| Origen, visión, valores, estándar semanal, huella | Borrador del texto guardado | Dice qué respuesta no está |
| Identidad | Remite al total del perfil. No confirma la hoja | Dice que no hay respuestas |
| Personalidad | Lectura descriptiva de los cinco factores. No define a la persona | Dice que faltan las quince respuestas |
| Dificultades | Remite a los grupos del perfil. No las convierte en una causa | Dice que no hay lectura para revisar |
| IKIGAI | Lista actividades guardadas | El cruce entre los cuatro campos queda sin elegir |
| Relaciones y finanzas | Banda del formulario | Dice qué bloque falta |

Relaciones no escriben horas. Finanzas no escriben un porcentaje para invertir o endeudarse. El compromiso de tiempo o de dinero sigue como elección de la persona.

Confirmar la hoja no confirma cada artículo. Un puntaje no se convierte en propósito.

## 4. Ficha de alineación declarada

Está en `/proposito`. Nueve criterios, 1 a 5, o «No tengo información suficiente».

Método guardado: `iad-mk-0.1-borrador`. Normalización `25 × (respuesta − 1)`. Pilar solo con 3 de 3. Total solo con 9 de 9. No se imputa.

Ejemplo guardado en la cuenta local: espíritu 75, mente 50, cuerpo 25, total 50.

`/panel`, `/perfil` y `/proposito` leen esa misma revisión. Inicio muestra el total, «Método en revisión» y la fecha. Si no hay ficha, la placa dice que no está guardada. Mente, Espíritu y Cuerpo en la escena de Inicio siguen sin cifra. Esa placa no es un porcentaje de tareas.

La ficha no bloquea el plan. Confirmar el plan no cambia las respuestas de la ficha.

## 5. Plan

Ruta: `/planes`.

`POST /api/v1/journey/plans` exige las dos cosas:

1. Una sesión de diagnóstico con estado `COMPLETED`. El servidor no comprueba que esa sesión sea `formulario-completo`.
2. `directionStatus` en `EXPLORANDO`, `PROVISIONAL` o `CONFIRMADO_POR_USUARIO`.

El plan guarda título, resultado, vínculo y el texto de la guía en `PersonalPlan.priorityNote`. El vínculo es `DIRECT`, `ENABLING`, `PROTECTIVE` o `EXPLORATORY`.

Las once guías están en `apps/web/lib/plan-guides.ts`. Cada una tiene cuándo sirve, tres o cuatro pasos y un texto inicial editable:

1. Convertir una intención en resultado.
2. Elegir prioridades y renuncias.
3. Planificar una semana real.
4. Iniciar una tarea y reducir fricción.
5. Aprender una habilidad.
6. Traducir un valor en estándar.
7. Preparar una conversación.
8. Ordenar una decisión económica.
9. Organizar un cuidado.
10. Explorar una hipótesis.
11. Revisar y ajustar.

Si la hoja tiene un borrador de valores, `/planes` lo muestra. Elegir la guía de estándar parte de ese texto. El texto que la persona corrige es el que se guarda. No hay una tabla `HelpArtifact`. El artefacto es `priorityNote`.

La acción tiene título y criterio (`doneWhen`). No tiene duración, ocasión ni versión propia.

Atajo real: en `/mente`, `/espiritu` y `/cuerpo`, agregar una tarea llama a `ensureActivePlan`. Si no hay plan activo, crea uno titulado «Plan vigente» sin cuestionario cerrado y sin dirección. El formulario de `/planes` sí exige esas dos condiciones. Los dos writers no cumplen el mismo contrato.

## 6. Calendario y cierre

Ruta: `/calendario`. Zona `America/Santiago`. La semana empieza el lunes.

Registrar: `POST /api/v1/journey/records` con `PENDING`, `DONE`, `SKIPPED` o `NOT_APPLICABLE`, más una nota opcional. Un registro por acción y día. Una semana cerrada rechaza registros nuevos.

Cerrar: `POST /api/v1/journey/weeks/close`.

| Decisión | Efecto |
| --- | --- |
| `KEEP` | La acción sigue igual |
| `MODIFY` | Escribe título o criterio nuevo. Si no viene ninguno de los dos, responde 403: «Modificar exige el texto nuevo de la acción.» |
| `RETIRE` | `active` pasa a falso. Deja de salir en el plan vigente |

El cierre es una transacción. Si la semana ya estaba cerrada, devuelve la misma `WeekReview` y no aplica otra vez.

Antes de escribir el cambio, guarda en `snapshot` el criterio que regía esa semana y sus registros. Al abrir esa semana, el calendario muestra ese criterio. La semana posterior, si no está cerrada, muestra el criterio ya modificado.

No hay reducir frecuencia, sustituir por otra acción, pausar desde una fecha, horizonte de 21 días ni ocasiones fijas, flexibles o por evento. «Revisar y ajustar» en las guías es un texto. No es este cierre.

## 7. Inicio

Ruta: `/panel`.

`GET /api/v1/journey/state` elige el siguiente paso:

1. Sesión abierta sin respuestas: comenzar la auditoría.
2. Sesión abierta con respuestas: continuar la auditoría.
3. Sin sesión cerrada: comenzar la auditoría.
4. Hoja sin confirmar: abrir la hoja de ruta.
5. Sin plan activo: crear el plan.
6. Plan sin acciones: agregar una acción.
7. Semana abierta sin registros: abrir el calendario.
8. Semana abierta con registros: revisar la semana.
9. Semana cerrada: continuar. El texto dice que las decisiones quedaron en el plan vigente.

La placa se llama «Alineación declarada». No se llama índice de alineación.

## Otras rutas del menú

No son el ciclo de arriba.

| Ruta | Qué hace |
| --- | --- |
| `/ruta` | Progreso de los módulos del cuestionario. No es el plan. |
| `/mente`, `/espiritu`, `/cuerpo` | Tareas del día de ese ámbito. Pueden crear el plan atajo descrito arriba. |
| `/asesores` | Un texto que queda en `GuidanceRequest`. No hay directorio de profesionales. La fuente enviada es `alerta-de-ficha`. |
| `/cuenta` | Datos de la cuenta. |

## Qué no puede hacer todavía

- Completar el Excel con sus controles propios: máximo de valores, unidades, listas de NO BORRAR, IKIGAI dependiente, excepciones `UNKNOWN`, `NOT_APPLICABLE`, `DECLINED` y `PENDING`.
- Ver en la hoja una síntesis firmada que una cada artículo con su fuente y deje elegir entre el borrador nuevo y una edición previa.
- Tener ocasiones futuras, porcentaje de ocasiones aplicables, o un cierre que reduzca frecuencia sin cambiar el criterio.
- Conservar el criterio viejo dentro de la acción misma. La foto está en la semana cerrada. La acción vigente solo tiene el texto actual.
- Que las restricciones de lesión, esfuerzo, deuda o inversión rechacen confirmar una acción. El cálculo existe en `apps/api/src/instrumentos/restrictions.ts` y el recorrido no lo llama.
- Recorrer las 229 preguntas desde el navegador como prueba de aceptación. La cuenta local las envió por la API. El navegador comprobó perfil, hoja, plan, calendario e inicio de esa cuenta.
- Dos cuentas nuevas, una con dirección elegida y otra explorando, hechas enteras desde la interfaz.

## Cuenta local ya recorrida

No es una persona. Respondió la primera opción, o un texto corto cuando no había opciones.

- Correo: `formulario.local.1791413575216@fixtures.mk.invalid`
- Clave: `LocalWalk123`
- Auditoría 23 de 115, por debajo de 46. Relaciones 12 de 60, detrimento. Finanzas 12 de 60, crítico. Identidad 10 de 40. Sentido 10 de 50. Dificultades 18 de 18 en los cinco grupos.
- Hoja en `EXPLORANDO`. Ficha 75, 50, 25, total 50, guardada el 7 oct 2026.
- Acción «Escribir el borrador». Semana cerrada con criterio «Hay un parrafo». Semana siguiente con criterio «Hay un parrafo sin diseno».

API local: `http://127.0.0.1:4000/api/v1`. Web: `http://127.0.0.1:3000`.

## Archivos que otro modelo debe abrir primero

| Pieza | Archivo |
| --- | --- |
| Catálogo activo | `packages/database/src/formulario-completo.ts` y `packages/database/definitions/formulario-completo@1.json` |
| Catálogo anterior | `packages/database/src/formularios-previos.ts` |
| Decisiones de adaptación | `packages/database/definitions/formulario-completo.DECISIONES.md` |
| Cierre del diagnóstico | `apps/api/src/diagnostic/diagnostic.service.ts` |
| Puntajes, alertas, ficha, restricciones | `apps/api/src/instrumentos/` |
| Hoja, plan, calendario, cierre | `apps/api/src/journey/journey.service.ts`, `hdrp-contract.ts`, `apply-week.ts` |
| Pantallas | `apps/web/components/journey/` y `apps/web/components/profile/ExcelProfile.tsx` |
| Guías | `apps/web/lib/plan-guides.ts` |
| Cliente HTTP | `apps/web/lib/journey-api.ts` |
| Registro de lo implementado | `MK_IMPLEMENTATION_PROGRESS.md` |

## Qué no cambiar al continuar

- No reescribir `definitionRef` `formulario-completo` ni `formCode` `formulario-completo` en sesiones que ya respondieron.
- No activar la matriz v2 dentro de este recorrido. El Lab queda aparte.
- No tratar la ficha `iad-mk-0.1-borrador` como fórmula del Excel ni como índice de tareas.
- No declarar el ciclo completo porque estos archivos existen. El límite está en la sección «Qué no puede hacer todavía».
