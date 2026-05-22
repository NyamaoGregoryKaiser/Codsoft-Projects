```typescript
import { AppDataSource } from '../../database/data-source';
import { Comment } from '../../database/entities/comment.entity';
import { Task } from '../../database/entities/task.entity';
import { User } from '../../database/entities/user.entity';
import { CreateCommentDto, UpdateCommentDto } from './comment.dto';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import logger from '../../utils/logger';
import { PaginatedResult } from '../../utils/pagination';

const commentRepository = AppDataSource.getRepository(Comment);
const taskRepository = AppDataSource.getRepository(Task);
const userRepository = AppDataSource.getRepository(User);

// Helper to check user's access to a task (for commenting permissions)
const checkTaskAccessForComment = async (taskId: string, userId: string): Promise<Task> => {
  const task = await taskRepository.findOne({
    where: { id: taskId },
    relations: ['project', 'project.owner', 'assignee'],
  });

  if (!task) {
    throw new NotFoundError(`Task with ID ${taskId} not found.`);
  }

  // User must be project owner or task assignee to comment
  const isOwner = task.project.owner.id === userId;
  const isAssignee = task.assignee?.id === userId;

  if (!isOwner && !isAssignee) {
    throw new ForbiddenError('You do not have permission to comment on this task.');
  }

  return task;
};

// Helper to check user's access to a specific comment
const checkCommentAccess = async (commentId: string, userId: string): Promise<Comment> => {
  const comment = await commentRepository.findOne({
    where: { id: commentId },
    relations: ['user', 'task', 'task.project', 'task.project.owner', 'task.assignee'],
  });

  if (!comment) {
    throw new NotFoundError(`Comment with ID ${commentId} not found.`);
  }

  // User must be the comment author OR the project owner OR a task assignee to view/modify
  const isCommentAuthor = comment.user.id === userId;
  const isProjectOwner = comment.task.project.owner.id === userId;
  const isTaskAssignee = comment.task.assignee?.id === userId;

  if (!isCommentAuthor && !isProjectOwner && !isTaskAssignee) {
    throw new ForbiddenError('You do not have permission to access this comment.');
  }

  return comment;
};

export const createComment = async (taskId: string, createCommentDto: CreateCommentDto, userId: string): Promise<Comment> => {
  const task = await checkTaskAccessForComment(taskId, userId);
  const user = await userRepository.findOneBy({ id: userId });

  if (!user) {
    throw new NotFoundError('Comment author not found.');
  }

  const newComment = new Comment();
  newComment.content = createCommentDto.content;
  newComment.task = task;
  newComment.user = user;

  try {
    const savedComment = await commentRepository.save(newComment);
    logger.info(`Comment added to task ${taskId} by user ${userId}.`);
    return savedComment;
  } catch (error: any) {
    logger.error(`Error creating comment for task ${taskId}:`, error);
    throw new BadRequestError('Could not add comment. Please check your input.');
  }
};

export const findCommentsByTask = async (taskId: string, userId: string, options: { limit: number; page: number; orderBy: string; orderDirection: 'ASC' | 'DESC' }): Promise<PaginatedResult<Comment>> => {
  await checkTaskAccessForComment(taskId, userId); // Ensure task exists and user has access

  const { limit, page, orderBy, orderDirection } = options;
  const skip = (page - 1) * limit;

  const [comments, total] = await commentRepository.findAndCount({
    where: { task: { id: taskId } },
    relations: ['user'],
    take: limit,
    skip: skip,
    order: {
      [orderBy]: orderDirection,
    },
  });

  return {
    data: comments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const findCommentById = async (commentId: string, userId: string): Promise<Comment> => {
  const comment = await checkCommentAccess(commentId, userId);
  return comment;
};

export const updateComment = async (commentId: string, updateCommentDto: UpdateCommentDto, userId: string): Promise<Comment> => {
  const comment = await checkCommentAccess(commentId, userId);

  // Only the original author can update their comment
  if (comment.user.id !== userId) {
    throw new ForbiddenError('You do not have permission to update this comment.');
  }

  comment.content = updateCommentDto.content || comment.content;

  try {
    const updatedComment = await commentRepository.save(comment);
    logger.info(`Comment ${commentId} updated by user ${userId}.`);
    return updatedComment;
  } catch (error: any) {
    logger.error(`Error updating comment ${commentId}:`, error);
    throw new BadRequestError('Could not update comment. Please check your input.');
  }
};

export const deleteComment = async (commentId: string, userId: string): Promise<void> => {
  const comment = await commentRepository.findOne({
    where: { id: commentId },
    relations: ['user', 'task', 'task.project', 'task.project.owner'], // Need project owner for broader delete permission
  });

  if (!comment) {
    throw new NotFoundError(`Comment with ID ${commentId} not found.`);
  }

  // Only the original author or the project owner can delete a comment
  const isCommentAuthor = comment.user.id === userId;
  const isProjectOwner = comment.task.project.owner.id === userId;

  if (!isCommentAuthor && !isProjectOwner) {
    throw new ForbiddenError('You do not have permission to delete this comment.');
  }

  const result = await commentRepository.delete(commentId);

  if (result.affected === 0) {
    throw new NotFoundError(`Comment with ID ${commentId} not found (after permission check).`);
  }
  logger.info(`Comment ${commentId} deleted by user ${userId}.`);
};
```