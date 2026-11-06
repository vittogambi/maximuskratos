# Correcciones técnicas

5 de noviembre de 2026. Se implementó en el árbol de trabajo. No hay commit ni push.

No se tocaron instrumentos, índices, pesos, seis formas, propósito, IKIGAI, activación, revisión de planes, controles de salud, relaciones y finanzas, ni facturación.

## 1. Resumen

El player ya no cierra un módulo compartido cuando solo termina un ámbito. Completar Salud no marca como respondidas las preguntas de Mentalidad que viven en el mismo módulo, y al revés. El cierre del ámbito mira las preguntas de ese ámbito. El cierre del módulo mira todas las suyas. El cierre del instrumento sigue exigiendo el cuestionario entero.

Los enlaces que prometían un resultado ahora llegan a una pantalla que dice que las respuestas quedaron guardadas y que no hay informe ni perfil. Las excepciones de un ámbito se listan en la ficha, con la pregunta y el tipo de excepción, sin el texto de la respuesta.

`PRODUCTO_VIABLE.md` describe el motor de ejecución y de avance como está en el código, y dice que esas reglas no están firmadas por Rafa. El motor no se cambió.

Hay un script que, para correos indicados, cuenta planes activados, acciones registradas, indicadores y revisiones aplicadas, con fecha. No lista todas las cuentas y no devuelve respuestas del diagnóstico.

El access token dura 15 minutos, que es el plazo que ya decía el contrato de logout. Un token vencido no autentica. El refresh sigue igual. Si una llamada de diagnóstico o de recorrido recibe 401, el cliente refresca una vez y no entra en bucle.

## 2. Matriz

| Corrección | Estado | Archivos | Tests | Resultado | Pendientes |
|---|---|---|---|---|---|
| Módulos compartidos | IMPLEMENTADO Y VERIFICADO en dominio | `diagnostic-territory.ts`, `diagnostic.service.ts` | `diagnostic-territory.test.ts` (6) | Pasó | No se reescribió el estado `COMPLETE` ya guardado. El player vuelve a preguntar si quedan ítems. Falta un recorrido HTTP o de navegador |
| Navegación de resultados | IMPLEMENTADO Y VERIFICADO en componente, no en navegador | `next.config.ts`, `diagnostico/resultado/page.tsx`, `TerritoryScreen.tsx`, `MemoryScreen.tsx`, `CuentaContent.tsx`, `territory-catalog.ts`, `journey.service.ts` | `diagnostic-continue.test.ts`, `journey-matrix.test.tsx`, `territory-catalog.test.ts` | Pasaron | La ficha de excepciones no se abrió en el navegador |
| Documentación del motor | IMPLEMENTADO | `PRODUCTO_VIABLE.md` | No aplica | Releído contra `engine.ts` | Ninguna regla quedó declarada como firmada |
| Métricas del piloto | IMPLEMENTADO Y VERIFICADO en la función. El script no se ejecutó contra una base | `pilot-facts.ts`, `scripts/pilot-facts.ts` | `pilot-facts.test.ts` (2) | Pasó | Hay que correr el script con `DATABASE_URL` local cuando se quiera una cohorte real |
| Expiración del access | IMPLEMENTADO Y VERIFICADO en dominio y en el reintento del cliente | `auth.constants.ts`, `auth.service.ts`, `api.ts`, `journey-api.ts` | `auth-token-lifetime.test.ts` (3), `fetch-authed.test.ts` (3) | Pasaron | `auth-session-contract.test.ts` se actualizó y no se ejecutó: usa base |

## 3. Cada corrección

### Módulos compartidos

Problema. En foco de ámbito, el player filtraba las preguntas y, al terminar ese subconjunto, marcaba el módulo `COMPLETE`. `e-aud-s2` mezcla Salud y Mentalidad. `e-aud-s3` mezcla Mentalidad y Relaciones. El otro ámbito perdía esas preguntas.

Solución. `selectPlayable` y `territoryQuestionsSettled` en `diagnostic-territory.ts`. El módulo solo pasa a `COMPLETE` cuando todas sus preguntas están asentadas. El ámbito termina cuando lo están las suyas, aunque el módulo compartido siga abierto. Una excepción ya asentada cuenta como hecha. Una pendiente no. Las respuestas guardadas no se reescriben. Un módulo que ya estaba `COMPLETE` con preguntas abiertas se vuelve a ofrecer, porque el selector no se fía del estado si queda algo sin responder.

### Navegación

Problema. `/diagnostico/resultado` y `/perfil` iban a `/memoria?vista=documentos`. Memoria no leía `vista`. La cuenta decía «Ver resultado completo». El enlace de excepciones llevaba `excepciones=1` y la ficha no lo usaba.

