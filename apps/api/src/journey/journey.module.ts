import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DiagnosticOpenGuard } from '../diagnostic/diagnostic-open.guard';
import { JourneyClock, WeekApplyHook } from './journey-clock';
import { AccompanimentController } from './accompaniment.controller';
import { AccompanimentService } from './accompaniment.service';
import { JourneyController } from './journey.controller';
import { JourneyService } from './journey.service';

@Module({
  imports: [AuthModule],
  controllers: [JourneyController, AccompanimentController],
  providers: [JourneyService, AccompanimentService, DiagnosticOpenGuard, JourneyClock, WeekApplyHook],
})
export class JourneyModule {}
