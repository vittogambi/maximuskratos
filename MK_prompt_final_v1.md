**Prompt final para implementar Maximus Kratos desde formulario v1**

7 de octubre de 2026 · Especificación de ejecución para Cursor en Agent mode.

Adjunta el Excel original `260529-FORMULARIOS-X-PASO.xlsx` y este documento. El marco rector sirve como contexto secundario cuando sea compatible con el formulario. Este prompt reemplaza las instrucciones incompatibles de los planes anteriores. No es necesario adjuntar aquellos planes ni la matriz maestra v2.

El texto siguiente está dirigido al agente que trabaja dentro del repositorio.

---

**1. Implementa este producto**

Actúa como responsable de producto e ingeniería de Maximus Kratos. Implementa el recorrido completo en la aplicación existente. La única fuente del cuestionario, sus instrumentos y sus ejercicios es el Excel de Formularios por paso. La web pública aporta el posicionamiento y las promesas que debemos cumplir con honestidad.

El resultado debe permitir a una persona recorrer formulario completo, entender sus respuestas y puntajes, construir una dirección o reconocer que todavía está explorándola, elegir una prioridad, convertirla en un plan viable, ejecutar acciones y revisar lo ocurrido para ajustar ese plan. La utilidad recurrente está en decidir y actuar mejor con lo descubierto, y conservar esa continuidad cuando cambia la vida.

Trabaja sobre el repositorio real. Lee sus instrucciones y comprueba las rutas, componentes, permisos, datos y servicios existentes antes de modificarlos. Reutiliza infraestructura compatible. Las auditorías previas son pistas para verificar, no hechos que debas dar por ciertos. Después de una inspección breve, empieza a implementar; no termines entregando solamente otro plan. Mantén un archivo de avance breve, versionado en una ubicación que no esté ignorada por git, para continuar sin perder contexto.

No uses la matriz maestra v2 en el nuevo recorrido: ni cuestionarios, reglas de alertas, prioridades, puntajes, índices, actividades, recomendaciones, doce módulos de propósito, textos ni fixtures derivados de ella. Congelarla mientras el producto la sigue llamando incumple esta instrucción. Verifica también dependencias indirectas y servicios compartidos.

Puedes reutilizar código genérico de autenticación, almacenamiento, formularios, fechas y diseño si no arrastra contenido o lógica de v2. Conserva los datos históricos y las herramientas internas existentes; no los borres ni los reinterpretes como respuestas del formulario. Aísla su uso del nuevo recorrido de miembros. Si un cálculo compartido depende de v2, crea una implementación formulario independiente, limitada al problema real.

Los tres pilares y los cuatro ámbitos del método público siguen vigentes. Sus doce intersecciones son un mapa conceptual; no son los doce módulos del catálogo descartado. No inventes un puntaje para cada intersección si formulario no proporciona ese cálculo.

Construye primero la aplicación web adaptable a móvil. Conserva el stack y el estilo de MK. Esta entrega no incluye apps nativas, cobros nuevos, comunidad, marketplace de asesores ni publicación en producción.

**2. Un recorrido común, con utilidad durante y después del formulario**

El recorrido inicial es:

1. Explicar el proceso y conocer brevemente el motivo de llegada.
2. Completar el formulario por bloques, guardando y retomando.
3. Recibir una devolución comprensible y revisar la Hoja de Ruta de Propósito.
4. Elegir una prioridad con razones y límites explícitos.
5. Preparar, confirmar y ejecutar un primer plan.
6. Registrar resultados y obstáculos; revisar y aplicar ajustes.

Todos los nuevos miembros recorren el cuestionario completo. El motivo de llegada contextualiza los ejemplos y las propuestas; no reduce el formulario ni habilita un atajo que sustituyal formulario. Esto no obliga a completar todo en una sesión. Ofrece pausa, navegación entre bloques, progreso real y retorno al último punto guardado.

Durante el cuestionario entrega utilidad: una síntesis editable al terminar cada bloque, respuestas que conviene reconsiderar, una decisión o idea que guardar y una práctica breve compatible con lo respondido. Estas prácticas no requieren activar un plan estratégico antes de terminar el recorrido. Las orientaciones ante alertas están disponibles en cuanto aparecen.

Para terminar el recorrido, cada ítem aplicable debe estar respondido o tener una excepción explícita permitida. `No sé`, `No aplica`, `Prefiero no responder` y `Pendiente` son estados diferentes; `Pendiente` conserva el recorrido abierto. Las excepciones pueden completar el recorrido sin completar todos los puntajes. Nunca muestres «instrumento completo» cuando faltan respuestas puntuables.

Después, la pantalla de entrada muestra la próxima acción o la revisión pendiente. El formulario permanece accesible para profundizar y actualizar; no se vuelve a imponer entero cada semana. Una persona con un plan heredado debe poder continuar registrándolo mientras completa las partes del formulario que le faltan.

**3. Recupera formulario completo y demuestra su cobertura**

Abre el XLSX, incluidas fórmulas, validaciones, listas auxiliares, condiciones y hojas de síntesis. No tomes el catálogo actual como equivalente al original ni asumas un número aproximado de preguntas como criterio de aceptación. Una pregunta puede ocupar varias filas; una fila puede ser una instrucción, una respuesta repetible o un resultado calculado.

Genera un inventario revisable con: identificador estable, versión y huella del archivo, hoja y celdas originales, bloque, texto original, tipo de respuesta, opciones, escala y polaridad, condición de aplicabilidad, detalle asociado, obligatoriedad, excepciones, fórmula y alertas relacionadas. Conserva los originales. Registra por separado cualquier adaptación del texto para la interfaz.

Debe cubrir lo siguiente:

