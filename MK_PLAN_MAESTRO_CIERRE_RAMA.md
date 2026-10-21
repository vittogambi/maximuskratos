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

## Verificación recomendada antes de merge

```bash
npm run test:domain -w @mk/api
npm run build -w @mk/api
npm run test:components -w @mk/web   # pueden fallar tests del player WIP
# Con Postgres migrado M1–M4:
npm run test:http -w @mk/api
```
