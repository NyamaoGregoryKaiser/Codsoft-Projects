import { Module } from '@nestjs/common';
import { AppLogger } from './app-logger.service';

@Module({
  providers: [AppLogger],
  exports: [AppLogger], // Export AppLogger to be used by other modules
})
export class AppLoggerModule {}