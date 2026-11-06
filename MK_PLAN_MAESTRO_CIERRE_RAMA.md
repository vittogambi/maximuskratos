# Cierre ejecutable del plan maestro en `pilot/domain-f1-m1-gate`

21 oct 2026. Esta nota distingue lo implementado en código de lo que sigue bloqueado por decisión comercial, contenido (D-SRC, D-SYN) o verificación en navegador (T8.4).

## Hecho en la rama (F0–F7 código)

| Fase | Estado | Notas |
| --- | --- | --- |
| F0 | Hecho | Línea base documentada |
| F1 | Hecho | Dominio y tests |
| F2 | Hecho | M1–M4 migraciones |
| F3 | Hecho salvo T3.4 fino de UI Diseña | API: activación, propuestas, horarios, dashboard, memoria, retorno, evidence, achievement, territory assignment |
| F4 | Hecho base | Patrones `.mk-m-`, inicio, ámbito, semana, memoria, diseñar, planes detalle, nav, redirects, e2e dashboard |
| F5 | Hecho base | `POST /diagnostic/territory/:t/start`, `GET /diagnostic/question`, buildState por ámbito, reengagement off en sesión por ámbito |
| F6 | Hecho base | Revisión API con `reviewReading` en preview; pantallas logro/mantenimiento/revisión stub; retorno en inicio |
| F7 | Parcial | Memoria HTTP; propuesta territorio plan; seed placeholder `@4` |
| F8 | No | Copy masivo, admin ampliado, eventos beta, T8.4 navegador real |
| F9 | No | D-COBRO; billing existente sin MP conectado |
| F10 | No | Fuera de alcance |

## Fuera de alcance técnico inmediato

- Cobro Mercado Pago hasta D-COBRO.
- Síntesis interpretativa completa (D-SYN).
- Beta pública y protocolo con personas (D-BETA) sin T8.
- Recorrido completo en navegador 320–1440 con capturas (T8.4).
- Player WIP local sin commitear (auth, `DiagnosticPlayer`, etc.).

## Auditoría 21 oct (post revisión)

Correcciones aplicadas en working tree:

- `decidePlanProposal`: EDIT exige `editedPayload`.
- `storedPayload` / activación: propuestas con texto editado aunque el status en DB sea ACCEPTED.
- `upsertRecord`: validación NOT_AN_OCCASION con intervalo de horario resuelto.
- `declareAchievement`: criterio CONFIRMED o PROVISIONAL con texto; al cerrar quita foco y desactiva acciones.
- Web: enlaces a `/planes/[id]`, errores al abrir cuestionario por ámbito, nav activa en planes/semana/diseñar, player enruta `territory_complete` / `territory_pause` al ámbito.
- Tests de dominio: `plan-proposal-domain`, `plan-territory-assignment`, `diagnostic-territory`, `plan-proposal-apply` en `test:domain` (219 tests).

Ajuste producto (21 oct tarde): logro solo con criterio `CONFIRMED` (`canDeclareAchievement`); `isOccasionRegistrationDay` unificado; activación aplica parches ACTION; propuestas ACCEPT limpian `editedPayload`; rutas ámbito con `?cuestionario=completo|pausa`.

Hecho en pasada producto (21 oct noche): `futureOccasions` ISO, `flexOccasionCapReached`, síntesis Descubre en territorio (`discoverSynthesis`), Diseña 4 pasos (`DesignPlanFlow`), S-12 logro por pasos + evidencia obligatoria, mantenimiento con transición, `GET .../proposals`, test HTTP `plan-achievement.http.test.ts`.

Siguen abiertos: P3A plantillas por ámbito, reconocimientos B-04, preview activación B-05 en UI, HTTP e2e (requiere `DATABASE_URL=.../mk_journey_it`), T8.4 capturas, F8–F10, fixture `@4` completo. Mantenimiento tras logro: plan queda `CLOSED`; la ruta `/mantener` avisa si ya cerró.

## Verificación recomendada antes de merge

```bash
npm run test:domain -w @mk/api
npm run build -w @mk/api
npm run test:components -w @mk/web   # pueden fallar tests del player WIP
# Con Postgres migrado M1–M4:
npm run test:http -w @mk/api
```
