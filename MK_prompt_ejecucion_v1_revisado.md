---

name: Prompt ejecución formulario v1

overview: "HISTÓRICO, 7 oct 2026. No ejecutar. El antecedente pedía implementar el recorrido de miembro basado solo en formulario v1: inventario y catálogo formulario-completo@1, captura con excepciones, puntajes fieles por instrumento, alertas del formulario con efecto en servidor, HdRP-v1 con estados de dirección, ficha IAD-MK 0.1 borrador, prioridad, plan conectado con guías propias, ejecución, revisión aplicada e integridad. Excluye la matriz v2 del recorrido. Reemplaza el plan revisión 3 donde sea incompatible."

todos:

  - id: e0-fixtures

    content: "Antes de probar: base de desarrollo verificada, accountKind FIXTURE y supresión de efectos externos; fixtures creados con esa identidad desde el inicio"

    status: pending

  - id: e1-inventario

    content: "Entrega 1: extract_formulario_v1.py, formulario-completo@1.json e inventario, DECISIONES.md, ensureFormularioCompleto, migraciones de Question/Response/MasterProfile/User, FORMULARIO_COBERTURA.md, prueba de aislamiento v2"

    status: pending

  - id: e1-captura

    content: "Entrega 1: player con tipos nuevos (opción con valor, múltiple con máximo, fila IKIGAI, número con unidad), excepciones tipadas, autoguardado con estados, ResponseRevision, devolución y práctica por bloque, atestación 18+"

    status: pending

  - id: e1-puntajes

    content: "Entrega 1: FormularioReading, formulario/score.ts por instrumento, formulario/signals.ts con todas las alertas, corrección del rótulo de factor N, pruebas de dominio y fixture que completa el formulario"

    status: pending

  - id: e2-hdrp-iad

    content: "Entrega 2: HdRP-v1 sobre PurposeRevision con directionStatus, firma exacta, export, AlignmentCheckpoint e iad.ts, placa de Inicio como Alineación declarada"

    status: pending

  - id: e2-prioridad-plan

    content: "Entrega 2: PriorityProposal con basis, MemberContext con zona, PlanVersion con vínculo, 11 guías completas con HelpArtifact, restricciones en servidor (restricciones@1)"

    status: pending

  - id: e3-ejecucion

    content: "Entrega 3: Hoy, PlannedOpportunity y horizonte, ActionRecord extendido, ChangeObservation, revisión preview/apply idempotente con base de observaciones, retorno, compatibilidad de writers antiguos, closeWeek como adaptador, heredados"

    status: pending

  - id: e3-sim

    content: "Entrega 3: SimulationClock y endpoints ADMIN, fixtures protegidos desde Entrega 1, JourneyEvent sin contenido, e2e formulario-full-journey y formulario-exploring"

    status: pending

  - id: e4-cierre

    content: "Entrega 4: casos críticos, móvil y accesibilidad, permisos, FORMULARIO_REVISION_MANUAL.md, MK_COPY_PUBLICO_PROPUESTO.md, MK_PRUEBA_5_PERSONAS.md, DESIGN.md, informe final"

    status: pending

isProject: false

---

# Prompt de ejecución: Maximus Kratos desde formulario v1

**Histórico. 7 oct 2026.** No es la instrucción vigente. Para trabajar ahora: [AGENTS.md](AGENTS.md) dice cómo ejecutar, [DESIGN.md](DESIGN.md) es el diseño y [PRODUCTO_VIABLE.md](PRODUCTO_VIABLE.md) es el ciclo viable. El texto que sigue se conserva como antecedente. No cambies permisos, metodología ni código para hacer coincidir la aplicación con este prompt.

En su fecha, este prompt se presentó como fuente única y dijo que ganaba al plan de revisión 3. Eso ya no ordena el trabajo. También pedía el formulario antes del primer plan, una navegación con Perfil, Ruta y Hoy, índices de alineación y permisos de administración distintos de los acuerdos posteriores. Esas declaraciones no son instrucciones actuales. El cuestionario no es obligatorio para tener un plan. El inicio es el cruce de cuatro ámbitos por tres fases.

Las referencias de código, comandos y hechos del repositorio provienen de la inspección reportada en el plan. Esta revisión documental no constituye una nueva ejecución de sus pruebas ni una inspección directa del repositorio.

Entonces se decía: si choca con el plan «Recorrido completo miembro (revisión 3)», gana este documento. Del plan anterior se conserva el núcleo de integridad (§12). Se descarta todo uso de la matriz v2.

## 0. Rol, resultado y forma de trabajo

- Actúas como responsable de producto e ingeniería. Implementas, no entregas otro plan. Después de una inspección breve de las reglas `.cursor/rules/*`, empiezas a escribir código.

- **Resultado:** una persona nueva recorre formulario completo por bloques, entiende sus respuestas y puntajes, revisa su Hoja de Ruta de Propósito (HdRP) con una dirección explorando, provisional o confirmada, elige una prioridad, prepara y confirma un plan viable, ejecuta acciones, registra lo ocurrido y aplica una revisión que cambia el plan futuro.

- **Avance:** `MK_IMPLEMENTATION_PROGRESS.md` en la raíz (no ignorado; `docs/` sí está en `.gitignore`). Agrega una entrada por entrega con los cambios, las migraciones, las pruebas ejecutadas con su resultado real y lo pendiente. No hagas commits, push ni deploy salvo que se pida. El árbol tiene cambios ajenos sin commitear: no los reviertas.

- **Reglas del repo:** `no-dashes-in-copy` (sin `-`, `–` ni `—` en la copy en español), `internal-docs-voice` para los documentos internos, `mk-ui-contract` y `mk-member-ui` para la UI. Español neutro con tú en la UI. Sin voseo.

- **Alcance:** completa el ciclo especificado sin abrir más módulos, subsistemas o índices. Los nombres de modelos describen contratos; reutiliza una entidad compatible antes de crear otra. Una decisión rutinaria reversible se resuelve y documenta, sin detener toda la entrega.

## 1. Precedencia y lo que reemplaza

Lo de esta sección es la precedencia que el prompt se daba el 7 oct 2026. No es la precedencia actual.

- **Fuente única** del cuestionario, sus instrumentos y sus ejercicios: `260529-FORMULARIOS-X-PASO.xlsx`.

- **Contexto secundario:** `docs/philosophy/260619-KM-MARCO-RECTOR.md`, solo donde sea compatible con el formulario.

- **Promesas a cumplir con honestidad:** el copy público en `apps/web/lib/landing-copy.ts`, `apps/web/lib/landing-faq.ts`, `apps/web/components/pages/sistema-content.tsx`, `apps/web/components/pages/manifiesto-content.tsx`, `apps/web/lib/mk-system.ts` y `apps/web/lib/marco-central*.ts`.

- **Reemplaza decisiones previas:**

  - el acuerdo de usar las 8 preguntas de riesgo v2 con `evaluateSafety`;

  - la biblioteca de ayudas basada en actividades v2;

  - la evaluación v2 opcional por ámbito;

  - los «doce componentes» con claves de `08_PROPOSITO`;

  - la idea de un recorrido sin el formulario.

- **Se conserva:** la política de acceso vigente (`apps/api/src/auth/member-access.ts`; el plan reporta acceso de cuentas autenticadas), la firma exacta, versiones, oportunidades, idempotencia, transiciones, fixtures, reloj de dominio, exclusión de correo y preservación de datos en migraciones. Verifica roles y elegibilidad actuales; exigir el formulario a todos los miembros no autoriza abrir permisos, cambiar suscripciones o habilitar acceso público.

## 2. Aislamiento de la matriz v2 (obligatorio y verificable)

- El recorrido de miembros no importa ni lee `@mk/matrix-engine`, `@mk/experience-engine`, `packages/matrix-engine/definitions/*.json`, `MATRIZ_MAESTRA_MK_v2_FOCO.xlsx`, `MATRIZ_MAESTRA_MK_v1.xlsx`, preguntas `D-*` ni `P-PRO-*`, `evaluateSafety`, `runAssessment`, planes, actividades, reglas, métricas, módulos de propósito, textos ni fixtures de v2.

- Según la inspección reportada, `apps/api/src/journey`, `apps/api/src/diagnostic` y `packages/database/src/formularios-previos.ts` no importaban v2. Compruébalo en el checkout actual y mantén ese aislamiento.

- No confundas la matriz excluida con el nombre de una hoja: el Excel de Formularios por paso contiene `E-PER-HdRP-v2`, que sigue siendo parte del inventario de la fuente del formulario. Para el nuevo producto se elige expresamente la plantilla `E-PER-HdRP-v1`; no se usa la otra para generar una síntesis nueva. Se conservan sus referencias y los documentos históricos exactos. Los sufijos de esas hojas no autorizan el uso de la matriz maestra v2.

- Agrega `apps/api/test/instrumentos-isolation.test.ts`. Comprueba imports, reexportaciones, carga de definiciones y llamadas efectivas desde las entradas del nuevo recorrido, incluidos helpers compartidos, servicios inyectados y rutas web. Buscar cadenas en unos directorios es una comprobación auxiliar, no prueba suficiente de aislamiento. La prueba no falla por comentarios que describen la exclusión, ni por el Lab separado; sí falla por una dependencia prohibida usada indirectamente. Verifica también que el catálogo y las guías indiquen su procedencia permitida. Incluye un caso de control que detecte una dependencia prohibida introducida a través de un helper.

- El Lab (`apps/api/src/lab`, `/admin/lab`) y sus datos quedan intactos y separados. No los borres ni reinterpretes sus datos como respuestas del formulario.

- Los tres pilares (Espíritu, Mente y Cuerpo) y los cuatro ámbitos (Mentalidad, Relaciones, Finanzas y Salud física) siguen como mapa conceptual. Sus doce intersecciones no reciben puntaje.

## 3. Hechos del Excel ya verificados (vuelve a comprobarlos al extraer)

