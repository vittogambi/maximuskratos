---
name: mk-ui-surface
description: Audit or fix an MK web surface against the product UI contract. Use when a page drifts from its shell, type, tokens, or mobile behavior.
---

# MK UI surface

1. Clasificar la superficie: marketing, player, miembros, diagnóstico o admin.
2. Leer `DESIGN.md` y la regla de esa superficie (`mk-public-ui`, `mk-player-ui`, `mk-member-ui`, `mk-admin-ui`).
3. Inspeccionar la referencia visual de esa superficie y los componentes compartidos que ya la implementan.
4. Corregir el shell y los componentes compartidos. No copiar un sistema paralelo ni conservar un defecto por reutilizarlo.
5. Verificar móvil (320, 375, 390) y escritorio (1440). Incluir error, texto largo, loading y datos ausentes cuando la pantalla los tiene.
6. Registrar capturas y el comando de prueba.

Marketing monta `PublicLayout`. El player monta `IkigaiShell`. Miembros montan `AppShell`. Admin monta `AdminShell`. No imponer nav, footer ni motion de marketing a las otras superficies.

No cambiar metodología, acceso, sesiones, cálculos ni persistencia salvo instrucción explícita.
