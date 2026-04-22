import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from './entities/comment.entity';
import { TasksModule } from '../tasks/tasks.module'; // To validate task existence and ownership
import { UsersModule } from '../users/users.module'; // To validate author and load author details
import { AppLoggerModule } from '../shared/logger/app-logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    TasksModule,
    UsersModule,
    AppLoggerModule,
  ],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}