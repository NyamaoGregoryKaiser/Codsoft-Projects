import { AppDataSource } from '../config/database';
import { Comment } from '../models/Comment.entity';
import { Task } from '../models/Task.entity';
import { User } from '../models/User.entity';
import { CreateCommentDto, UpdateCommentDto } from '../validators/comment.validator';
import { HttpException } from '../utils/http-exception';
import logger from '../utils/logger';
import { clearCache } from '../middleware/cache.middleware';

export class CommentService {
  private commentRepository = AppDataSource.getRepository(Comment);
  private taskRepository = AppDataSource.getRepository(Task);
  private userRepository = AppDataSource.getRepository(User);

  public async createComment(commentData: CreateCommentDto, userId: string) {
    try {
      const task = await this.taskRepository.findOneBy({ id: commentData.taskId });
      if (!task) {
        throw new HttpException(404, `Task with ID ${commentData.taskId} not found.`);
      }

      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new HttpException(404, `User with ID ${userId} not found.`); // Should not happen with auth middleware
      }

      const comment = this.commentRepository.create({
        ...commentData,
        task,
        user,
      });

      await this.commentRepository.save(comment);
      await clearCache(`/api/tasks/${commentData.taskId}`); // Clear task detail cache
      await clearCache(`/api/projects/${task.projectId}`); // Clear project detail cache (since comments are part of tasks)

      logger.info(`Comment created: ${comment.id} by user ${userId} on task ${commentData.taskId}`);
      return comment;
    } catch (error) {
      logger.error(`CommentService - createComment failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to create comment.');
    }
  }

  public async findCommentsByTaskId(taskId: string) {
    try {
      const comments = await this.commentRepository.find({
        where: { taskId },
        relations: ['user'],
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          user: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
          createdAt: 'ASC',
        },
      });
      return comments;
    } catch (error) {
      logger.error(`CommentService - findCommentsByTaskId failed: ${error.message}`, error.stack);
      throw new HttpException(500, 'Failed to retrieve comments.');
    }
  }

  public async updateComment(commentId: string, updateData: UpdateCommentDto, userId: string) {
    try {
      const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: ['user'] });
      if (!comment) {
        throw new HttpException(404, `Comment with ID ${commentId} not found.`);
      }

      // Authorization: Only the user who created the comment can update it
      if (comment.user.id !== userId) {
        throw new HttpException(403, 'Forbidden: You do not have permission to update this comment.');
      }

      Object.assign(comment, updateData);
      await this.commentRepository.save(comment);
      await clearCache(`/api/tasks/${comment.taskId}`); // Clear task detail cache
      // Also clear project cache if project detail displays comments directly

      logger.info(`Comment updated: ${comment.id} by user ${userId}`);
      return comment;
    } catch (error) {
      logger.error(`CommentService - updateComment failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to update comment.');
    }
  }

  public async deleteComment(commentId: string, userId: string) {
    try {
      const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: ['user'] });
      if (!comment) {
        throw new HttpException(404, `Comment with ID ${commentId} not found.`);
      }

      // Authorization: Only the user who created the comment can delete it
      if (comment.user.id !== userId) {
        throw new HttpException(403, 'Forbidden: You do not have permission to delete this comment.');
      }

      await this.commentRepository.delete(commentId);
      await clearCache(`/api/tasks/${comment.taskId}`); // Clear task detail cache

      logger.info(`Comment deleted: ${commentId} by user ${userId}`);
    } catch (error) {
      logger.error(`CommentService - deleteComment failed: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to delete comment.');
    }
  }
}