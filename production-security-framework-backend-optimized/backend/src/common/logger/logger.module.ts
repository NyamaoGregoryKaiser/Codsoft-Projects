```typescript
import { Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Module({
  providers: [LoggerService],
  exports: [LoggerService], // Export so it can be injected into other modules
})
export class LoggerModule {}
```