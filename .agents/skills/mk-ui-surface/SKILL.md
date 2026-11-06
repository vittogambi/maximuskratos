---
name: mk-ui-surface
description: Audit or fix an MK web screen against its shell and DESIGN.md. Use when a page drifts from its surface, type, tokens, or mobile behavior. Do not use for API-only work or methodology changes.
---

# Superficie UI

1. Nombra la superficie: marketing, miembros, cuestionario, IKIGAI independiente o admin. Acceso no es ninguna de esas.
2. Lee `DESIGN.md` y la regla de esa superficie: `mk-public-ui`, `mk-member-ui`, `mk-questionnaire-ui`, `mk-player-ui` (solo IKIGAI) o `mk-admin-ui`.
3. Corrige el shell compartido y los componentes que ya cubren el caso. Revisa los consumidores que el cambio afecte.
4. Verifica como dice `AGENTS.md`: navegador, móvil primero, tamaños según el componente. Un cambio de shell mira más anchos y estados.

Marketing usa `PublicLayout`. Miembros usan `AppShell`. El cuestionario usa `.dk-shell`. IKIGAI usa `IkigaiShell`. Admin usa `AdminShell`. No pases nav, footer ni motion de marketing a las otras. No uses `IkigaiShell` en el cuestionario.

No cambies metodología, acceso, sesiones, cálculos ni persistencia salvo encargo explícito. No reescribas preguntas del cuestionario como copy de interfaz.