| Fuente del formulario | Qué debe conservar el producto |
| --- | --- |
| E-AUD-001 | Las cinco secciones iniciales, sus 23 ítems, y los diez ítems adicionales de desarrollo y sentido; también los detalles condicionales |
| F-RAD-001 | Datos físicos declarados, antecedentes, lesiones, medicación, dolor, restricciones, alimentación, actividad, descanso, estrés, autoimagen y proyección |
| F-RAD-002 | Pareja o núcleo íntimo, familia, amistades y entorno laboral, con sus preguntas y escalas |
| F-RAD-003 | Los doce ítems cuantitativos y las tres preguntas de construcción y proyección financiera |
| E-PER-000 | Los nueve componentes: origen y linaje, visión, valores, estándares, identidad, dificultades, personalidad, Ikigai y huella personal |
| E-PER-HdRP-v1 | La integración de respuestas, criterios, prioridades y compromisos en una hoja de ruta revisable |
| RESUMEN y auxiliares | Referencias para resultados, opciones y fórmulas; no convertir automáticamente sus celdas en preguntas nuevas |

El mismo Excel incluye una hoja denominada `E-PER-HdRP-v2`. Para evitar ambigüedad, usa `E-PER-HdRP-v1` como plantilla de integración de esta entrega. Esa elección no debe eliminar ninguna pregunta de los instrumentos anteriores. Las respuestas ya recogidas se reutilizan en la síntesis: no se pide a la persona escribir todo otra vez.

Preserva especialmente las partes que suelen perderse al digitalizar:

- Visión de largo plazo y del martes ordinario; experiencias valiosas por sí mismas; prioridades existenciales.
- Hasta diez valores, elección de tres esenciales y razones; conductas y estándares que los hacen visibles.
- Fuentes de desarrollo: trascendencia, familia, amistad y trabajo significativo, con la posibilidad de adaptar lo que no corresponde a la vida de la persona.
- Los diez ítems de identidad; los 45 de dificultades y recursos; los quince de personalidad, incluidos sus inversos.
- Ikigai: actividades concretas en cuatro campos, opciones auxiliares, cruce y formulación de hipótesis. No sustituirlo por cuatro preguntas genéricas.
- Las preguntas de huella y contribución, sin reducir propósito a empleo o dinero.

Desconocer el origen familiar, no tener pareja, no conocer el porcentaje de grasa o no profesar una religión no obliga a inventar una respuesta ni a obtener información para continuar. La adaptación debe quedar registrada como tal y no alterar silenciosamente una escala. Las observaciones internas del facilitador no son diagnósticos automáticos ni mensajes para culpar al usuario.

Al finalizar, entrega una tabla de cobertura fuente → identificador → pantalla → prueba o comprobación. Toda omisión debe estar explicada como resultado calculado, auxiliar, duplicación o condición, no simplemente desaparecer.

**4. Puntajes fieles, sin fabricar una medición global**

Separa cuatro cosas en datos y en interfaz: progreso del formulario, puntaje nativo de un instrumento, interpretación descriptiva y nuevo índice de producto. Guarda respuestas originales y versión de cálculo. No puntúes textos abiertos por extensión ni uses un modelo de lenguaje para asignar números.

| Instrumento | Regla de implementación |
| --- | --- |
| Auditoría inicial | Los 23 ítems de las cinco primeras secciones suman de 23 a 115. Las secciones tienen 5/5/5/4/4 ítems. Los diez ítems posteriores no entran a ese total |
| Desarrollo y sentido | Mostrar las diez respuestas y una lectura descriptiva separada. No inventar bandas clínicas ni agregarlas a 115 |
| Relaciones y finanzas | Cada instrumento tiene doce valoraciones 1–5: total de 12 a 60 cuando están todas. Verificar fórmulas y cortes en su hoja antes de portar etiquetas del código actual |
| Identidad | Diez respuestas 1–4: total de 10 a 40. El total se conserva aunque una etiqueta de clasificación esté en revisión |
| Dificultades y recursos | Cinco grupos de nueve ítems: Sí=2, Más o menos=1, No=0; cada grupo suma 0–18. PR, ER, PY y D describen interferencias; IN describe recursos de integración. Presentarlos separados |
| Personalidad | Cinco factores con sus tres ítems y polaridades originales. Un factor necesita sus respuestas para una lectura completa. Mayor puntuación no significa una persona mejor |
| Ikigai | Capturar y mostrar las valoraciones originales por actividad y campo, con su escala y procedencia. Comparar opciones sin declarar que la mayor suma descubre un propósito verdadero |
| Radiografía física | Mostrar medidas y declaraciones con unidades y contexto. No inventar un índice global de salud ni convertir medidas corporales en virtud o alineación |

No reemplaces faltantes por cero ni por una respuesta media. Muestra cobertura y resultados parciales como parciales. Una excepción `No aplica` no habilita renormalizar un instrumento a su máximo original. Las reevaluaciones generan nuevas lecturas fechadas; nunca sobrescriben la foto inicial.

Resuelve estas discrepancias con decisiones explícitas para poder avanzar:

- `RESUMEN!D15` promedia porcentajes de secciones de distinta longitud; no equivale al total dividido por 115. No llames a ninguna de esas dos cifras «índice global de alineación». El total nativo es el dato principal.
- La auditoría usa cortes de total menores que 46, 69 y 92, hasta 115. Si muestras sus bandas, indica que son categorías del formulario, no evaluaciones clínicas. La devolución debe describir respuestas y necesidades, sin declarar que alguien es dominante, inferior o incapaz.
- `E-PER-000!D88` deja 34 y 35 sin una clasificación válida y difiere del marco en otros límites. Para esta entrega, muestra el total de identidad con una devolución descriptiva y deja la categoría formal en definición. No mostrar `FALSE`, asignar una banda oculta o frenar el resto del producto.
- Dificultades: el Excel mezcla cinco grupos en un total de hasta 90, mientras RESUMEN declara 40. El marco describe otro instrumento de diez ítems. Implementa los 45 ítems del Excel y sus cinco totales; no uses la clasificación general mezclada, el máximo 40 ni el instrumento alternativo.
- Personalidad: las respuestas vacías no pueden producir `#DIV/0!`, ceros ni un arquetipo. Comprueba que el factor N esté nombrado según la polaridad real: sensibilidad/neuroticismo y estabilidad no son intercambiables.

