import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { TagsModule } from '../tags/tags.module';
import { AppLoggerModule } from '../shared/logger/app-logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    ProjectsModule, // To check project ownership
    UsersModule, // To assign tasks to users
    TagsModule, // To associate tags with tasks
    AppLoggerModule,
  ],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}