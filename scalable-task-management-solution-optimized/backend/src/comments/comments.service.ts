import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { TasksService } from '../tasks/tasks.service';
import { AppLogger } from '../shared/logger/app-logger.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    private tasksService: TasksService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CommentsService.name);
  }

  async create(createCommentDto: CreateCommentDto, authorId: string): Promise<Comment> {
    const { taskId, content } = createCommentDto;

    // Validate if the task exists and is accessible by the author
    const task = await this.tasksService.findOne(taskId, authorId); // This will throw NotFound/Forbidden
    if (!task) {
        throw new BadRequestException(`Task with ID ${taskId} not found or not accessible.`);
    }

    const comment = this.commentsRepository.create({
      content,
      taskId: task.id,
      authorId: authorId,
    });
    this.logger.log(`Comment created by user ${authorId} for task ${taskId}.`, 'create');
    return this.commentsRepository.save(comment);
  }

  async findCommentsByTask(taskId: string, currentUserId: string): Promise<Comment[]> {
    // Ensure the task exists and is accessible by the current user
    const task = await this.tasksService.findOne(taskId, currentUserId);
    if (!task) {
        throw new BadRequestException(`Task with ID ${taskId} not found or not accessible.`);
    }

    return this.commentsRepository.find({
      where: { taskId },
      relations: ['author'], // Eager load author details
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, currentUserId: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['task', 'task.project', 'author'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found.`);
    }

    // Ensure the comment's task project is owned by the current user
    if (comment.task.project.ownerId !== currentUserId) {
      throw new ForbiddenException(`You do not have access to comment with ID ${id}.`);
    }

    return comment;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, currentUserId: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['task', 'task.project', 'author'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found.`);
    }

    // Check if the current user is the author of the comment
    if (comment.authorId !== currentUserId) {
      throw new ForbiddenException(`You are not authorized to update this comment.`);
    }

    Object.assign(comment, updateCommentDto);
    this.logger.log(`Comment ${id} updated by user ${currentUserId}.`, 'update');
    return this.commentsRepository.save(comment);
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['task', 'task.project', 'author'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found.`);
    }

    // Only author or project owner can delete a comment
    if (comment.authorId !== currentUserId && comment.task.project.ownerId !== currentUserId) {
      throw new ForbiddenException(`You are not authorized to delete this comment.`);
    }

    await this.commentsRepository.remove(comment);
    this.logger.log(`Comment ${id} removed by user ${currentUserId}.`, 'remove');
  }
}