Hojas: `RESUMEN`, `E-AUD-001`, `F-RAD-001`, `F-RAD-002`, `F-RAD-003`, `E-PER-000`, `E-PER-HdRP-v2`, `E-PER-HdRP-v1`, `NO BORRAR` (listas de opciones) y `Hoja 6`.

- **Auditoría** (`E-AUD-001`):

  - secciones 1 a 5 con 5, 5, 5, 4 y 4 ítems, filas 6–10, 16–20, 26–30, 37–40 y 46–49, escala 1 a 5;

  - subtotales en `D11`, `D21`, `D32`, `D41` y `D50`; RESUMEN `C15 = SUM`, de 23 a 115;

  - bandas de RESUMEN `C16`: menos de 46, menos de 69, menos de 92, hasta 115;

  - la sección 6 «Desarrollo y sentido» tiene 10 ítems (24 a 33, filas 56–68, escala Brooks 1 a 5 en `A53`) y no entra a 115;

  - el ítem 15 tiene un detalle condicional en `C31` («si no selecciona 5, indique por qué»);

  - RESUMEN `D15` promedia porcentajes de secciones de distinto tamaño.

- **Alertas de la auditoría:** filas 6–20 `=1`; filas 26–30 `<=2`; filas 37–49 `=2` (literal del Excel). [apps/api/src/diagnostic/excel-score.ts](apps/api/src/diagnostic/excel-score.ts) L116 ya usa `<=2` en las secciones 3, 4 y 5.

- **F-RAD-001:** 7 secciones (filas 6–12, 18–28, 34–42, 48–55, 61–65, 74–79 y la 7 hasta la fila 92).

  - Alertas literales: `F10` grasa `>=20%`; `F18`, `F20`, `F22`, `F24` y `F27` (enfermedad, lesión, medicación, dolor, indicación médica) distinto de «NO»; `F34`/`F35` «Desordenada»; `F36` consumo distinto de «no»; `F38` «Ansiedad»; `F48` actividad «NO»; `F49` «Ninguna»; `F52` «< 3 veces»; `F53` «< 30 min.»; `F54`/`F55`; `F61` sueño `"< 6"` o `"< 4"`; `F62` calidad baja o media; `F63` despierta cansado; `F64` estrés alto o muy alto; `F65` fuentes de estrés distintas de «No tengo»; `F74` a `F78` percepción corporal.

  - Discrepancias de texto: `C61` dice «> 6 Hrs», pero la fórmula alerta con menos de 6. `C34` dice «distinto de No», pero la fórmula alerta con «Desordenada». `C10` dice «si no la sabe, requiere tomársela».

- **F-RAD-002:** 4 secciones de 3 ítems de 1 a 5 (filas 6–8, 16–18, 25–27 y 34–36).

  - Alertas `<=2` en cada ítem.

  - Bandas por sección en `D10`, `D20`, `D29` y `D38`. La primera no está transcrita entera: corte `<=7` con un texto que habla de «lazos familiares» aunque la sección es pareja; los cortes siguientes y el resto del texto se verifican al extraer.

  - Total en `D40`, de 12 a 60, con banda en `D41` (`<=28`, `<=48`, `<=60`).

- **F-RAD-003:** 4 secciones cuantitativas de 3 ítems (filas 7–9, 17–19, 26–28 y 35–37), alertas `<=2`, bandas por sección `<=7`, `<=11`, `<=15` (REESTRUCTURACIÓN, CALIBRACIÓN, FLUIDO), total en `D41` (12 a 60) con banda en `D42` (`<=24`, `<=44`, `<=60`). Más 3 preguntas de construcción y proyección (secciones 5 a 7), sin puntaje.

- **E-PER-000:**

  - origen, filas de la 1 a la 14;

  - visión, filas 28–34: 7 preguntas, con el martes ordinario en la fila 30 y la frase central en la 33;

  - valores, filas 40–54: hasta 10 de la lista `NO BORRAR!E3:E32`, el valor que defendería, 3 esenciales y por qué;

  - estándares, filas 60–66, con 5 fuentes (trascendencia, familia, amistad, trabajo y otra);

  - identidad, filas 73–86: 10 ítems con 4 opciones (`NO BORRAR!F3:F6`, valores 1 a 4); `D87` suma de 10 a 40; los cortes de `D88` son `<18`, `<26`, `<34` y `>35`, así que 34 y 35 no tienen clase; `F87` promedia solo `F82:F86`;

  - dificultades, filas 93–157: 45 ítems PR1–9, ER1–9, PY1–9, D1–9 e IN1–9 (`NO BORRAR!O11:O13`, con SÍ = 2, MÁS O MENOS = 1, NO = 0, fórmula `H94`); grupos `H93`, `H106`, `H119`, `H132` y `H145` (0 a 18 cada uno); textos de grupo en `D161`, `D165`, `D169`, `D173` y `D177` con cortes propios; textos por ámbito de 3 ítems en `D162` a `D180`; `G177` es la interferencia total (0 a 72); `F181` suma los cinco (0 a 90); `D181` mezcla los dos; RESUMEN `E58` declara máximo 40;

  - personalidad, filas 187–205: 15 ítems; los inversos se calculan como `6 - x` en A2, R2, E2, M2 y N2 (columna H); la media por factor está en `H186`, `H190`, `H194`, `H198` y `H202`; las etiquetas en `I186` a `I202` usan los cortes `>=4` y `<=2.4`; en el factor N, un puntaje alto indica mayor reactividad («Alta reactividad emocional»); `D206` promedia las respuestas crudas sin invertir y no tiene sentido;

  - IKIGAI, filas 218–260: cuatro campos (Pasión 220–224, Vocación 227–231, Misión 234–238, Profesión 241–245); en cada fila se elige un «ámbito» (columna C), opciones dependientes mediante `ArrayFormula` en H (`TRANSPOSE(INDIRECT(SWITCH(...)))` sobre `NO BORRAR!P10:W30`) y la respuesta específica en E; Profesión cuenta su avance sobre la columna D (`F241`), pero el cruce `B251:E255` lee la columna E; la tabla de valoración de la fila 258 está vacía, sin escala; la plantilla del propósito está en `A260`;

  - huella, filas 266–277: 10 preguntas.

- **E-PER-HdRP-v1:**

  - Espíritu: identidad (`C5 = #REF!`, rota), visión (`C6 = D33`), valores (`C12` a `C14` = `D51` a `D53`), estándar (`C15 = D62`), horas de sombra (fila 21) e IKIGAI (`C27` a `C30` leen la fila 258, que está vacía; `C30` lee `F258`, una columna equivocada);

  - Mente: compromisos relacionales en horas (filas 38–40) y financieros (filas 45–46);

  - Cuerpo: entrenamiento (`D52 = F-RAD-001!D51`; filas 53–55) y nutrición (fila 60);

  - cronograma de 12 meses (filas 65–69: 40 días, 3, 6, 9 y 12 meses).

- **Índice de alineación:** no hay fórmula en el Excel ni en el marco. `docs/phase-2/MK_DECISIONS.md` L132 lo menciona en una lista sin firma.

- **Código actual relacionado:**

  - `hdrp-contract.ts` construye desde `E-PER-HdRP-v2` (`D41`, plan financiero) y rotula el quinto factor como «Estabilidad» (`FACTORS`, L60), aunque su puntaje mide reactividad;

  - `completeDiagnostic` (`apps/api/src/diagnostic/diagnostic.service.ts`) crea `MasterProfile` con un motor viejo de dimensiones y un arquetipo derivado;

  - el registro (`apps/web/app/register/page.tsx`, `apps/api/src/auth/dto`) no comprueba la edad, aunque la privacidad (`apps/web/lib/legal-content.ts` L130) dice «mayores de 18».

## 4. Decisiones metodológicas para esta entrega

Documéntalas en `packages/database/definitions/formulario-completo.DECISIONES.md`, junto a la definición. Cada una lleva su fuente, la alternativa descartada y su estado: «adaptación de producto versionada», pendiente de revisión por Rafa. No bloquean la implementación.

1. **Auditoría:** el dato principal es el total nativo de 23 a 115. Las bandas de `C16` se muestran como «categorías del formulario», con descripción de respuestas y necesidades, sin «dominante», «inferior» ni «incapaz». `D15` se guarda con su nombre y no se muestra como índice.

2. **Alertas de la auditoría:** la trazabilidad conserva el `=2` literal de las secciones 4 y 5. El producto usa `<=2` como adaptación `alertas-aud@1`. Se muestra como «Conviene revisar esta respuesta», sin bloqueo.

3. **Desarrollo y sentido:** se muestran las 10 respuestas con una lectura descriptiva separada, sin bandas y sin sumar a 115.

4. **Identidad:** total de 10 a 40, calculable solo con 10 de 10 respuestas, y devolución descriptiva por bloque A a E. La categoría formal queda «en definición»: nunca `FALSE` ni una banda oculta. Las candidatas (`D88` del Excel y 10–18, 19–26, 27–34, 35–40 del marco) se guardan solo en la trazabilidad.

5. **Dificultades:** 45 ítems, 5 totales de 0 a 18 y textos por ámbito. Se presentan separadas la interferencia (PR, ER, PY, D) y los recursos de integración (IN). No se usan `F181`, `D181` ni el máximo 40, ni el instrumento de 10 ítems del marco. Los textos de grupo del Excel se guardan; en la UI se muestran descriptores neutros versionados (`dificultades-descriptores@1`), porque los originales usan etiquetas como «DOMINANTE».

6. **Personalidad:** cada factor con sus 3 ítems y sus inversos; la lectura de un factor requiere sus 3 respuestas. El quinto factor se rotula «Sensibilidad emocional (frente a calma)», porque un puntaje mayor indica mayor reactividad; se corrige el rótulo en `hdrp-contract.ts`. Sin `#DIV/0!`, sin ceros, sin arquetipo y sin promedio global (`D206` y `H206` no se usan).

