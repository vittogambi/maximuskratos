# Informe de casos realistas

13 oct 2026. Ejecutado contra la beta local. Sin commit, sin push, sin staging y sin tocar la base `maximuskratos`. PostgreSQL aislado `mk_journey_it`: se creó, se migró con las 28 migraciones y se eliminó. Al terminar, esa base ya no existe.

Los números esperados salen de `referencia_indices.json`, calculado con fracciones y sin importar el scoring de MK. La propuesta y la ayuda que cito son las que devolvió `POST /journey/priority/preview` antes de crear el plan. El objetivo escrito lo manda el guion como texto de la persona (`USER_GOAL`). La acción, la ocasión y el criterio los arma el servidor (`SYSTEM_GENERATED`). Los registros de semana son simulación (`SCRIPTED_SIMULATION`).

## Qué se corrigió en el producto, en general

- El general redondeaba cada promedio antes de promediar el siguiente. En el vector D eso desviaba 0,0001 respecto del oráculo. Ahora el redondeo a 4 decimales es solo al publicar cada grupo, pilar y general.
- El motor solo entendía cuatro intereses. Ahora reconoce familias: trabajo, IKIGAI, cuidado, finanzas, relaciones, pausa y reconfirmar. No hay ramas por nombre de caso.
- La vista previa devuelve una ayuda con evidencia, carga declarada, criterio y lo que no incluye. No inventa una hora.
- Confirmar con el mismo comando devuelve la misma decisión. Si entre la vista previa y la confirmación aparece un límite vigente, responde 409 y no guarda.
- `POST /journey/reading/recover` materializa la lectura de una sesión ya cerrada. La vista de estado conserva la lectura inicial junto a una medición posterior.
- La vista previa de la semana puede devolver la guía de revisión del servidor.

## Corridas HTTP

| Corrida | Qué pasó |
| --- | --- |
| Suite 1 | MK-S02 devolvió 404 con cuerpo vacío en `POST /diagnostic/response`, a los 373 ms. No quedó el id de la pregunta: el corte ocurrió antes de registrarla. |
| S02 solo | Pasó en 12,5 s. |
| Suite 2 | MK-S03 se detuvo a los 9,4 s con un estado vacío (`paso {}`), sin código de estado. Los otros 11 pasaron, incluido S02. |
| S03 solo | Pasó en 12,8 s, con índice 44,5988 y foco CUIDADO. |

No hay reintento dentro del test. No doy por encontrada la causa. No digo que desapareció.

Catálogo de las cuentas nuevas: `formulario-completo@6`. Método: `ia-mk-cuest@0.1`. Motor: `prioridades@0.1`.

## Resultados por caso

La columna HTTP es la suite 2, salvo S03, que ahí falló y después pasó solo. Cálculo: dominio contra el oráculo, 12 de 12, más la comprobación HTTP cuando la suite llegó a leer el índice.

| Caso | HTTP | Cálculo | Foco observado | General observado | Ayuda | Revisión | Juicio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MK-S01 | PASS | PASS 54,4753 | ORGANIZACION | 54,4753 | PASS | PASS | Útil, con plantilla compartida |
| MK-S02 | PASS en suite 2. 404 en suite 1 | PASS, general nulo, 19 señales | EXPERIMENTO | null | Parcial | PASS | No bloquea el plan |
| MK-S03 | FAIL en suite 2. PASS aislado | PASS 44,5988 | CUIDADO | 44,5988 | PASS en la corrida aislada | PASS aislado | El fallo de la suite no tiene causa |
| MK-S04 | PASS | PASS 67,284 | PAUSA, sin acción | 67,284 | PASS | PASS | No fabrica incumplimiento |
| MK-S05 | PASS | PASS 67,284 | ORDEN | 67,284 | PASS | PASS | No propone inversión ni deuda |
| MK-S06 | PASS de índice | PASS 67,284 | PROPIO, sin acción | 67,284 | FAIL | No aplica | El núcleo alto no produce el paso |
| MK-S07 | PASS | PASS 67,284 | ACLARAR | 67,284 | PASS | PASS | No empieza por confrontar |
| MK-S08 | PASS | PASS 54,4753 | ORGANIZACION | 54,4753 | PASS | PASS | Hecho no sube el índice |
| MK-S09 | PASS de índice | PASS 49,8457 | ORGANIZACION | 49,8457 | Parcial | PASS | Misma ayuda que S01, con su carga |
| MK-S10 | PASS de índice | PASS 67,284 | PROPIO, sin acción | 67,284 | FAIL | NO_EVIDENCE del retorno tardío | No hay regla de retorno |
| MK-S11 | PASS | PASS 54,4753 | ACLARAR | 54,4753 | PASS | PASS | No elige el pilar más bajo |
| MK-S12 | PASS | PASS | RECONFIRMAR no se pidió en la vista previa | null y luego 54,4753 | PASS de reparación | PASS | 8 de 20 elegibles, no 12 |

MK-S12, lectura inicial sobre `formulario-completo@4`: pilares nulos, 8 de 20. Quedaron fuera las seis de identidad, R8, R19 y las cuatro de sentido (anclajes ocultos). El paquete ya avisaba que 12 no era una cifra exigible. Después de reconfirmar, el general fue 54,4753, la diferencia automática fue nula y un segundo cierre de la misma medición devolvió el mismo número. Las respuestas de la sesión vieja no se reescribieron. La siembra de esa sesión es preparación del guion, no un recorrido por el player.

