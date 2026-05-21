import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../modules/auth/auth.module';
import { DevicesModule } from '../modules/devices/devices.module';
import { PresenceBroadcastService } from '../modules/presence/presence-broadcast.service';
import { PresenceModule } from '../modules/presence/presence.module';

import { AgentsGateway } from './agents.gateway';
import { ConsoleGateway } from './console.gateway';
import { WsBroadcastService } from './ws-broadcast.service';

@Module({
  imports: [AuthModule, PresenceModule, forwardRef(() => DevicesModule)],
  providers: [WsBroadcastService, PresenceBroadcastService, ConsoleGateway, AgentsGateway],
  exports: [WsBroadcastService, ConsoleGateway, AgentsGateway],
})
export class GatewayModule {}