Documenta estas decisiones en un archivo corto junto al código. No conviertas las discrepancias en una ronda de reuniones que impida implementar captura, puntajes válidos y seguimiento.

**5. Índice de alineación: una propuesta independiente y transparente**

El requisito previo incluye puntajes e índice de alineación. formulario no trae una fórmula global verificable para ese índice. Por eso implementa, como capa de producto separada, la propuesta `IAD-MK 0.1 — borrador`, denominada en la interfaz «Alineación declarada». No procede de v2, no es una fórmula aprobada del formulario o Rafa y no es un test validado.

Todos reciben la posibilidad de completar esta ficha al revisar su devolución. Presenta sus referencias tomadas del formulario y, en seguimientos, de decisiones y registros reales. Es una ficha breve; no reemplaza ningún ítem original. Declinar o desconocer una respuesta deja el índice pendiente y no bloquea el plan.

| Criterio | Pregunta a responder |
| --- | --- |
| E1 · Dirección | ¿Qué tan clara y propia es la dirección que elijo ahora, aunque todavía la esté explorando? |
| E2 · Valores y razones | ¿Qué tan claramente puedo explicar los valores y razones que sostienen esa dirección y qué quiero proteger? |
| E3 · Contribución | ¿Qué tan concretamente puedo reconocer a quién o a qué quiero beneficiar o cuidar? |
| M1 · Prioridades | En los últimos 14 días, ¿qué tan coherentes fueron mis decisiones de prioridad con esa dirección y mis valores? |
| M2 · Estructura | ¿Qué tan practicable es mi organización para avanzar o sostenerla con mis recursos, capacidad y responsabilidades reales? |
| M3 · Revisión | En los últimos 14 días, ¿qué tan deliberadamente revisé lo que funcionaba y mantuve o ajusté mi estrategia? |
| C1 · Acciones | En los últimos 14 días, ¿qué tan coherentes fueron mis acciones reales con lo que declaro importante? |
| C2 · Cuidado corporal | En los últimos 14 días, ¿qué tan coherente fue el cuidado de mi cuerpo, energía y recuperación con mis necesidades y límites? |
| C3 · Tiempo y compromisos | En los últimos 14 días, ¿qué tan coherente fue el tiempo que dediqué a compromisos y prácticas protegidas con esa dirección? |

Usa respuestas explícitas 1–5 y «No tengo información suficiente». Adapta los anclajes a cada criterio: para claridad, de no identificar una referencia a una referencia propia, concreta y explicable; para decisiones y conductas, de contradicción predominante a coherencia sostenida dentro del contexto, con ejemplos. El valor 3 representa una referencia provisional o coherencia parcial. No puntúes certeza absoluta, riqueza, ausencia de enfermedad, cantidad de ejercicio o cumplimiento dentro de MK exclusivamente. Al comenzar pueden usarse experiencias anteriores a la app.

Fórmula de borrador: `n = 25 × (respuesta − 1)`; cada pilar es el promedio de sus tres criterios; el total es el promedio de los tres pilares. Pesos iguales. Calcula un pilar solo con 3/3 y el total solo con 9/9. No imputes ni redistribuyas pesos. Redondea únicamente para mostrar. Una respuesta desconocida no es 1 ni 0.

Guarda versión de método, criterios y respuestas, ventana temporal, dirección de referencia y resultados. E=75, M=50, C=25 debe dar total 50. Si los tres M suben de 3 a 4, el total pasa a 58,33… y C sigue en 25: el promedio no oculta el pilar que necesita atención.

La ficha expresa lo que la persona declara. Muestra junto a ella evidencia y límites de los registros, sin fusionarlos en una puntuación opaca. Hacer muchas tareas no garantiza alineación; obtener un valor mayor no demuestra por sí solo que la app produjo una mejora. Cambiar de dirección puede cambiar la referencia de comparación.

Para profundidad, conserva respuestas, decisiones, hipótesis contrastadas y aprendizajes con fecha y procedencia. En esta entrega muestra esa bitácora y el avance del recorrido con sus nombres. El índice numérico de profundidad queda «En definición» porque no hay fórmulal formulario verificable. No rebautices porcentaje completado, longitud de texto ni cantidad de clics como profundidad personal.

**6. Alertas del formulario y límites que realmente afectan el plan**

Inventaría todas las alertas del formulario: fórmulas, observaciones y detalles cualitativos. Verifica que regla, opciones y polaridad sean coherentes. No uses `evaluateSafety`, preguntas `D-*`, reglas o recomendaciones procedentes de v2. No reduzcas el problema a copiar ocho preguntas de otro instrumento.

Separa la señal original del formulario de la regla operativa de producto. Una respuesta baja puede pedir atención o una aclaración; no diagnostica un trastorno ni demuestra un peligro. No bloquees todo el producto por una señal local y no ocultes alertas mientras se define una fórmula.

Registra para cada señal: pregunta y respuesta de origen, regla y versión, motivo comprensible, ámbito o actividad afectada, información pendiente, alternativas disponibles y estado vigente. Un «no evaluado» o una negativa a contestar no equivalen a «sin restricciones».

Decisiones para esta entrega:

- Auditoría: las secciones 1 y 2 alertan con respuesta 1; la 3 con ≤2; la 4 y 5 usan =2 en el Excel. Conserva la regla original en la trazabilidad y usa ≤2 en 4 y 5 como adaptación de producto versionada para no dejar una respuesta 1 sin atención. Describe «Conviene revisar esta respuesta», sin diagnóstico ni bloqueo automático.
- Sueño: existe una regla de alerta que señala más de seis horas, discordante con su interpretación. No la conviertas en un límite médico ni inviertas el operador suponiendo una recomendación clínica. Conserva la discrepancia y usa la declaración de descanso, dificultades y restricciones para pedir aclaración y adaptar la planificación.
- Enfermedad, medicación, lesiones, dolor o indicaciones de evitar esfuerzos: conserva el dato y sus detalles. No propongas automáticamente intensidad de ejercicio, dietas, suplementos, cambios de medicación o tratamientos. Permite organizar cuidados ya indicados, preparar una consulta y avanzar en tareas compatibles.
- Medidas físicas y antecedentes desconocidos: no fuerces pruebas, compras o exposiciones personales para terminar el formulario. Antes de una recomendación que dependa de esa información, pide solo la aclaración necesaria o ofrece una alternativa que no dependa de ella.
- Relaciones y finanzas: una puntuación baja no prueba violencia, coerción o insolvencia. Si una actividad exige una conversación potencialmente conflictiva o una decisión económica con consecuencias, usa una aclaración breve y explícita sobre su viabilidad y límites. Esta aclaración es una política nueva de producto, no contenido de v2 ni otro test obligatorio.

Las restricciones se aplican a acciones específicas según su mecanismo y el contexto, también en el servidor al confirmar o ejecutar una propuesta. Si cambia una respuesta relevante, reevalúa las acciones futuras; conserva los registros pasados. Una advertencia visual que deja ejecutar la recomendación incompatible no es suficiente. Restringir una recomendación no impide registrar honestamente algo que ya ocurrió, una nota o un resultado.

No deduzcas riesgo grave de palabras aisladas en un texto. Si la persona declara una situación urgente o insegura, prioriza orientación de apoyo pertinente y deja disponibles las funciones inocuas. No inventes contactos de emergencia ni garantices vigilancia humana. No ofrezcas como alternativa una confrontación, una inversión riesgosa o un esfuerzo físico para compensar una restricción.

**7. Propósito posible, provisional o todavía desconocido**

Integra los nueve componentes y las radiografías en una Hoja de Ruta de Propósito editable: visión, valores y estándares elegidos, capacidades, contribución, tensiones reconocidas, condiciones que proteger, prioridades y preguntas todavía abiertas. Muestra de qué respuestas surge cada propuesta y permite corregirla. Una plantilla rellenada automáticamente es un borrador, no una declaración firmada.

Ofrece estas salidas explícitas:

- `EXPLORANDO`: aún no elijo una hipótesis de propósito; puedo declarar valores, una inquietud o una responsabilidad que quiero cuidar.
- `PROVISIONAL`: elijo una dirección suficientemente útil para ponerla a prueba.
- `CONFIRMADO_POR_USUARIO`: adopto esta formulación como referencia actual. Sigue siendo revisable, no una verdad certificada por la app.

`NO_TRABAJADO` distingue a quien todavía no revisó la síntesis. No conviertas `EXPLORANDO` en fracaso ni le pidas confirmar un propósito ficticio para avanzar. Tras completar el formulario y revisar la síntesis, cualquiera de las tres salidas trabajadas permite un plan compatible. Si no hay dirección, el vínculo será exploratorio o de cuidado/prioridad concreta; no lo presentes como alineación con un propósito ya definido.

La app puede proponer formulaciones y reconocer tensiones, siempre con referencias visibles. No necesita una API de IA nueva para funcionar: comienza con reglas transparentes, respuestas elegidas y plantillas editables. Si ya existe IA, úsala para ayudar a redactar propuestas; nunca como árbitro de puntajes, riesgos, autenticidad o decisiones vitales. Una contradicción entre respuestas se presenta como pregunta, no se resuelve inventando cuál es la verdadera.

En Ikigai conserva actividades, cuatro campos, cruce, hipótesis y evidencia. Si las fórmulas matriciales no aparecen en una extracción simple, lee su expresión y las validaciones originales. No sustituir un `ArrayFormula` por un número inventado. La ausencia de un cruce perfecto es una salida válida.

Una persona puede formular varias hipótesis sin elegir ninguna. Un experimento solo se convierte en plan cuando lo selecciona. Incluye una experiencia pequeña y reversible, una pregunta concreta que observar y una fecha de revisión. El propósito puede expresarse en familia, obra, servicio, trabajo o una combinación. No fuerces monetizar todas las contribuciones.

Los arquetipos sirven como lentes de reflexión del marco público. Mantén su explicación y, si se utilizan, una interpretación elegida o revisada por la persona. No asignes un arquetipo dominante mediante una fórmula inexistente, valores vacíos, personalidad convertida en destino o un vector heredado de v2.

La HdRP conserva versiones y puede exportarse en un formato legible. Sus compromisos son revisables. El cronograma del Excel es una referencia que se puede adaptar; no una promesa de cambios físicos, financieros o psicológicos en plazos fijos. La capa Cuerpo incluye todas las acciones que materializan la dirección y el cuidado del soporte físico; no exige que cada plan sea de entrenamiento.

**8. Del perfil a una prioridad elegida**

La devolución debe contestar: «¿Qué veo en mis respuestas?», «¿Qué podría necesitar atención?», «¿Qué quiero construir o proteger primero?» y «¿Por qué este movimiento sería razonable ahora?». Muestra pocas conclusiones relevantes, con acceso a la profundidad completa. No presentes una pared de puntajes ni selecciones automáticamente el ámbito más bajo.