7. **IKIGAI:**

  - Se capturan el ámbito, la opción auxiliar (resuelta en el servidor desde `NO BORRAR`, reproduciendo el `SWITCH`) y la respuesta específica de cada fila, en los cuatro campos.

  - Profesión toma la respuesta específica de la columna E y registra la discrepancia de `F241`.

  - Como la escala de valoración de la fila 258 no existe, el cruce se implementa como relación explícita: para cada actividad, la persona marca en qué otros campos la reconoce. Es la adaptación `ikigai-cruce@1`, sin números, suma ni ranking. La valoración numérica queda pendiente.

  - La plantilla de `A260` es un borrador editable. La ausencia de un cruce perfecto es una salida válida.

8. **Sueño:** se conserva la fórmula (menos de 6 horas da alerta) y se documenta que el texto de `C61` es inverso. No hay límite médico: la alerta pide una aclaración y adapta la planificación.

9. **HdRP:**

  - `E-PER-HdRP-v1` es la plantilla de integración, con sus referencias rotas reparadas de forma explícita. Identidad toma el total y la devolución de E-PER-005. IKIGAI toma las actividades y la hipótesis elegida, en lugar de la fila 258. Profesión toma la columna E.

  - Las firmas existentes construidas desde v2 se siguen leyendo exactas.

  - El cronograma de 12 meses es una referencia adaptable, no una promesa.

  - Entrenamiento y nutrición son compromisos declarados por la persona, sujetos a las restricciones del §8.

10. **Arquetipo:** no se calcula. `MasterProfile.archetypePrimary` pasa a nullable en una migración aditiva, y para las sesiones `formulario-completo` queda `null`. La elección simbólica de E-PER-001, ítem 3, es una respuesta de la persona, no una clasificación.

11. **Elegibilidad:** atestación «Confirmo que tengo 18 años o más», guardada en `User.adultAttestedAt` antes de iniciar el formulario. Si la edad declarada en F-RAD-001 es menor de 18, se detiene la captura de módulos sensibles y se muestra un mensaje; no se infiere la edad de ningún texto.

La comprobación de elegibilidad vive también en el servidor, antes de crear respuestas sensibles, no solo en un checkbox. Si aparece una contradicción de edad, no se oculta el dato ni se restaura acceso desmarcando una alerta. Aplica el procedimiento de privacidad vigente para los datos ya recogidos, sin eliminar registros indiscriminadamente desde el player.

## 5. Recorrido común y estados

Orden: llegada (explicación del proceso y motivo, que solo contextualiza), formulario por bloques, devolución por bloque y final, HdRP con estado de dirección, ficha IAD opcional, prioridad, contexto operativo, plan, Hoy y revisión.

- **Bloques** (módulos de `DiagnosticVersion`): E-AUD 1 a 5 (uno por sección), E-AUD 6, F-RAD-001 1 a 7, F-RAD-002 1 a 4, F-RAD-003 cuantitativo y proyección, y E-PER-001 a 009 (dificultades dividida en A a E). Orden libre entre bloques, con un orden recomendado.

- **Estados por ítem:** sin responder (abierto), respuesta, y las excepciones `UNKNOWN` (No sé), `NOT_APPLICABLE` (No aplica, con razón o condición), `DECLINED` (Prefiero no responder) y `PENDING` (Pendiente, que mantiene el recorrido abierto). Una condición no cumplida (`@sigue`) produce `NOT_APPLICABLE` con procedencia `CONDITION`.

- **Condiciones con tres resultados:** aplicable, no aplicable o todavía desconocida. Si la respuesta padre está vacía, pendiente o es desconocida, no marques automáticamente el detalle como no aplicable. Ofrece la excepción explícita que corresponda. Si cambia el padre, recalcula sus dependientes en servidor: conserva respuestas anteriores en el historial y no uses una respuesta hija obsoleta para puntuar o restringir. Reactivar una condición devuelve el detalle al estado que realmente corresponda.

- **Recorrido terminado:** cada ítem aplicable tiene respuesta o una excepción distinta de `PENDING`. Puede quedar terminado con puntajes no calculables. Nunca se muestra «instrumento completo» si faltan respuestas puntuables.

- **Excepciones por tipo:** los datos sensibles o desconocidos admiten `UNKNOWN`, `DECLINED` y `NOT_APPLICABLE` (linaje, pareja, grasa corporal, religión y similares). La definición declara qué excepciones admite cada ítem.

- **Durante el formulario, al cerrar cada bloque:** una síntesis editable del bloque, respuestas que conviene reconsiderar, una idea o decisión que guardar (`UserModuleProgress.notes`) y una práctica breve compatible (desde las guías del §10, sin activar un plan). Las orientaciones por alerta se muestran en cuanto aparecen.

Guardar una idea o hacer la práctica es opcional y no crea nuevos requisitos para cerrar el bloque. Muestra qué falta y permite continuar después. No prometas una duración del cuestionario que no se haya observado; diferencia avance de respuestas y trabajo reflexivo. Una excepción no se presenta como una respuesta sustantiva conseguida.

- **Después:** Inicio (Hoy) muestra la próxima acción o la revisión sugerida. El formulario queda accesible para actualizar. Un plan heredado se sigue registrando mientras se completa el formulario.

- **Primer plan de un miembro nuevo:** el servidor exige recorrido del formulario terminado con una versión y un snapshot identificables, síntesis revisada por la persona y un vínculo viable. Son válidos `EXPLORANDO`, `PROVISIONAL` y `CONFIRMADO_POR_USUARIO`; no se exige IAD calculable, firma de un propósito definitivo ni todos los puntajes completos. Comprueba el mismo contrato en creación, activación y adaptadores para impedir un bypass por otro endpoint. Editar respuestas después no borra el hito histórico ni vuelve a bloquear globalmente un plan existente; las restricciones relevantes sí se reevaluarán.

## 6. Inventario, definición y cobertura

- **Extracción:** `scripts/formulario/extract_formulario_v1.py` con el intérprete disponible en el proyecto y openpyxl, verificando soporte de `ArrayFormula` y validaciones. Genera `packages/database/definitions/formulario-completo@1.json` y `packages/database/definitions/formulario-completo@1.inventory.json`. El script solo corre en desarrollo; el runtime lee el JSON versionado. Guarda el sha256 del XLSX original. Para la definición, calcula `definitionSha256` sobre una serialización canónica documentada que excluya el propio campo de hash y metadatos variables; no intentes incluir el hash dentro de los bytes que ese mismo hash debe representar. Usa esa misma convención al guardar y comprobar el catálogo.

- **Cada ítem del inventario tiene:**

  - `id` estable `formulario-v1:<HOJA>!R<fila>`, más un sufijo `#<n>` cuando una pregunta ocupa varias filas o se repite;

  - `sheet`, `cells`, `block`, `textOriginal`, `observationOriginal` y `textUi` (solo si se adapta, con `adaptationId`);

  - `responseType`, `options` (con valor y fuente de la validación), `scale`, `polarity` (`DIRECT` o `INVERSE`);

  - `appliesWhen`, `detailOf`, `required` y `allowedExceptions`;

  - `instrument`, `formula` (texto original), `alerts` (fórmula original y regla de producto) y `role`. `role` vale `QUESTION`, `DETAIL`, `INSTRUCTION`, `CALCULATED`, `AUXILIARY`, `SUMMARY` o `DUPLICATE`.

- **Persistencia:**

  - `ensureFormularioCompleto(prisma)` en `packages/database/src/formulario-completo.ts`, con el patrón de `ensureFormulariosXPaso`, crea `DiagnosticVersion { version: 'formulario-completo@1', definitionRef: 'formulario-completo', definitionSha256, isActive: true }` con sus módulos, preguntas y opciones, y desactiva `formularios-x-paso` para sesiones nuevas sin tocar las suyas.

  - Sembrar dos veces es idempotente. Si una versión existente tiene otro hash, falla con una discrepancia explícita; no reescribas preguntas u opciones que ya tienen respuestas. Una definición distinta necesita una versión nueva y equivalencias revisadas. Los IDs no dependen del orden de selección de valores o actividades.

  - Se registra en `DiagnosticCatalogService` (`apps/api/src/diagnostic/diagnostic-catalog.service.ts` L28).

  - Columnas aditivas: `Question.sourceRef`, `Question.instrument`, `Question.polarity`, `Question.allowedExceptions String[]` y `Question.appliesWhen Json?`.

- **Cobertura:** `scripts/formulario/coverage-report.ts` produce `FORMULARIO_COBERTURA.md` en la raíz con fuente, ID, bloque o pantalla, prueba o comprobación y estado. Toda fila no presentada lleva su razón (calculada, auxiliar, duplicada, instrucción o condición). Una prueba compara el inventario con el catálogo en la base y falla si un `QUESTION` o un `DETAIL` no tiene pregunta.

La cobertura necesita además una revisión contra el XLSX original: comparar dos archivos generados por el mismo extractor no detecta una pregunta que ambos omitieron. Usa un manifiesto de celdas y bloques esperados revisado contra la fuente, con las cantidades verificadas por instrumento y los detalles condicionales. No uses el aproximado de 230 como total obligatorio. Comprueba que los elementos marcados como duplicados o auxiliares no contengan una pregunta única descartada.

- **Elementos fáciles de perder:** martes ordinario, experiencias valiosas, 6 meses, hasta 10 valores más 3 esenciales y razones, conductas por valor, cinco fuentes de estándares (adaptables, con registro), 10 ítems de identidad, 45 de dificultades, 15 de personalidad con inversos, IKIGAI completo y las 10 preguntas de huella.

## 7. Captura y player

- Se reutiliza el player existente (`apps/web/components/diagnostico/*`: `DiagnosticPlayer`, `QuestionCard`, `options/*`, capturas `@lineas`, `@medidas`, `@horas`, `@sigue` en `apps/api/src/diagnostic/question-capture.ts`).

