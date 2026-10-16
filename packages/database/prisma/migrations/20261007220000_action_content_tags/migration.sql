-- Marcas que la persona declara al crear la acción. Las filas ya creadas quedan sin marcas.

ALTER TABLE "plan_actions" ADD COLUMN "content_tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
