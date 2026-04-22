import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './entities/project.entity';
import { UsersModule } from '../users/users.module';
import { AppLoggerModule } from '../shared/logger/app-logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    UsersModule, // Needed to validate project owner
    AppLoggerModule,
  ],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}