- **Tipos nuevos:**

  - opción con valor numérico explícito (identidad 1 a 4; dificultades 2/1/0);

  - selección múltiple con máximo, para valores (10) y otras listas de `NO BORRAR`;

  - fila IKIGAI de ámbito, opción dependiente y respuesta específica, más la relación del cruce;

  - número con unidad (altura, peso, porcentaje);

  - lista desde `NO BORRAR` para F-RAD-001.

- **Excepciones:** `Response.exception` (enum `ResponseException`: `UNKNOWN`, `NOT_APPLICABLE`, `DECLINED`, `PENDING`), más `exceptionReason` y `exceptionSource` (`USER` o `CONDITION`), aditivas. `skipped` conserva su significado para las filas antiguas.

El servidor valida opciones, rangos de escala, máximos, selección de los tres valores desde la lista elegida, unidades y condiciones. Una respuesta y una excepción vigente son mutuamente excluyentes; cambiar entre ellas conserva el historial. La UI de porcentaje usa 0 a 100: 20 significa 20 %. El Excel almacena `D10` como fracción porcentual: 0,20 representa ese mismo 20 %. Convierte explícitamente antes de reproducir su fórmula, sin confundir 0,20 % con 20 % ni diagnosticar riesgo clínico por esa cifra. Valida números finitos y unidades; desconocido no es cero.

- **Autoguardado:** estados visibles «guardando», «guardado», «error» y «conflicto». Un error no muestra «guardado» ni descarta el texto. El conflicto conserva las dos versiones recuperables. Respuestas fuera de orden se rechazan con `draftVersion` (patrón de `apps/web/lib/ikigai-ui/autosave.ts`). Guardar y salir y retomar ya existen: se verifican sobre la versión nueva, en móvil y con la red intermitente.

- **Editar después de terminar:** `ResponseRevision { responseId, previous, changedAt, effectiveAt }` guarda el historial. Una edición genera una lectura nueva (§8) y nunca reescribe la inicial.

La escritura de la respuesta, su revisión, el control de versión y la invalidación de dependencias relevantes son consistentes. Si el perfil requiere solicitar una lectura nueva, indica qué cambió y ofrece actualizarla; una lectura anterior sigue siendo una foto fechada, no el estado actual. Las alertas operativas se actualizan al guardar, sin esperar esa solicitud ni el cierre del formulario. Si esa evaluación falla, no presentes el estado anterior como vigente ni permitas confirmar la propuesta afectada como si no hubiera restricciones; conserva la respuesta, muestra el estado pendiente y ofrece reintentar o una alternativa independiente.

- Los ejemplos orientan y no se guardan como respuesta sin una elección explícita. Las observaciones del facilitador no se muestran como diagnóstico.

## 8. Puntajes, lecturas y alertas

- **Lecturas:** `FormularioReading { id, userId, sessionId, scoringVersion: 'formulario-score@1', kind INITIAL | UPDATE, responsesSnapshot, inputsHash, results, alerts, effectiveAt, createdAt }`.

  - Se crea al terminar el recorrido y en cada actualización pedida.

  - La lectura inicial no se sobrescribe nunca.

  - `DiagnosticFormResult` sigue guardando las lecturas de `formularios-x-paso`.

- **Función pura** `apps/api/src/instrumentos/score.ts`. Por instrumento devuelve `{ value, min, max, coverage { answered, required }, calculable, parts, descriptor, sourceRefs, discrepancies }`:

  - auditoría: total solo con 23 de 23 y bandas de `C16` sobre ese total completo. Un subtotal requiere todos los ítems de su sección. Si se muestra una suma parcial, se etiqueta como parcial, sin categoría ni proyección al máximo; con cero respuestas su valor es `null`, nunca 0;

  - desarrollo y sentido: las 10 respuestas y un descriptor;

  - relaciones: 4 secciones de 3 ítems, total de 12 a 60 y bandas de `D41`; calculable solo con 12 de 12;

  - finanzas: igual, con las bandas de `D42`;

  - identidad: total de 10 a 40 y devolución por bloque;

  - dificultades: 5 grupos y 15 ámbitos;

  - personalidad: 5 factores;

  - IKIGAI: actividades y cruce;

  - F-RAD-001: medidas con unidades y declaraciones, sin índice.

- **Reglas generales:** un faltante nunca es cero ni la media. `NOT_APPLICABLE` no renormaliza. Nunca se puntúa el texto libre por su extensión ni con un modelo de lenguaje.

- **Alertas del formulario:** `apps/api/src/instrumentos/signals.ts` inventaría todas las del §3. Para cada señal guarda: pregunta y respuesta de origen, regla y versión, motivo comprensible, ámbito o acciones afectadas, información pendiente, alternativas y estado vigente. «No evaluado» o «prefiero no responder» no equivalen a «sin restricciones».

La señal nativa y la restricción operativa son salidas separadas. Se recalculan al guardar una respuesta, una excepción o una aclaración. No toda señal del formulario impide una acción: una percepción corporal, un hábito o una valoración baja pueden pedir atención sin probar peligro ni incapacidad.

- **Restricciones de producto** (`apps/api/src/instrumentos/restrictions.ts`, versión `restricciones@1`). Se aplican en el servidor al confirmar una propuesta, activar un paso o solicitar ayuda para iniciarlo, sobre las etiquetas de contenido de las guías y acciones (`PHYSICAL_EXERTION`, `DIET`, `SUPPLEMENT`, `MEDICATION`, `CONFRONTATION`, `FINANCIAL_DECISION`, `DEBT`, `INVESTMENT`). La app orienta el inicio; no puede controlar una conducta fuera de ella ni debe ocultar su registro posterior:

  - Enfermedad, lesión, medicación, dolor o indicación médica (`F18` a `F27`): pide la aclaración pertinente y restringe recomendaciones que puedan contradecir límites actuales. «Ha tenido lesiones» es un antecedente, no prueba de una restricción vigente ni motivo para bloquear toda acción `PHYSICAL_EXERTION`. Ante información necesaria desconocida, ofrece preparación o una alternativa independiente. No generes prescripciones de intensidad, dietas clínicas, suplementos o cambios de medicación. Organizar un cuidado ya indicado y registrar una práctica elegida compatible no equivalen a prescribirla.

  - Datos físicos desconocidos: no se fuerzan. Antes de una acción que dependa de ellos se pide solo la aclaración necesaria o se ofrece una alternativa independiente.

  - Relaciones: una acción con `CONFRONTATION` exige una aclaración breve de viabilidad y seguridad (política nueva `aclaracion-conversacion@1`). Si la persona declara inseguridad, no se ofrece confrontación y se muestra orientación de apoyo.

  - Finanzas: una acción con `FINANCIAL_DECISION`, `DEBT` o `INVESTMENT` exige aclarar obligaciones esenciales. Nunca se propone una inversión personalizada ni endeudarse para seguir la ruta.

  - Sueño y estrés: se adapta la planificación y se pide aclaración.

- **Reevaluación:** si cambia una respuesta relevante, se reevalúan las acciones futuras y las ayudas guardadas, y se conservan los registros pasados. La propuesta incompatible se marca pendiente de adaptación y no sigue apareciendo como el siguiente paso recomendado. Registrar algo que ya ocurrió nunca se restringe, incluso si es incompatible con la recomendación o ocurrió antes de completar el formulario. El registro no reactiva la acción. Una advertencia que deja confirmar o iniciar mediante la app una propuesta incompatible no basta: el servidor responde 409 `RESTRICTED` con las alternativas.

Las etiquetas de contenido provienen de la guía y de una caracterización operativa validada en servidor; omitir una etiqueta en el payload del cliente no elimina una restricción. Cada bloqueo explica la incompatibilidad concreta y qué puede hacerse, sin afirmar que el servidor controla conductas fuera de la app. La evidencia desconocida afecta la recomendación que la necesita, no actividades inocuas de todo el ámbito.

- No se deduce un riesgo de palabras aisladas. Ante una situación urgente declarada, se prioriza la orientación de apoyo. No se inventan contactos de emergencia ni se promete vigilancia humana.

## 9. HdRP, dirección e IAD

- **HdRP:** reutiliza `PurposeRevision` (`schema.prisma` L911).

  - `content` guarda los campos de la plantilla v1: visión, valores y estándares elegidos, capacidades, contribución y huella, tensiones reconocidas, condiciones a proteger, prioridades, preguntas abiertas, IKIGAI e hipótesis, y compromisos de Mente y Cuerpo como borrador. Cada campo trae sus `sourceRefs` a los ítems del inventario.

  - Columna aditiva `directionStatus` con estados explícitos `NO_TRABAJADO`, `EXPLORANDO`, `PROVISIONAL` y `CONFIRMADO_POR_USUARIO`, más el momento de revisión. No asignes una dirección nueva a las filas heredadas sin revisión de la persona; sus firmas se leen como documentos históricos.

  - El borrador se prellena solo con respuestas de la persona; una plantilla rellenada no es una firma.

  - **Firma exacta:** `confirmPurpose` guarda `signed { snapshot completo, builderVersion, signedAt }` y la pantalla lee ese snapshot. Las firmas antiguas muestran su `content.contract` en texto plano.

  - Editar una respuesta no reconstruye una síntesis confirmada.

  - La HdRP se exporta en un formato legible (HTML imprimible).

  - Revisar una síntesis no exige ratificar un contrato solemne de propósito. En modo `EXPLORANDO`, los campos inciertos muestran la incertidumbre y los compromisos son borradores. No prellenes declaraciones definitivas, horas obligatorias o entrenamiento por falta de una respuesta. Una firma formal, si se ofrece, confirma exclusivamente el texto que la persona ve y elige. El HTML exportado también escapa las respuestas personales.

