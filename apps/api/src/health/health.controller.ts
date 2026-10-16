import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'maximus-kratos-api',
      release: process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT ?? null,
      catalog: 'formulario-completo',
      methods: ['ia-mk-cuest@0.1', 'profundidad-mk@0.1', 'iad-mk-0.1-borrador', 'cruce-cualitativo@2'],
    };
  }
}
