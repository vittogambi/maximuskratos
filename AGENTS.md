# Cómo ejecutar en MK

Esto aplica a cualquier tarea del repositorio. No lo recites en la respuesta.

## Autonomía

Resuelve autónomamente decisiones rutinarias, reversibles y compatibles con el encargo. Explica supuestos materiales. Pregunta cuando falte una decisión que cambie el significado del producto, comprometa datos o implique una acción externa no autorizada. Continúa el trabajo independiente mientras una decisión esté pendiente.

Si el encargo ya pide ejecutar, no hace falta una aprobación intermedia entre el diagnóstico y la implementación.

Esto no anula una instrucción de mayor prioridad ni un control del entorno. Si una instrucción externa obliga a detenerse, nómbrala y continúa solo con la parte del encargo que esa instrucción deja libre.

## Alcance

Una corrección puede incluir el componente compartido y sus consumidores afectados. Un encargo de rediseño permite reorganizar la interfaz dentro de su alcance. Evita refactors ajenos al objetivo. No uses un cambio mínimo como excusa para dejar una solución incompleta.

## Cierre

Cuando el encargo sea ejecutar, inspecciona, implementa y verifica. No termines después del primer hallazgo si quedan partes autorizadas y ejecutables. Mantén un checkpoint si el trabajo es largo.

## Verificación

Prueba los contratos afectados y los consumidores de componentes compartidos. Amplía las pruebas solo para cubrir un riesgo concreto o un gate obligatorio. No agregues suites redundantes ni repitas toda la aplicación por un cambio local.

Para cambios visibles, usa navegador y examina las capturas. Comprueba móvil primero. Elige tamaños y estados según el componente afectado. Los cambios de shell requieren cobertura más amplia. No declares verificación visual si solo ejecutaste tests de componentes.

Distingue implementación, verificación y observación humana. Un HTTP 200 no acredita un recorrido completo. Documenta preparación por fixtures y acciones realizadas por UI.

Reutiliza evidencia vigente. Repite cuando cambie el comportamiento relevante. Conserva una única lista de pendientes para evitar reiniciar auditorías y duplicar informes.

## Respuestas

Español natural, preciso y sin repetir la misma idea. Separa hechos, supuestos y decisiones pendientes.

## Dónde mirar

- Ejecución de trabajo: este archivo.
- Ciclo viable de miembros: `PRODUCTO_VIABLE.md`. Entornos locales paralelos y Playwright: su sección 13.
- Diseño de interfaz: `DESIGN.md` y `.cursor/rules/mk-ui-contract.mdc`. La regla de superficie se activa por los archivos que tocas.
- Copy y voz: `.cursor/rules/voz-y-copy.mdc`.
- Matriz v2: `.cursor/rules/matrix-v2-frozen.mdc`.
- Prosa editorial: `.agents/skills/no-ai-slop/`, solo si el encargo es editar o revisar un borrador.
- Auditoría de una pantalla: `.agents/skills/mk-ui-surface/`.

No cambies acceso, sesiones, cálculos ni persistencia salvo encargo explícito.