- **Dirección:**

  - Cualquiera de los tres estados trabajados permite un plan.

  - Con `EXPLORANDO`, el vínculo del plan es exploratorio, de cuidado o de prioridad concreta, y no se presenta como alineación con un propósito.

  - Las hipótesis se pueden guardar sin elegir. Un experimento solo pasa a plan si la persona lo selecciona; lleva una experiencia pequeña y reversible, una pregunta y una fecha de revisión.

  - El propósito no se reduce a dinero.

  - Las contradicciones entre respuestas se presentan como preguntas.

  - Sin una API de IA nueva: reglas transparentes y plantillas. Si se usa IA, solo para redactar, nunca como árbitro.

- **IAD-MK 0.1 borrador** («Alineación declarada»):

  - Tabla `AlignmentCheckpoint { id, userId, methodVersion: 'iad-mk-0.1-borrador', answers, windowStart, windowEnd, directionRevisionId, results, coverage, effectiveAt, createdAt }`. `answers` lleva, de E1 a C3, `{ value 1..5 | null, unknown }`; `results` lleva `{ E, M, C, total }`, cada uno nullable y sin redondear.

  - Los nueve criterios, preguntas y anclajes están definidos abajo. La ficha es una adaptación nueva de producto, no un cálculo del Excel, una aprobación de Rafa ni un instrumento validado. Conserva sus resultados separados del formulario y no la uses para bloquear acciones, asignar riesgos, precios o acceso.

  - Fórmula en `apps/api/src/instrumentos/iad.ts`: `n = 25 * (r - 1)`; un pilar es la media de sus 3 criterios y se calcula solo con 3 de 3; el total es la media de los 3 pilares y se calcula solo con 9 de 9; sin imputar ni redistribuir; se redondea solo al mostrar.

  - Se ofrece al revisar la devolución y luego cada 14 días, como sugerencia. Declinar no bloquea el plan.

  - Se muestra junto a la evidencia y los límites de los registros, sin fusionarlos.

  - La «profundidad» numérica queda «En definición». Se muestra la bitácora de respuestas, decisiones e hipótesis con fecha y procedencia.

  - La placa de Inicio («Índice de alineación» en `apps/web/components/journey/AmbitStage.tsx` L139) pasa a «Alineación declarada»: la cifra con la nota «método en revisión», o «pendiente» con su cobertura. No ocupará el lugar principal de la próxima ayuda o acción.

### Ficha autocontenida IAD-MK 0.1 borrador

| ID | Pregunta |
| --- | --- |
| E1 | ¿Qué tan clara y propia es la dirección que elijo ahora, aunque todavía la esté explorando? |
| E2 | ¿Qué tan claramente puedo explicar los valores y razones que sostienen esa dirección y qué quiero proteger? |
| E3 | ¿Qué tan concretamente puedo reconocer a quién o a qué quiero beneficiar o cuidar? |
| M1 | En los últimos 14 días, ¿qué tan coherentes fueron mis decisiones de prioridad con esa dirección y mis valores? |
| M2 | ¿Qué tan practicable es mi organización para avanzar o sostenerla con mis recursos, capacidad y responsabilidades reales? |
| M3 | En los últimos 14 días, ¿qué tan deliberadamente revisé lo que funcionaba y mantuve o ajusté mi estrategia? |
| C1 | En los últimos 14 días, ¿qué tan coherentes fueron mis acciones reales con lo que declaro importante? |
| C2 | En los últimos 14 días, ¿qué tan coherente fue el cuidado de mi cuerpo, energía y recuperación con mis necesidades y límites? |
| C3 | En los últimos 14 días, ¿qué tan coherente fue el tiempo que dediqué a compromisos y prácticas protegidas con esa dirección? |

Anclajes de respuesta, que también se versionan con el método:

| ID | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| E1 | No identifico una dirección propia | Reconozco deseos sueltos | Tengo una dirección provisional que puedo describir | Puedo explicar una dirección propia y una decisión que orienta | Puedo explicar mi dirección, sus límites y cómo contrastarla |
| E2 | No puedo identificar mis razones ni valores | Los nombro, pero no explico su relación | Explico algunas razones y algo que proteger | Explico sus consecuencias para decisiones concretas | Explico además tensiones y renuncias que elijo |
| E3 | No identifico a quién o qué beneficiar | Reconozco un interés muy general | Identifico un destinatario o algo que cuidar | Explico una contribución concreta posible | Explico esa contribución y cómo comprobar su utilidad |
| M1 | Mis prioridades contradijeron principalmente lo importante | Hubo pocas decisiones coherentes | Hubo coherencia parcial y tensiones | La mayoría de mis prioridades fueron coherentes dentro de mis límites | Sostuve prioridades coherentes y atendí explícitamente las tensiones |
| M2 | Mi organización contradice mis posibilidades reales | Depende de recursos u oportunidades que no tengo | Parte es viable y parte requiere ajuste | Es mayormente viable y contempla responsabilidades | Es viable y contempla dependencias, límites y alternativas |
| M3 | Mantuve la estrategia sin revisar señales disponibles | Reconocí señales sin usarlas para decidir | Revisé algunas señales y tomé una decisión | Usé señales relevantes para mantener o ajustar | Contrasté estrategia, resultado y contexto y elegí qué mantener o cambiar |
| C1 | Mis acciones contradijeron principalmente lo importante | Hubo pocas acciones coherentes | Hubo coherencia parcial | La mayoría fue coherente dentro de mis límites | Sostuve acciones coherentes y adapté lo necesario a mi contexto |
| C2 | El cuidado contradijo principalmente mis necesidades conocidas | Atendí pocas necesidades que podía cuidar | Atendí parte de ellas | Atendí la mayoría dentro de mis posibilidades | Sostuve un cuidado compatible y adapté compromisos a mis límites |
| C3 | El tiempo disponible se destinó principalmente contra mis prioridades | Protegí pocas oportunidades relevantes | Protegí algunas y perdí otras | Protegí la mayoría de las oportunidades viables | Protegí oportunidades relevantes y renegocié incompatibilidades |

«No tengo información suficiente» es una salida distinta de 1. La falta de oportunidades observables no se fuerza a una respuesta baja. No se puntúan riqueza, certeza absoluta, ausencia de enfermedad, horas de ejercicio ni actividad dentro de MK exclusivamente. Una decisión de descansar o pausar puede ser coherente. E1 a E3 y M2 describen el punto actual; M1, M3 y C1 a C3 usan la ventana retrospectiva registrada. El borrador combina ambas lecturas y lo explica.

Con `EXPLORANDO`, la referencia es la dirección provisional de exploración y los valores elegidos, sin afirmar alineación con un propósito ya definido. La persona ve y confirma esa referencia antes de responder. Si cambia la dirección o el método, no presentes la diferencia como mejora comparable automática: muestra ambas referencias y fechas. Confirmar un plan hoy no altera respuestas sobre los 14 días anteriores; se mide después mediante otra ficha elegida por la persona.

## 10. Prioridad, contexto, plan y guías

- **Devolución:** responde «¿Qué veo en mis respuestas?», «¿Qué podría necesitar atención?», «¿Qué quiero construir o proteger primero?» y «¿Por qué este movimiento sería razonable ahora?». Pocas conclusiones, con acceso al detalle.

- **`PriorityProposal { id, userId, revision, basis, candidates, chosen, correction, effectiveAt }`.** `basis` guarda los IDs y versiones de la lectura, la HdRP, las restricciones y el contexto. Los candidatos traen razones visibles y nunca son «el ámbito más bajo». Se distingue entre objetivo elegido, obligación urgente y condición habilitante. La causalidad se formula como hipótesis.

- **`MemberContext { userId, revision, timezone, capacityMinutesPerWeek | ZERO | UNKNOWN, windows, protectedResponsibilities, resources, limits, clarifications, effectiveAt }`.**

  - La zona se pide o se confirma; la del navegador es solo una propuesta.

  - Capacidad cero habilita pausa o cuidado.

  - Solo se pide lo que la acción necesita.

- **Plan:** extiende `PersonalPlan`, `PlanAction` y `ActionRecord` y agrega `PlanVersion`.

  - Contenido de la versión: resultado buscado, situación inicial, señal de avance, revisión, vínculo con la HdRP (`DIRECT`, `ENABLING`, `PROTECTIVE` o `EXPLORATORY`, con explicación confirmada), pasos, acciones, capacidad y límites.

  - Política reversible: un objetivo principal y, si cabe, una práctica de mantenimiento. Nada se activa por ámbito o pilar.

  - Los planes heredados se conservan y se reorganizan de forma explícita.

  - Cada acción tiene verbo, objeto o resultado, ocasión o ventana, estimación de duración, criterio de terminación, frecuencia si es recurrente y etiquetas de contenido. La opción mínima se ofrece cuando sigue siendo útil; nunca es obligatoria ni se crea si la capacidad es cero.

  - Si cambia el propósito, el plan pide revisar el vínculo.

La profundidad debe influir en la ayuda sin convertir toda reflexión en tarea. Origen permite reconocer recursos y patrones, sin atribuir causas no demostradas; visión orienta el resultado; valores y estándares ayudan a elegir y proteger límites; identidad y dificultades abren hipótesis que la persona puede corregir; personalidad ofrece una lectura descriptiva; IKIGAI permite explorar; huella ayuda a revisar la contribución deseada. No generes tareas obligatorias por un rasgo, una categoría o una historia familiar. En el recorrido de aceptación debe verse al menos una consecuencia de visión, valores o estándares sobre el plan y una salida reflexiva conservada que no active tareas.

Para cada propuesta muestra la respuesta o síntesis que la sostiene, la suposición que falta comprobar y una alternativa. Si la persona corrige la suposición, cambia la propuesta; guardar la corrección sin efecto falla la aceptación. Permite un paso propio con el mismo contrato de viabilidad. Si no hay una guía pertinente, ofrece aclarar el bloqueo, preparar apoyo o diseñar ese paso; no repitas una guía incompatible. No clasifiques acciones libres con palabras aisladas: pide su tipo operativo y las aclaraciones mínimas, conservando la incertidumbre cuando no pueda resolverse.

