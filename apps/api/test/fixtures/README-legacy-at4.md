# Fixture cuenta legacy `@4` (T7.3)

Objetivo: una cuenta con `formulario-completo@4` completada, hoja firmada, plan activo, semana cerrada y semana abierta.

Ejecutar en Postgres de integración (`mk_journey_it`) después de migraciones M1 a M4:

```bash
DATABASE_URL=postgresql://mk:mk_local_dev@127.0.0.1:5433/mk_journey_it npx tsx packages/database/scripts/seed-legacy-at4-fixture.ts
```

El script `seed-legacy-at4-fixture.ts` se añade en el mismo paquete cuando haya una ventana de seed dedicada. Hasta entonces, usar el recorrido HTTP A sobre `@5` como proxy de lectura sin reescritura.