Solución. Se quitó la redirección de `/diagnostico/resultado`. Esa ruta explica que no hay informe ni perfil. `/perfil` va a `/memoria` sin parámetro. Si alguien entra con `vista=documentos`, Memoria dice que no hay documentos. `excepciones=1` lista las excepciones guardadas del ámbito y no abre el cuestionario por sí solo. No se inventó un Perfil Maestro.

### Documentación

Problema. `PRODUCTO_VIABLE.md` decía que el porcentaje incluye lo sin registro y que un solo sí cuenta como avance. El código no hace eso. Con huecos, la propuesta es `NO_RECORDS`. Un sí o no necesita dos medidas.

Solución. La sección 9 y el caso 10.3 quedaron alineados con `executionFrom`, `executionStats`, `progressFrom` y `reviewProposal`. El texto dice que no es método firmado. El motor no se tocó.

### Métricas

Problema. No había una forma única de leer activación, registro, indicador y revisión aplicada.

Solución. `buildPilotFacts` separa plan creado, plan activado (`activatedAt`), acción registrada, indicador (`MEASURE` con referencia), revisión aplicada (`WeekReview.applied`) y revisión solo guardada. El script `apps/api/scripts/pilot-facts.ts` pide correos y no recorre todas las cuentas. No imprime respuestas.

Comando, con la base local que ya uses:

```bash
npx tsx apps/api/scripts/pilot-facts.ts ana@example.com beto@example.com
```

No se ejecutó aquí, para no leer una base persistente.

### Access token

Problema. El token no llevaba `exp`. El texto de logout-all ya decía 15 minutos. Los tests fijaban la ausencia de expiración.

Solución. `ACCESS_TOKEN_TTL` es `15m`. El refresh no cambió: sigue hasta revocarse, con la cookie de unos 400 días. `fetchAuthed` reintenta una vez ante 401 en diagnóstico y en el recorrido. Un segundo 401 se devuelve. No hay bucle. Logout sigue invalidando el refresh, no el access ya emitido, hasta que ese access venza. Eso es el contrato que ya estaba escrito.

## 4. Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `npx vitest run` de territorio, catálogo, piloto, auth lifetime, intervención, diseño y revisión, en `apps/api` | 7 archivos, 79 tests, todos pasaron |
| `npm run test:domain` en `apps/api` | 39 archivos, 322 tests, todos pasaron. No incluye piloto ni auth lifetime, que se corrieron aparte |
| `npx vitest run` de matriz, continuación del diagnóstico, panel y `fetch-authed`, en `apps/web` | 4 archivos, 11 tests, todos pasaron |
| `npx tsc -p tsconfig.json --noEmit` en `apps/api` y en `apps/web` | Sin errores |

No se ejecutó `test:http`, `test:acceptance` ni Playwright. Esos caminos tocan o crean bases. No se usó el navegador. No se declara verde lo que no se corrió.

## 5. Problemas encontrados

El trabajo previo del ciclo de miembro sigue sin commit. Estas correcciones están encima. No se revirtieron archivos ajenos.

`auth-session-contract.test.ts` ahora espera `exp`. No se corrió porque abre base.

No hay lint configurado como script único que se haya lanzado. El chequeo de tipos sí pasó.

## 6. Bloqueado a propósito

- Texto de términos y consentimiento. Hace falta producto o asesoría. No se inventó.
- Promesa pública, precios y beneficios del seed. Hace falta la frase del piloto.
- Informe de fortalezas, pesos, semillas, propósito, IKIGAI, ajustes automáticos, Mercado Pago.

## 7. Riesgos antes del piloto

Los dos recorridos ya no se pisan en el cálculo nuevo. Una sesión vieja que haya dejado el módulo compartido en `COMPLETE` igual puede retomar las preguntas que falten. Eso no está visto en un navegador. Conviene una pasada manual: Salud hasta el final del ámbito, luego Mentalidad, y comprobar que R19 y R20 se preguntan.

El access de 15 minutos depende del refresh. En diagnóstico y recorrido el reintento está probado con fetch simulado, no en el browser.

El script de métricas distingue actividad de avance. Un `PENDING` cuenta como registro de estado, no como acción hecha. Una revisión con `applied: false` no entra en el conteo de revisiones aplicadas.

## 8. Siguiente etapa

1. Pasada manual de los dos ámbitos en una cuenta nueva.
2. Correr el script sobre las cuentas del piloto cuando existan.
3. No abrir interpretaciones ni pesos hasta la reunión con Rafa.
4. Recién entonces, la invitación y, si hace falta, el texto legal de consentimiento.
