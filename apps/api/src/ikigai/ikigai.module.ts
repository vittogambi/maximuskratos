import { Module } from '@nestjs/common';
import { IkigaiAccessGuard } from './ikigai-access.guard';
import { IkigaiController } from './ikigai.controller';
import { IkigaiService } from './ikigai.service';

@Module({
  controllers: [IkigaiController],
  providers: [IkigaiService, IkigaiAccessGuard],
})
export class IkigaiModule {}
