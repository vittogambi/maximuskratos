import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminActorGuard } from './admin-actor.guard';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MemberJourneyController } from './member-journey.controller';
import { MemberJourneyService } from './member-journey.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminController, MemberJourneyController],
  providers: [AdminService, MemberJourneyService, AdminActorGuard],
})
export class AdminModule {}