En los casos con acción, marcar el paso como hecho y el resultado como no observado devolvió la situación `STUCK_RESULT`. Cerrar la semana sustituyó la estrategia y el índice inicial siguió igual. Un segundo login leyó el mismo general. La sustitución conserva el título anterior en el plan.

## Dimensiones de la ayuda

0 ausente, 1 parcial, 2 clara. Un 0 en concreción deja el recorrido incompleto.

| Caso | Evidencia | Pertinencia | Viabilidad | Concreción | Aprendizaje | Control |
| --- | --- | --- | --- | --- | --- | --- |
| S01 | 2 | 2 | 2 | 2 | 2 | 2 |
| S02 | 2 | 2 | 1 | 1 | 1 | 2 |
| S03 | 2 | 2 | 2 | 1 | 2 | 2 |
| S04 | 2 | 2 | 2 | 2 | 1 | 2 |
| S05 | 2 | 2 | 2 | 2 | 1 | 2 |
| S06 | 1 | 0 | 1 | 0 | 0 | 2 |
| S07 | 2 | 2 | 2 | 2 | 1 | 2 |
| S08 | 2 | 2 | 2 | 2 | 2 | 2 |
| S09 | 2 | 1 | 2 | 1 | 2 | 2 |
| S10 | 1 | 0 | 1 | 0 | 0 | 2 |
| S11 | 2 | 2 | 2 | 2 | 1 | 2 |
| S12 | 2 | 2 | 2 | 2 | 2 | 2 |

S06 y S10 quedan cortos: con el núcleo alto el motor dice que elijas el foco y no arma un paso. Enseñar un oficio o retomar después de un mes no tienen regla propia. No completé ese plan a mano.

S09 recibe la misma acción de organización que S01, con 1 ocasión y 45 minutos. Sirve para la planificación débil (R26 = 1) y no nombra la barrera de compartir el borrador.

S02 propone una prueba pequeña y prohíbe poner la monetización como condición. No guarda por sí solo las observaciones de la muestra ni distingue «le gustó preparar» de «hay demanda».

## Variaciones

| Id | Estado | Qué se vio |
| --- | --- | --- |
| V01 | PASS | Una respuesta fuera del núcleo no cambia el general. El índice guardado tampoco cambia al cerrar la semana. |
| V02 | PASS | S06 marcó el origen como desconocido. El general siguió en 67,284, igual que otros perfiles con el mismo núcleo. |
| V03 | PASS | Alargar el texto de una confirmación de profundidad no cambia el puntaje. |
| V04 | PASS en S03 aislado | Vista previa sin límite, luego un límite vigente, y la confirmación con el resumen viejo respondió 409. El general siguió igual. |
| V05 | NO_EVIDENCE | Esta corrida no contrastó una lesión antigua ya aclarada con un límite vigente. |
| V06 | PASS | Marcar hecho, en S08 y en los demás casos con acción, no subió el índice. |
| V07 | PASS | El mismo comando de prioridad devolvió la misma fila. |
| V08 | PASS en S10 | Una medición de una sola señal no creó general. La medición completa creó otra lectura y dejó la inicial. |
| V09 | PASS de cálculo. Parcial de ayuda | Cambiar interés y minutos no entra al cálculo. El texto de la ocasión sí usa los minutos que mandas. No abrí una segunda cuenta HTTP solo para eso. |
| V10 | PASS de cálculo | Con todos los extremos superiores el general es 100. Eso no es un resultado observado. La semana de S08 ya mostró que un hecho sin resultado no reescribe el snapshot. No recorrí por HTTP un cuestionario entero de extremos. |

## Frente a un registro simple

Para S01 y S08, un registro simple guardaría el objetivo, una marca de hecho y el texto del resultado. Con los mismos datos, MK además publicó el índice con cobertura, propuso organizar porque la dirección declarada es clara y la planificación es débil (Cuerpo queda más bajo y no fue el foco), armó la carga con los minutos declarados, separó «lo hice» de «el resultado no se vio» y sustituyó la estrategia futura sin cambiar el 54,4753. Eso es una diferencia de lo que la salida permite decidir. No es una prueba de que una persona mejore, ni una comparación contra otra aplicación.

## Capacidades que siguen faltando

- Una regla de retorno después de una ausencia: fecha de la lectura, sin regenerar obligaciones viejas y sin aplicar un cierre atrasado al plan de hoy. S10 no la tiene.
- Un paso cuando la persona trae una meta y el núcleo no muestra una tensión fuerte. S06 se queda en «elige el foco».
- La ayuda de IKIGAI no recoge la observación de la muestra ni separa interés, utilidad y sostenibilidad como tres datos.
- El 404 de cuerpo vacío y el estado vacío a mitad del cuestionario. Aparecieron en esta sesión. La causa no está identificada.

## Pruebas de esta pasada

- Dominio, oráculo y prioridad: 20 pruebas del archivo de casos y 12 del núcleo. Pasaron.
- Componentes: 17, incluidas 2 de la ayuda propuesta.
- HTTP aislado: suite 2, 11 pasaron y MK-S03 falló. S02 y S03 pasaron al correrlos solos.
- Typecheck de la API, después de los cambios de prioridad, sin errores nuevos de esos archivos.

Una semana simulada con resultado no observado no demuestra que alguien haya mejorado. Estos personajes no son testimonios.
