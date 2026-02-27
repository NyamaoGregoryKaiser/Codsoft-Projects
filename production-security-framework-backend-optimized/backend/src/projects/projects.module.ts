```typescript
import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { UsersModule } from '../users/users.module'; // To get user details if needed
import { LoggerModule } from '../common/logger/logger.module';
import { ProjectOwnerGuard } from './guards/project-owner.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Project]), UsersModule, LoggerModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectOwnerGuard], // Register ProjectOwnerGuard
  exports: [ProjectsService], // Export ProjectsService if tasks or other modules need it
})
export class ProjectsModule {}
```