Propón prioridades a partir de necesidades declaradas, valores, dirección, respuestas que la persona reconoce, límites, obligaciones y capacidad actual. Explica la razón y permite corregirla. Distingue un objetivo elegido de una obligación urgente y de una condición que lo habilita. Una restricción puede cambiar la secuencia sin convertir todo el producto en una intervención sobre ese ámbito.

Antes del plan recoge únicamente el contexto operativo que falta: tiempo disponible, horarios o ventanas reales, recursos necesarios, responsabilidades protegidas y límites pertinentes. `Cero tiempo disponible` no equivale a dato desconocido; capacidad cero habilita pausa o cuidado, no un plan imposible. No exigir detalles financieros o médicos que esa acción no necesita.

No declares causalidad desde un cuestionario. «Podría estar interfiriendo; ¿lo reconoces?» es una hipótesis. «Tu falta de disciplina causa tus deudas» es una conclusión que el producto no puede sostener. Admite circunstancias externas reales y prioridades que no buscan maximizar productividad.

**9. Un plan que la persona pueda ejecutar y evaluar**

El plan contiene: resultado buscado, situación inicial conocida o por observar, señal de avance, fecha o ventana de revisión, vínculo elegido con la HdRP, pasos, acciones, capacidad comprometida y límites. El resultado puede ser cuantitativo o cualitativo verificable; no fuerces números arbitrarios a vínculos, claridad o cuidado.

El vínculo tiene una explicación confirmada por la persona:

- Directo: construye algo de la dirección elegida.
- Habilitante: libera una condición necesaria para avanzar.
- Protector: cuida un valor, responsabilidad o soporte que no quiere sacrificar.
- Exploratorio: permite aprender sobre una hipótesis o decidir entre opciones.

No basta una etiqueta de pilar. Debe poder contestar «¿Por qué quiero hacer esto y qué estoy protegiendo?». Si el propósito cambia, pide revisar ese vínculo; no actualices silenciosamente el sentido de un plan histórico.

Por defecto ofrece un objetivo principal activo y, si cabe dentro de la capacidad, una práctica de mantenimiento. Es una política reversible de producto para reducir dispersión; no viene del formulario. No actives automáticamente un plan por ámbito, pilar o dificultad. Conserva los planes heredados y permite reorganizarlos explícitamente.

Cada acción necesita verbo, objeto o resultado, una ocasión o ventana, duración estimada cuando sea útil, criterio de terminación y una opción mínima si corresponde. Un hábito puede implementarse como acción recurrente con su frecuencia y condiciones; no requiere otro subsistema independiente. Un mínimo puede reducirse, pero no sustituir un resultado distinto sin avisar.

Ofrece ayuda para preparar el trabajo, no solo mensajes de motivación. Crea una colección pequeña de guías de producto nuevas, sin reciclar actividades de v2. Incluye al menos: convertir una intención en resultado; elegir prioridades y renuncias; planificar una semana real; iniciar una tarea y reducir fricción; aprender una habilidad con práctica y feedback; traducir un valor en estándar; preparar una conversación compatible; ordenar información para una decisión económica; organizar un cuidado o preparar una consulta; explorar una hipótesis de propósito; revisar y ajustar.

Cada guía debe estar escrita y usable: cuándo sirve, requisitos y límites, pasos concretos, ejemplo, salida que se guarda y criterio de finalización. Puede producir un esquema, un borrador, una agenda, una decisión, una lista de información o un experimento. No rellenes la colección con decenas de títulos vacíos. No generes planes clínicos, asesoría de inversión personalizada ni conversaciones que ignoren una situación insegura.

Las guías son herramientas para construir el plan, no un curso obligatorio adicional. Si una ayuda no resuelve el bloqueo, permite registrarlo y elegir otro paso; no obligues a repetir el contenido para desbloquear la app.

Usa estos ejemplos ficticios para comprobar que el producto entrega algo concreto, sin convertirlos en planes universales:

- Quien valora la presencia familiar puede elegir un espacio semanal sin pantallas, acordar cuándo cabe y observar si logró la presencia que buscaba. Si cumplió el horario pero siguió distraído, la revisión modifica las condiciones, no celebra solo los minutos.
- Quien explora enseñar puede preparar un esquema breve, probar una explicación con alguien que acepte y registrar qué disfrutó, qué pudo aportar y qué necesita aprender. Un experimento poco convincente puede descartar esa hipótesis: también produjo un resultado útil.
- Quien quiere sostener un proyecto pero declara una limitación física puede planificar una tarea compatible y organizar la consulta o el cuidado que necesita. La app no condiciona el avance a entrenar ni propone superar el dolor con voluntad.

**10. Ejecución y seguimiento que cambian algo**

«Hoy» muestra qué acción toca, por qué importa, cómo empezar, su criterio de terminación y dónde registrar lo ocurrido. Una tarjeta debe permitir actuar sin buscar entre el perfil y varias páginas. Desde una acción se puede volver a su objetivo y a la razón que la conecta con la HdRP.

Registra realizada, parcial, no realizada, reprogramada, no aplicable a esa ocasión y sin información. Permite una nota o salida útil, sin exigir una reflexión extensa cada vez. Una acción realizada no implica que se consiguió el resultado; separa actividad, resultado observado y aprendizaje. Las acciones espontáneas pueden registrarse sin inflar el cumplimiento programado.

Reprogramar conserva el compromiso original y crea una nueva ocasión relacionada. Nunca borres retrospectivamente una falta para fabricar una racha. Una ocasión todavía abierta no es incumplimiento. `Sin registro` no prueba que la persona no actuó. No mezcles pausas, ocasiones futuras y desconocidos en un denominador único.

Revisión sugerida cada siete días, ajustable: qué se intentó, qué ocurrió, qué cambió en el resultado, qué ayudó, qué obstaculizó, qué aprendió y qué quiere mantener, reducir, sustituir, pausar o cerrar. La ficha de alineación se ofrece cada catorce días; no obliga a reevaluar formulario ni a aumentar el número.