- **Guías de producto** (en `apps/api/src/journey/guides/`, contenido nuevo sin v2). Son 11:

  1. Convertir una intención en resultado.

  2. Elegir prioridades y renuncias.

  3. Planificar una semana real.

  4. Iniciar una tarea y reducir la fricción.

  5. Aprender una habilidad con práctica y feedback.

  6. Traducir un valor en estándar.

  7. Preparar una conversación compatible.

  8. Ordenar información para una decisión económica.

  9. Organizar un cuidado o preparar una consulta.

  10. Explorar una hipótesis de propósito.

  11. Revisar y ajustar.

  Cada guía tiene `whenUseful`, requisitos, `limits`, `contentTags`, pasos concretos, ejemplo, la salida guardada en `HelpArtifact` (esquema, borrador, agenda, decisión, lista o experimento) y un criterio de finalización. Una validación rechaza las guías incompletas.

  El número 11 es cobertura inicial, no evidencia de calidad. Cada guía necesita una salida editable que pueda usarse fuera de la app y un recorrido de ejemplo coherente. En la primera sesión de preparación, el miembro debe obtener al menos un resultado útil, como un entregable delimitado, un borrador, una conversación preparada o una pregunta de experimento con oportunidad viable. Un formulario que solo termina en «plan confirmado» no satisface este criterio.

  - Si una guía no resuelve el bloqueo, la persona registra el bloqueo y elige otro paso.

  - Ninguna guía genera planes clínicos, asesoría de inversión ni conversaciones que ignoren una situación insegura.

## 11. Hoy, registro y revisión

- **Hoy** (`/panel`): la acción que toca, por qué importa (vínculo), cómo empezar (guía), criterio de terminación y registro en el mismo lugar. Desde ahí se vuelve al objetivo y a la HdRP.

- **Registros:**

  - Estados: realizada, parcial, no realizada, reprogramada y no aplicable a esa ocasión; «sin información» se deriva cuando la ventana cerró sin registro.

  - Las acciones espontáneas se registran como eventos fuera del denominador.

  - Reprogramar crea una ocasión relacionada y conserva la original.

  - Una ocasión abierta no es incumplimiento, y sin registro no significa que no actuó.

  - Nunca se mezclan pausas, futuras y desconocidas en un denominador. Con denominador cero no se muestra porcentaje.

  - Actividad, resultado observado y aprendizaje se guardan por separado (`ChangeObservation`).

  - Antes de mostrar porcentajes, define la población: ocasiones aplicables ya cerradas del periodo con resultado conocido (realizada, parcial o no realizada), excluyendo futuras, pausadas, canceladas, no aplicables, sustituidas por reprogramación, eventos espontáneos y sin información. Muestra realizadas, parciales, no realizadas y sin información como cantidades separadas; no atribuyas a una parcial un porcentaje de éxito arbitrario ni llames fracaso a lo desconocido. Si se muestra un porcentaje, nómbralo con su denominador, por ejemplo «2 de 4 ocasiones con resultado conocido realizadas; además, 1 sin información». Muestra también la cobertura de registro sobre las ocasiones aplicables cerradas para que la ausencia de datos sea visible. El objetivo y su avance observado siguen siendo otra lectura.

- **Revisión:** se sugiere cada 7 días y es ajustable.

  - Preguntas: qué se intentó, qué ocurrió, qué cambió en el resultado, qué ayudó, qué obstaculizó, qué se aprendió, y qué se mantiene, reduce, sustituye, pausa o cierra.

  - Se muestra una vista previa y se aplica en una versión nueva, que cambia las acciones y las ocasiones futuras. Guardar «reducir» sin reducir nada es un fallo.

  - Cerrar puede ser por logro, cambio de prioridad, pérdida de sentido o imposibilidad.

  - Si una acción se cumple sin mover el resultado, se revisan la utilidad, el indicador y los supuestos. Si no se cumple, se distinguen capacidad, diseño, restricción, claridad y conflicto de prioridades.

  - Cada decisión tiene un efecto verificable: mantener conserva la estrategia; reducir cambia carga o frecuencia hacia adelante; sustituir vincula el paso anterior con el nuevo; pausar detiene ocasiones futuras desde la fecha elegida; cerrar guarda el motivo y detiene la generación. Distingue revisión guardada de revisión aplicada. Si la decisión afecta una ocasión ya abierta, la vista previa permite conservarla o cancelarla hacia adelante; nunca altera una ocurrencia registrada o vencida.

  - Una revisión vencida se sugiere sin impedir registrar, pedir ayuda o continuar pasos compatibles. No se obliga a revisar con datos inexistentes ni se atribuye motivación a una causa desconocida.

- **Retorno:** muestra dónde quedó la persona, qué sigue vigente y qué conviene revisar. Pide actualizar solo el contexto relevante y conserva desconocidas las ocasiones pasadas.

## 12. Integridad (del plan anterior, se conserva)

- **Modelos nuevos o extendidos.** Las migraciones preservan los datos y documentos existentes, en `packages/database/prisma/migrations/`, con el comando disponible en el checkout (`npm run db:migrate`, según el plan), y se ensayan en desarrollo antes de cada entrega. No elimines columnas o datos para simplificar la transición. Los cambios de nulabilidad o índices necesarios se documentan y comprueban con datos heredados. La versión de Prisma reportada es 6.19.3: verifica la instalada y no la actualices como parte de este alcance.

  - `MemberJourney { userId, stateRevision }`.

  - `PlanVersion`.

  - `PlannedOpportunity { actionId, actionRevision, planVersion, kind FIXED | FLEXIBLE | TRIGGER_EVENT | UNPLANNED, slotKey, windowStart, windowEnd, timezone, status, rescheduledFromId }`.

  - `ActionRecord` con `opportunityId`, `outcome`, `revision`, `effectiveAt` y `legacy`. El unique por día queda solo para `legacy = true`.

  - Una ocasión tiene un único resultado vigente y revisiones recuperables. Registros espontáneos y desencadenantes usan identidad de evento, sin índice que prohíba ocurrencias legítimas en el mismo día. No añadas `legacy` a un índice diario de tal forma que también deje restringidos los registros nuevos.

  - `PlanReview`, `IdempotencyRecord { userId, operation, key, payloadHash, response }`, `FocusItem`, `HelpArtifact` y `ChangeObservation`.

  - `User.accountKind` y `User.adultAttestedAt`, más `SimulationClock`.

  - `JourneyEvent { userId, accountKind, type, at, props sin texto }`.

