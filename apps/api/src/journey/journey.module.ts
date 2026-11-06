import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DiagnosticOpenGuard } from '../diagnostic/diagnostic-open.guard';
import { JourneyClock, WeekApplyHook } from './journey-clock';
import { AccompanimentController } from './accompaniment.controller';
import { AccompanimentService } from './accompaniment.service';
import { InterventionController } from './intervention.controller';
import { InterventionService } from './intervention.service';
import { JourneyController } from './journey.controller';
import { JourneyService } from './journey.service';

@Module({
  imports: [AuthModule],
  controllers: [JourneyController, AccompanimentController, InterventionController],
  providers: [JourneyService, AccompanimentService, InterventionService, DiagnosticOpenGuard, JourneyClock, WeekApplyHook],
})
export class JourneyModule {}