Las decisiones de revisión se aplican realmente al plan y sus acciones futuras, en una nueva versión. Guardar una selección «reducir» sin reducir nada incumple la entrega. Muéstrale antes los cambios y después el plan resultante. Permite cerrar por logro, cambio de prioridad, pérdida de sentido o imposibilidad; cerrar un plan no siempre significa fracasar.

Si una acción se cumple y el resultado no cambia, revisa su utilidad, el indicador y los supuestos. Si no se cumple, distingue capacidad, diseño, restricciones, falta de claridad y prioridades en conflicto antes de sugerir más disciplina. No conviertas toda fricción en sombra, resistencia o autoengaño.

Al volver tras una ausencia, muestra dónde quedó, qué sigue vigente y qué conviene revisar. Pide actualizar solo el contexto relevante. Conserva desconocidas las ocasiones pasadas sin registro. Si el plan ya no tiene sentido, permite pausarlo o reemplazarlo sin rehacer toda su identidad.

**11. Integridad, permisos y continuidad sin sobrediseñar**

Implementa los contratos mínimos para soportar el ciclo: catálogo del formulario versionado, respuestas y excepciones, lecturas puntuadas, síntesis/dirección, contexto relevante, alertas, plan y versiones, acciones y ocasiones, observaciones, revisión aplicada e índices. Adapta las entidades existentes cuando sea viable; esta lista describe responsabilidades, no exige una tabla por nombre ni una arquitectura nueva completa.

Invariantes necesarios:

- Una síntesis confirmada y una versión de plan son fotografías estables. Leerlas después de editar una respuesta no las reconstruye como si se hubieran confirmado de nuevo.
- Una propuesta identifica las versiones relevantes de respuestas, dirección, restricciones, contexto y plan que utilizó. Una revisión incluye los registros y resultados que tomó como base. Si cambia un dato relevante entre vista previa y confirmación, se invalida esa propuesta y se prepara otra.
- Aplicar una revisión es una operación atómica y con control de versión. Repetir la misma petición no duplica versiones, ocasiones ni efectos. La misma clave con contenido diferente no debe aceptarse como la operación anterior. Dos pestañas no pueden reemplazar decisiones mutuamente sin detectar conflicto.
- Las ocasiones programadas conservan identidad y relación con la versión que las creó. Materialízalas de forma idempotente y renueva su horizonte al consultar y al revisar; no dejes el plan sin acciones tras la primera semana. Ajustar una acción afecta su futuro, no los registros pasados.
- Fechas y ventanas se calculan con zona horaria explícita del miembro. Pide o confirma la zona; no tomes una zona por defecto como un hecho. Verifica cambios de día, horario de verano y revisiones tardías.
- Autoguardado con estados visibles guardando/guardado/error/conflicto. Un error de red no muestra guardado ni descarta texto. Resolver un conflicto conserva ambas versiones recuperables. No prometas uso sin conexión si no lo implementas.
- El servidor valida propiedad, permisos, contexto y restricciones; no depende de ocultar botones. Las respuestas privadas y las inferencias no se habilitan a administradores, asesores ni terceros por defecto.
- Los fixtures y simulaciones usan datos ficticios identificados y reloj controlado. No envían correos, cobran ni generan métricas de usuarios reales. Las herramientas internas permanecen protegidas en el servidor.

Comprueba la política efectiva de acceso actual. Conserva los permisos de miembros ya autorizados. No crees un muro de pago ni amplíes permisos para hacer coincidir el código con un texto comercial. Si el área funciona para toda cuenta autenticada, el nuevo recorrido conserva ese acceso y el estado público se describe según su habilitación real.

Migraciones aditivas y reversibles cuando sea posible, ensayadas sobre una copia o fixtures representativos. No borres planes, firmas, resultados o sesiones antiguas. Mapea respuestas heredadas al formulario solo si hay equivalencia comprobada de pregunta, escala y versión; el resto queda histórico y pendiente de completar, sin duplicaciones silenciosas.

El Ikigai público o anónimo y el Ikigai del miembro pueden tener permisos diferentes. No confíes en un ID de sesión como autorización ni atribuyas una sesión por coincidencia de correo. Mantén las rutas y datos existentes; un traspaso exige prueba de control de la sesión y de la cuenta. Si no existe ese mecanismo, permite conservar el trabajo anterior sin afirmar que ya está vinculado.

Comprueba la elegibilidad para mayores de 18 años antes de recoger las respuestas sensibles, en coherencia con la política pública actual. No deduzcas edad de nombres o textos ni uses una excepción del formulario para eludir esa elegibilidad. Conserva los mecanismos existentes que sean correctos.

No escribas respuestas íntimas en logs, analítica o eventos de error. Usa métricas de estado y conteos sin texto personal. Los cambios a datos compartidos con terceros, consentimientos o políticas deben reflejar el tratamiento real; no inventes una aprobación legal.

**12. Una interfaz de producto, integrada con MK**

Usa el sistema visual y los componentes existentes. Cada pantalla debe expresar una tarea principal y permitir acceder al detalle. El perfil muestra una síntesis útil, con sus fuentes y pendientes; la profundidad vive en las respuestas, ejercicios y decisiones, no en obligar a leer todas las tarjetas al volver.

Mantén un hilo reconocible: Formulario → Perfil/HdRP → Ruta → Hoy → Revisión. No construyas islas con navegación distinta para cada componente. Comprueba compatibilidad entre el contenedor de miembros y el del Ikigai público; reutilizar diseño no significa aplicar permisos equivocados.