- **Invariantes de escritura:**

  - Una síntesis confirmada y una versión de plan son fotos estables. Una propuesta guarda su `basis` con las versiones relevantes de respuestas, lectura, dirección, restricciones, contexto, foco y plan; una respuesta no relacionada no invalida innecesariamente una revisión.

  - Apply, confirmación y activación operan mediante un servicio canónico, en una única transacción de base de datos que vuelve a comprobar propiedad, base vigente, viabilidad y restricciones. La comparación de versión del plan usa un predicado con propietario, versión esperada y estado, cuyo `count` debe ser 1. No basta proteger solo la fila del plan.

  - Define un orden único de locks por miembro. Respuestas o aclaraciones relevantes, contexto, dirección, foco, restricciones, generación de ocasiones y revisiones usan ese mismo mecanismo cuando modifican dependencias compartidas. Comprueba la base después de obtener el lock y dentro de la transacción. `MemberJourney.stateRevision` cambia con las modificaciones pertinentes. Una lectura fuera de la transacción no sustituye esta comprobación.

  - Idempotencia por `userId + operation + key`, con índice único, hash canónico del payload y respuesta comprometida con el mismo efecto. Autentica y valida propiedad antes de devolver una respuesta cacheada. Un reintento legítimo devuelve la respuesta original aunque su versión esperada ya haya quedado atrás; la misma clave con otro payload da 409. No permitas que una colisión entre usuarios comparta respuestas.

  - Dos peticiones simultáneas con la misma clave producen un solo efecto. Si una transacción aborta por conflicto, la respuesta comprometida se consulta fuera de ella; si no se comprometió nada, reintenta de forma acotada la operación completa. Nunca recuperes una transacción abortada consultando dentro de ella, ni conviertas un fallo de viabilidad en un éxito cacheado.

  - Dos claves diferentes sobre la misma versión permiten un solo efecto; la otra recibe `STALE_VERSION` o `BASIS_CHANGED` y conserva el borrador. Una modificación concurrente de contexto o restricción produce una secuencia consistente: si se guardó primero, el apply se rechaza o recalcula; si se guardó después, reevalúa las propuestas activas. No queden recomendaciones incompatibles vigentes tras ambas operaciones.

  - No mantengas locks mientras esperas interacción humana o servicios externos. Documenta el aislamiento usado y reintentos de serialización o deadlock; no supongas que envolver varias consultas en una transacción elimina toda carrera.

  - Contrasta esa estrategia con la documentación primaria de PostgreSQL sobre [aislamiento](https://www.postgresql.org/docs/current/transaction-iso.html) y [locks explícitos](https://www.postgresql.org/docs/current/explicit-locking.html), usando la versión realmente instalada. La documentación sirve para revisar el mecanismo; las pruebas de concurrencia del proyecto demuestran el comportamiento implementado.

  - El histórico se lee desde el snapshot de la versión. Se separan `createdAt` del registro persistido, `effectiveAt` del cambio y `occurredAt` de lo reportado. El reloj de dominio determina las fechas de acciones y revisión en fixtures; autenticación, caducidad de credenciales y logs de infraestructura usan tiempo real.

- **Ocasiones y calendario:**

  - `ensureOpportunityHorizon` mantiene hasta 21 días futuros para planes activos, aunque la revisión esté vencida. Se ejecuta al leer Hoy o calendario y al aplicar una revisión, de forma idempotente y con unicidad por acción, revisión y `slotKey`. Leer no crea decisiones, planes ni compromisos adicionales; materializa únicamente ocasiones ya acordadas. No rellena el pasado ausente después de una ausencia ni genera deuda de tareas.

  - En una frecuencia flexible, por ejemplo dos veces por semana, hay dos ocasiones acordadas dentro de la ventana, no una cada día. Una acción espontánea no ocupa una de ellas sin elección explícita. Cambiar la frecuencia afecta las próximas ventanas; la ventana abierta requiere una decisión visible sobre sus ocasiones pendientes. Se conservan las expectativas pasadas.

  - Para `TRIGGER_EVENT`, registra cada evento declarado con identidad propia y una ocasión vinculada. Dos eventos legítimos en el mismo día se aceptan; reenviar el mismo evento no lo duplica. Sin evento declarado no se crea una ejecución esperada ni un incumplimiento. `UNPLANNED` permanece fuera del denominador de compromiso.

  - Reprogramar conserva la ocasión original como sustituida y vincula la nueva; ambas nunca cuentan como dos obligaciones. Corregir un registro conserva su revisión y modifica una única lectura vigente de esa ocasión, sin duplicar actividad.

  - Ventanas calculadas en la zona explícita del miembro con DST. Guarda zona y fechas resueltas en cada ocasión. Un cambio de zona propone cómo adaptar el futuro; no mueve registros o ventanas vencidas. Define y prueba qué ocurre con una hora inexistente o duplicada, así como con medianoche.

- **Compatibilidad de endpoints:**

  - Inventaría consumidores web, móvil y jobs de `POST /journey/plans`, `POST /plans/:id/actions`, `POST /domains/:d/actions`, `PATCH /plans/:id`, `ensureActivePlan` y `closeWeek`. Elimina la creación implícita de planes nuevos fuera del contrato canónico; conserva las lecturas y la captura de registros heredados.

  - Usa adaptadores al servicio canónico cuando el consumidor siga vigente. Si el payload antiguo no permite una operación segura, devuelve un error explicativo y permite conservar el borrador; no aceptes silenciosamente ni permitas saltarse el formulario o las restricciones. Reserva 410 para una ruta realmente retirada, con consumidores migrados y compatibilidad verificada. No retires todas las rutas por el solo hecho de figurar aquí.

  - `closeWeek` adapta la revisión canónica y aplica el mismo control de versiones; no guarda una decisión sin efecto. `next-step.ts` sugiere sin convertirse en una puerta global que impida actuar.

- **Heredados:**

  - Los planes existentes quedan `origin = LEGACY` y `role = NULL`, sin elegir foco por la persona. Los registros existentes quedan `legacy = true`.

  - Un plan activo sin rol sigue visible en «Planes por revisar» y en la carga conocida; no se oculta ni se excluye como si estuviera pausado. Antes de activar otro objetivo principal, la persona revisa los planes activos conocidos y elige foco, mantenimiento, pausa o cierre. Esa transición conserva objetivos, firmas, acciones y registros; la migración no toma esas decisiones por ella.

  - Las sesiones `formularios-x-paso` siguen legibles. `formulario-equivalence.ts` mapea solo los ítems con el mismo texto, escala y opciones; el resto queda pendiente.

  - Las firmas antiguas son exactas.

  - IKIGAI público: propiedad por token. IKIGAI de miembro: propiedad por usuario (`IkigaiSession.userId` nullable). Sin atribución por correo; el trabajo anterior se conserva sin afirmar un vínculo.

## 13. Permisos, privacidad, fixtures y eventos

- El servidor valida propiedad, permisos, contexto y restricciones en cada endpoint y en las relaciones secundarias. Administradores y terceros no ven respuestas privadas: verifica `apps/api/src/admin/admin.service.ts`.

- No se escriben textos íntimos en logs, analítica ni errores.

- Las exportaciones son privadas y por solicitud del propietario; no se publican mediante un token reutilizable sin una elección de compartir. Preparar apoyo permite escoger qué incluir y ver el texto antes de copiarlo. No comparte automáticamente historia, salud o dificultades. La conservación histórica protege frente a ediciones del recorrido, sin impedir el procedimiento de eliminación o privacidad vigente.

- **Fixtures:** cuentas `FIXTURE` con correos `@fixtures.mk.invalid`, creadas por `packages/database/prisma/seed-formulario-fixtures.ts`. Se niega a correr si la base no es local o si falta `MK_INTERNAL_SIM=1`.

  - Esta protección se implementa antes del primer seed o recorrido de la Entrega 1, no recién en la Entrega 3. Verifica el destino con una configuración explícita de desarrollo y una lista permitida; no des por segura una base remota solo porque el nombre contiene «test». No ejecutes reset de una base compartida ni migres producción para probar el prompt.

  - Cuatro personas ficticias: dirección clara, sin propósito, con restricción física y con finanzas bajas.

  - Las respuestas del formulario son completas y plausibles, escritas como datos del fixture, no producidas por el motor.

- **Simulación:** `POST /admin/sim/fixtures/:userId/clock` y `/reset`, con actor `ADMIN`, objetivo `FIXTURE` y flag comprobados por separado. El reloj solo mueve las fechas del recorrido; JWT y refresh siguen en tiempo real.

- **Efectos externos:** `ReengagementService` (`apps/api/src/diagnostic/reengagement.service.ts`, cron reportado cada 4 horas), `MailService` y cualquier emisor vigente excluyen `FIXTURE` y `.invalid`, comprobado antes de las primeras pruebas. La identidad del fixture se asigna en servidor desde su creación, no por un campo libre del cliente. No envíes correos, mensajes, invitaciones ni cargos al ejecutar estos recorridos.

- **Eventos sin contenido:** inicio y avance por bloque, recorrido terminado, síntesis revisada con su estado, plan confirmado, primera acción registrada, revisión aplicada y retorno. Separados por `accountKind`.

## 14. UI e hilo de navegación

- **Hilo:** formulario (`/diagnostico/*`), Perfil y HdRP (`/perfil` con la devolución, los puntajes y la IAD; `/proposito` con la HdRP), Ruta (`/ruta`, que pasa a mostrar plan, versiones y revisión; la escalera de bloques del formulario queda en `/diagnostico`), Hoy (`/panel`) y Revisión (contextual dentro de `/ruta`, con acceso desde Hoy).

- **Continuidad de URLs:** `/planes` lista los planes heredados y su reorganización; `/calendario` muestra las ocasiones de la semana; `/mente`, `/espiritu` y `/cuerpo` son filtros sin cifras.

- **Navegación:** pestañas móviles Hoy, Ruta, Calendario y Perfil (`apps/web/components/app-shell/BottomTabBar.tsx`). La barra lateral (`MemberSideNav.tsx`) muestra las mismas más Apoyo y Cuenta.

- **Contrato visual:** se aplica `DESIGN.md` y se reutilizan los tokens de `apps/web/app/globals.css`. Las tareas principales dominan el primer viewport móvil. Se comprueba a 320, 375, 390, 768 y 1440 px, sin scroll horizontal, con teclado, foco, errores vinculados, estados que no dependen solo del color y movimiento reducido. El texto se renderiza escapado.

- **Al usuario no se le muestran** nombres de motores, versiones internas ni estados de base de datos. La explicación de qué se mide y por qué algo está pendiente sí es accesible.

## 15. Web pública: preparar, no publicar

- No cambies `EARLY_ACCESS_MODE` (`apps/web/lib/product-phase.ts` y `apps/api/src/product-phase.ts`) ni despliegues.

- Escribe `MK_COPY_PUBLICO_PROPUESTO.md` (raíz) con el reemplazo exacto propuesto por archivo y línea para landing, FAQ, `/sistema`, manifiesto, marco central, precios y llms.txt:

  - distinguir prueba web de apps nativas futuras;

  - describir la «Alineación declarada» como método en revisión;

  - sacar o marcar como futuro los hábitos como subsistema, las misiones, las notificaciones y la evolución por ámbito;

  - no afirmar que el estado de fundador o la prueba de 30 días están operativos si no lo están en la cuenta;

  - un único criterio de disponibilidad entre el sitio y la app.

- No modifiques esos componentes en esta entrega.

## 16. Pruebas (efectos reales, no repetir JSX)

**Comandos:**

- `npm run dev:db`

- `npm run dev:prepare`

- `npm run test -w @mk/api`, con `DATABASE_URL` local.

- `npm run test -w @mk/web`

- `npx tsc --noEmit -p apps/api`

- `npx tsc --noEmit -p apps/web`. Hay 8 errores previos en las pruebas del Lab: distínguelos de los nuevos.

- `npm run check:build`

- `npx playwright test e2e/<spec> --project=chromium`, con `E2E_PREVIEW_EMAIL`, `E2E_NORMAL_EMAIL`, `E2E_PASSWORD` y `DATABASE_URL` local.

Estos nombres y comandos proceden del plan reportado: comprueba scripts, versiones y entorno antes de ejecutarlos. Obtén la línea base de fallos actuales; el número de errores previos puede haber cambiado. No atribuyas un fallo al Lab sin comprobarlo ni uses una línea base para ignorar una regresión. Los secretos se configuran fuera de archivos commiteables y no se imprimen en el informe.

**Pruebas de dominio** (`apps/api/test/`):

- `formulario-inventory.test.ts`: conteos por hoja, cada `QUESTION` y `DETAIL` presente en el catálogo, sha estable.

- `formulario-score.test.ts`:

  - auditoría con 23, 115 y una respuesta faltante (sin total); cortes 45/46, 68/69 y 91/92; sección 6 fuera del total; ítem 1 con alerta al responder 1 y sin alerta al responder 2; sección 3 con alerta en 1 y 2; secciones 4 y 5 conservando la regla nativa `=2` y aplicando la adaptación `<=2`;

  - identidad con 10, 33, 34, 35 y 40, sin `FALSE`, y con 9 de 10 respuestas no calculable;

  - dificultades por grupo de 0 a 18, sin total de 90 ni de 40, y un MÁS O MENOS que vale 1;

  - personalidad con inversos y un faltante sin lectura;

  - F-RAD-002 y F-RAD-003 con 12 y 60, todos los cortes y subtotales, y una sección incompleta sin total global fabricado;

  - `NOT_APPLICABLE` sin renormalizar.

- `formulario-signals.test.ts`: cada alerta del §3, sueño con las opciones exactas del Excel, porcentaje 20 en la UI equivalente a 0,20 en el Excel, «prefiero no responder» distinto de «sin restricciones», cambio de respuesta padre y resolución de una aclaración sin borrar la señal histórica.

- `formulario-restrictions.test.ts`: una lesión histórica recuperada no bloquea automáticamente esfuerzos; un límite vigente incompatible rechaza la confirmación y el inicio asistido con 409 y alternativa; una información necesaria desconocida permite preparación independiente; registrar algo pasado sigue permitido; una respuesta cambiada reevalúa acciones futuras y ayudas guardadas; omitir etiquetas en el payload no permite eludir el control.

- `iad.test.ts`: nueve respuestas en 1 dan 0 y en 5 dan 100; E1 a E3 en 4, M1 a M3 en 3 y C1 a C3 en 2 dan 75/50/25 y total 50; cambiar los tres M a 4 da 58,33… con C en 25; 8 de 9 respuestas dejan el total pendiente, conservando los pilares completos; sin renormalizar; confirmar un plan no modifica el checkpoint retrospectivo; cambio de dirección no produce una comparación automática de mejora.

- `journey-integrity.test.ts`: firma exacta; misma clave y payload, misma clave en paralelo, otro payload y dos claves en paralelo con un solo efecto; respuesta perdida tras commit y reintento; rollback sin respuesta de éxito; cambio concurrente de contexto, dirección o restricción con el apply; horizonte a 21 días incluso con revisión vencida; lectura repetida sin ocasiones duplicadas; retorno sin rellenar pasado; frecuencia flexible y cambios a mitad de ventana; dos desencadenantes en un día y un reenvío del mismo evento; reprogramación contada una vez; corrección de registro con historial; DST, medianoche y cambio de zona; denominador cero; adaptadores antiguos sin bypass y retirada 410 solo donde corresponda.

- `formulario-capture.test.ts`: respuesta y excepción mutuamente excluyentes, rangos y unidades, opciones dependientes, máximos de selección, respuestas fuera de orden, hijo obsoleto tras cambiar el padre, extracción y catálogo con definiciones distintas rechazados sin reescribir respuestas, actualización de señales consistente o explícitamente pendiente.

- `formulario-isolation.test.ts` (§2).

- `permissions.test.ts`: otra cuenta y relaciones secundarias, ADMIN frente a datos privados, exportación ajena y texto escapado, simulación sobre cuenta real, edad y acceso por endpoints alternativos, clave de idempotencia reutilizada entre usuarios, emisores sin efectos externos para fixtures desde Entrega 1.

**Recorridos e2e:**

- `e2e/formulario-full-journey.spec.ts`: cuenta nueva, formulario completo en varias sesiones y con la red cortada, devolución, HdRP `CONFIRMADO_POR_USUARIO`, IAD, prioridad, contexto, plan con vínculo, artefacto de ayuda útil y editable, Hoy, registro y revisión que cambia acciones futuras. Una corrección a la propuesta cambia el paso; visión, valores o estándares modifican una decisión de planificación. Visible tras recarga y sesión nueva.

- `e2e/formulario-exploring.spec.ts`: formulario completo con excepciones (sin linaje ni pareja), HdRP `EXPLORANDO`, hipótesis guardadas sin planes automáticos, experimento elegido por la persona, ayuda útil, acción, revisión y aprendizaje que permite mantener o descartar la hipótesis. Puede declinar IAD y continuar; no se inventan un propósito, una firma ni un puntaje total. Una comprensión reflexiva queda conservada sin una tarea nueva.

- Ambos en móvil (390 px) y desktop (1440 px).

**Casos adicionales obligatorios** (en pruebas o en recorrido, con resultado documentado):

- valores incompatibles con la agenda;

- dato de seguridad desconocido;

- finanzas bajas con meta ambiciosa;

- familia difícil;

- dos pestañas;

- cambio de propósito después del preview;

- capacidad cero;

- acción parcial, espontánea, reprogramada o sin registro;

- dos semanas sin volver;

- acción cumplida sin avance del resultado;

- heredado con IKIGAI anónimo;

- acceso a datos de otro usuario;

- texto con HTML, cadenas largas, zona horaria y medianoche.

| Situación | Resultado a comprobar |
| --- | --- |
| Valores incompatibles con la agenda | Muestra la tensión, permite elegir y cambia la carga; no confirma compromisos imposibles |
| Dependencia pendiente | Distingue preparar de ejecutar y ofrece una preparación compatible |
| Recurso indispensable ausente o capacidad cero | Pausa o alternativa viable; no añade una tarea mínima automáticamente |
| Meta ambiciosa con obligaciones económicas | Ordena condiciones y datos, sin deuda ni inversión personalizada como solución |
| Historia familiar o relación difícil | No atribuye culpa ni exige contacto; permite excepciones y apoyo elegido |
| Cumple todas las acciones sin avanzar | Cambia estrategia, entregable o indicador y conserva los intentos |
| No hay datos de resultado | Lo declara desconocido; permite observar o revisar sin inventar éxito o fracaso |
| El cambio deja de tener sentido | Puede cerrarlo por ese motivo y conservar el aprendizaje |
| Retorno tras ausencia | No impone tareas acumuladas; recupera contexto y genera solo el futuro acordado |
| Planes heredados sin rol | Son visibles, conservan registros y se reorganizan antes de sumar foco |
| Cambia un estándar personal | Permite reconsiderarlo explícitamente, guarda la revisión anterior y actualiza el vínculo afectado |
| No hay guía pertinente | Aclara el bloqueo, ofrece preparar apoyo o permite un paso propio con viabilidad comprobada |

**Revisión manual:** documenta la copy de devoluciones, anclajes IAD, descriptores de dificultades y guías en `FORMULARIO_REVISION_MANUAL.md`. Comprueba que una síntesis distingue respuesta literal, interpretación y pregunta abierta; no atribuye patrones o causas como hechos, no convierte dificultades externas en rasgos y permite conservar algo útil sin pedir una tarea. Conserva capturas de los estados principales y resultados de los dos recorridos en el informe, sin secretos ni respuestas reales privadas.

## 17. Orden de trabajo y criterios de salida por entrega

0. **Preparación de desarrollo y fixtures.** Confirma el checkout y la base de desarrollo, conserva cambios ajenos, implementa identidad `FIXTURE` y supresión de efectos externos, y obtiene una línea base. Esta es una dependencia de las pruebas siguientes.

1. **Entrega 1. Inventario, catálogo, captura y puntajes.**

  - Contenido: extracción, `formulario-completo@1`, decisiones (§4), migraciones de catálogo y respuestas, player con tipos y excepciones, autoguardado, devolución por bloque, `FormularioReading`, `score.ts`, `signals.ts`, elegibilidad, propiedad y aislamiento v2. Las prácticas breves del bloque usan contenido del formulario o preparación independiente; las guías completas se amplían en Entrega 2, sin habilitar anticipadamente acciones restringidas.

  - Salida: un fixture completa el formulario por la API y por la UI, con puntajes correctos, alertas visibles y la cobertura generada.

2. **Entrega 2. Devolución, HdRP, IAD, prioridad, contexto y plan con guías.**

  - Contenido: `PurposeRevision` extendido, `AlignmentCheckpoint`, `PriorityProposal`, `MemberContext`, `PlanVersion`, guías y restricciones en el servidor. Desde aquí existen el control canónico de confirmación, la propiedad, las versiones y la idempotencia que necesita un plan persistido; no se difieren a Entrega 3.

  - Salida: un plan confirmado con vínculo, una salida de ayuda útil guardada y sin restricciones incompatibles. Se prueban corrección de propuesta, capacidad cero y propósito exploratorio antes de ampliar ejecución.

3. **Entrega 3. Ejecución, revisión aplicada, versiones e integridad.**

  - Contenido: Hoy, ocasiones, registros, revisión con preview y apply, retorno, heredados y simulación.

  - Salida: los dos recorridos e2e en verde, con persistencia tras recarga y sesión nueva.

4. **Entrega 4. Casos críticos, móvil, permisos, copy público preparado y evidencia.**

  - Contenido: casos del §16, revisión manual, `MK_COPY_PUBLICO_PROPUESTO.md`, `DESIGN.md`.

No te detengas después del catálogo o del perfil. Las decisiones pendientes no bloquean lo calculable.

## 18. Entrega final y viabilidad

- **Informe en `MK_IMPLEMENTATION_PROGRESS.md`:**

  - cambios y su razón;

  - tabla de cobertura (enlace a `FORMULARIO_COBERTURA.md`);

  - decisiones y adaptaciones (enlace a `formulario-completo.DECISIONES.md`);

  - pruebas ejecutadas con el resultado real;

  - escenarios recorridos;

  - limitaciones y pasos para ejecutar la app.

- No se inventan pruebas, capturas ni verificaciones. Se distinguen los fallos previos de los nuevos. Si falta algo externo, se implementa todo lo independiente y se deja el punto de continuación.

- Escribe `MK_PRUEBA_5_PERSONAS.md` con el protocolo de observación: dónde abandonan el formulario, tiempo observado y sesiones necesarias, si entienden la devolución, si reconocen o corrigen la prioridad, si la ayuda produce algo utilizable, si ejecutan el primer paso, si vuelven a revisar y qué decisión cambió. Observa cuatro semanas, registra cada intervención humana y separa facilidad de uso, utilidad y disposición a pagar. Cinco personas permiten detectar problemas, sin demostrar eficacia ni validar el índice. Es solo el documento: no se contacta a nadie ni se envían correos.

- La simulación verifica coherencia y funcionamiento, no eficacia. El producto no se declara completo porque compile ni porque funcionen guiones estáticos.
