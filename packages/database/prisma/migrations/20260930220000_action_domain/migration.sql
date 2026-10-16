-- Ámbito de una acción del plan personal. Las filas ya creadas quedan sin ámbito.

CREATE TYPE "ActionDomain" AS ENUM ('MENTE', 'ESPIRITU', 'CUERPO');

ALTER TABLE "plan_actions" ADD COLUMN "domain" "ActionDomain";
