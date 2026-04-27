import { Module, Global } from '@nestjs/common';
import { WinstonLogger } from './winston.logger';
import { ConfigModule } from '@nestjs/config';

/**
 * Global module for providing WinstonLogger.
 * This allows WinstonLogger to be injected into any service/controller/gateway.
 */
@Global() // Makes this module available globally
@Module({
  imports: [ConfigModule], // Inject ConfigModule to use ConfigService
  providers: [WinstonLogger],
  exports: [WinstonLogger],
})
export class WinstonLoggerModule {}