Verifica formulario largo, escalas y ejercicios en 320–390 px y escritorio, sin scroll horizontal. Etiquetas y controles accesibles, teclado, foco visible, mensajes de error vinculados, estados que no dependan solo del color y respeto de movimiento reducido. Los ejemplos orientan; no se guardan como respuestas reales sin una elección explícita.

No muestres al usuario nombres de motores, versiones internas, estados de base de datos o decisiones de ingeniería. La explicación metodológica sí debe ser accesible: qué se mide, de dónde sale y por qué un resultado puede estar pendiente. No conviertas el onboarding en una lista de descargos repetitivos.

**13. Alinea las páginas públicas con lo implementado**

Se revisaron las páginas públicas principales enlazadas del sitio el 7 de octubre de 2026. Esto no equivale a haber inspeccionado todas las rutas privadas de la aplicación. Vuelve a comprobarlas dentro del repositorio porque el contenido y la disponibilidad pueden cambiar.

| Página pública | Promesa o estado observado | Implicación para esta entrega |
| --- | --- | --- |
| [Inicio](https://maximus-kratos.com/) | Diagnóstico, dirección, planes, hábitos y revisión; cuenta de fundador disponible y producto en desarrollo | El recorrido debe conectar esas funciones. El copy debe distinguir desarrollo, prueba y disponibilidad real |
| [Producto](https://maximus-kratos.com/sistema) | Perfil con índices, continuidad del historial y revisión; anuncia también apps, misiones y notificaciones futuras | Implementar el ciclo web y explicar el borrador de alineación. Profundidad numérica y funciones adicionales conservan su estado pendiente |
| [Método](https://maximus-kratos.com/marco-central) | Nueve componentes, HdRP, arquetipos y tres pilares observados en cuatro ámbitos | Conservar la profundidad del formulario y sus salidas. Los arquetipos no se convierten en clasificación automática sin método |
| [Manifiesto](https://maximus-kratos.com/manifiesto) | Arquitectura personal con sentido, acciones, memoria y ajuste | La práctica debe mostrar decisiones y cambios reales, con responsabilidad sin culpabilizar por enfermedad o circunstancias |
| [Ikigai](https://maximus-kratos.com/ikigai) | Actividades, cuatro campos, hipótesis y contraste con experiencias | Integrarlo a la dirección y a planes elegidos; permitir incertidumbre y alternativas |
| [Precios](https://maximus-kratos.com/precios) | Un mismo acceso con distintas frecuencias; registro sin cobro y prueba anunciada para la activación | No inventar precios ni activar pagos. Verificar estado de fundador y de prueba antes de afirmar que están operativos |
| [Eventos](https://maximus-kratos.com/eventos) | Jornada futura y lista de espera, sin evento activo | Conservar su carácter futuro; no fabricar reservas, calendario ni participación |
| [Contacto](https://maximus-kratos.com/contacto) | Canal humano de consultas, con plazo de respuesta publicado | No presentar ese canal como atención clínica, vigilancia de alertas ni acompañamiento incluido |
| [Términos](https://maximus-kratos.com/terminos) | Herramientas de acompañamiento sin resultados específicos garantizados | Las propuestas y puntajes no garantizan transformación ni sustituyen servicios especializados |
| [Privacidad](https://maximus-kratos.com/privacidad) | Uso y protección de datos; producto dirigido a mayores de 18 años | Implementar acceso privado y elegibilidad coherente. Preparar el texto para datos de salud, finanzas y reflexión realmente recogidos |

Mantén un criterio único de disponibilidad para las páginas y la app. Hoy el sitio presenta el núcleo como futuro. Preparar una implementación local no autoriza anunciarla como lanzada. Al habilitarse una prueba, el texto debe describir quién puede acceder y qué está operativo.

Hay una promesa de lanzamiento simultáneo de web, iOS y Android en Producto. Esta entrega web no la demuestra. Prepara una corrección que diferencie pruebas web de apps nativas futuras; no marques las apps como disponibles ni retrases el desarrollo web hasta construirlas. Deja las modificaciones listas para revisar, sin publicar.

El modelo de producto es un único sistema de seguimiento: la entrada profunda construye la referencia y el uso recurrente ayuda a ejecutar, revisar y ajustar. Las frecuencias de cobro no son niveles de metodología. No añadas un servicio humano implícito ni supongas que el cuestionario por sí solo justifica una suscripción.

**14. Comprueba los casos que pueden romper la utilidad**

Usa pruebas de dominio e integración para cálculos, permisos, persistencia, versiones y revisión. Usa recorridos completos para la experiencia; no llenes el proyecto de pruebas que solo repiten JSX. Simula personas plausibles, sin afirmar que esas simulaciones validan eficacia.

| Caso | Resultado exigido |
| --- | --- |
| Persona nueva, dirección clara | formulario completo → puntajes → HdRP revisada → prioridad elegida → plan → acción registrada → revisión que cambia el plan |
| formulario completado, sin propósito | Estado explorando; plan exploratorio o de prioridad/cuidado explícito sin propósito ficticio ni bloqueo |
| No conoce linaje, no tiene pareja o rechaza una pregunta | Excepción clara, sin respuesta inventada ni puntaje final falso; puede continuar el recorrido |
| Tres valores y estándares incompatibles con su agenda | La app muestra la tensión y permite priorizar, ajustar o pausar; no confirma compromisos imposibles |
| Lesión o restricción de esfuerzos | Una propuesta incompatible no se confirma; existe una alternativa útil y no clínica |
| Dato relevante de seguridad desconocido | No se asume ausencia de restricciones; se aclara lo necesario o se usa una alternativa compatible |
| Puntaje financiero bajo y meta ambiciosa | Se priorizan condiciones y obligaciones; no se propone inversión personalizada ni endeudamiento para seguir la ruta |
| Familia o relación difícil | No se atribuye automáticamente culpa ni se exige contacto o confrontación para completar un plan |
| Identidad 34 o 35; dificultades completas | Total correcto, sin `FALSE`; cinco lecturas separadas, sin máximo 40 ni total mezclado |
| Ítem inverso o un faltante | Polaridad correcta; cobertura explícita y ningún índice completo fabricado |
| Ficha IAD completa o parcial | Mínimo 0, máximo 100, ejemplo 50 y 58,33… correctos; sin total con menos de 9/9 |
| Cuestionario en móvil y red intermitente | Guarda, pausa y retoma sin perder respuestas; errores de guardado son visibles y recuperables |
| Dos pestañas y doble envío | Detecta conflicto; una confirmación repetida no crea dos planes o dos revisiones |
| Cambio de propósito o restricción después de una vista previa | Recalcula la propuesta afectada; conserva el historial; no ejecuta una decisión obsoleta |
| Capacidad cero o recurso indispensable ausente | Pausa o preparación viable; no interpreta ausencia como disponibilidad ni llena toda la agenda |
| Acción parcial, espontánea, reprogramada o sin registro | Estados y denominadores honestos, sin éxito ni fracaso inventados |
| Dos semanas sin volver o revisión tardía | Retoma contexto, conserva desconocidos pasados y vuelve a ofrecer ocasiones futuras sin duplicarlas |
| Cumple acciones pero no avanza el resultado | La revisión permite cambiar estrategia e indicador, no solo exigir más constancia |
| Plan y firma heredados o sesión Ikigai anónima | No pierde datos ni acceso; solo mapea equivalencias verificadas; no atribuye sesiones ajenas |
| Usuario intenta acceder a datos de otro o a simulación interna | El servidor lo rechaza; fixtures no envían mensajes ni contaminan actividad real |

Añade extremos de rangos, cadenas largas, texto que podría inyectar HTML, cambios de zona y límites temporales en las comprobaciones pertinentes. El contenido introducido se renderiza escapado. Prueba también el retorno al día siguiente y después de una revisión, no solo el camino feliz de una sesión.

**15. Orden de trabajo y condición de cierre**

Implementa en entregas que ya se puedan recorrer:

1. Inventario y catálogo del formulario completo; captura, excepciones, autoguardado, alertas y puntajes correctos.
2. Devolución, HdRP, estados de dirección, IAD separado y preparación de un plan con ayuda útil.
3. Ejecución, resultados, revisión aplicada, versiones y continuidad de datos heredados.
4. Casos críticos, experiencia móvil, permisos, copy público preparado y evidencia de funcionamiento.

No te detengas después del catálogo o del perfil. La aceptación requiere un recorrido persistido desde una cuenta nueva hasta una revisión aplicada que modifica acciones futuras, y un segundo recorrido completo sin propósito definido. Las decisiones pendientes de método no bloquean resultados que sí pueden calcularse ni el seguimiento útil.

Además verifica:

- Cobertura completa demostrada contra el Excel y ausencia de dependencias de v2 en el nuevo recorrido, incluido el contenido recomendado.
- Lecturas y síntesis que explican su fuente, límites y pendientes; ninguna clasificación inventada presentada como original.
- Alertas con efecto real sobre propuestas incompatibles y alternativas disponibles.
- Una persona entiende qué hacer, por qué, cómo empezarlo y cómo evaluar lo ocurrido.
- El avance se conserva al salir, volver, actualizar respuestas y cambiar de prioridad.
- La revisión cambia el plan de forma atómica e idempotente, con historia estable.
- El estado público, el acceso y las funciones disponibles coinciden sin anunciar un lanzamiento inexistente.

Ejecuta los comandos de validación pertinentes que el repositorio use. Reporta los resultados reales; no inventes pruebas, capturas ni verificación visual. Distingue fallos previos de los introducidos. Si falta una dependencia externa, implementa y verifica todo lo independiente, indica el bloqueo concreto y deja el punto de continuación.

Entrega al terminar: cambios realizados y razón, tabla de cobertura del formulario, decisiones metodológicas y adaptaciones explícitas, pruebas ejecutadas con evidencia, escenarios completos, limitaciones pendientes y pasos precisos para ejecutar la app. No despliegues, cobres ni envíes comunicaciones reales en esta tarea.

**16. Qué significa viable y cómo empezaremos a comprobarlo**

Esta implementación debe resolver tres trabajos: entender qué vale la pena priorizar, convertirlo en una acción viable y usar lo ocurrido para mejorar la decisión siguiente. Cada uno debe poder observarse en el producto. Los puntajes ayudan a leer el punto de partida; no son el resultado que vendemos.

Instrumenta eventos mínimos sin contenido personal: inicio y avance por bloque, recorrido terminado, síntesis revisada con su estado, plan confirmado, primera acción registrada, revisión aplicada y retorno. Distingue usuarios reales de fixtures. La primera señal de activación es un ciclo ejecutado y revisado; completar preguntas es una señal intermedia.

Prepara una prueba inicial con cinco personas reales cuando el ciclo esté operativo. Observa sin guiarlas por cada pantalla: dónde abandonan el formulario, si entienden la devolución, si reconocen la prioridad, si pueden ejecutar el primer paso y si vuelven para revisar. Recoge qué decisión cambió y qué resultó útil. No añadas correos automáticos ni contactes personas sin una instrucción independiente.

No hay evidencia todavía para afirmar que el producto es perfecto o que la metodología genera los resultados prometidos. La simulación verifica coherencia, límites y funcionamiento; las personas reales deben comprobar utilidad, esfuerzo aceptable y disposición a sostener el uso. Corrige esos problemas sin recortar silenciosamente la metodología ni agregar más módulos como respuesta automática.

Empieza a trabajar ahora en el repositorio con estas decisiones. Conserva la profundidad del formulario y entrega el ciclo completo que la convierte en un producto útil.
