```typescript
import { Request, Response, NextFunction } from 'express';
import * as commentService from './comment.service';
import ApiResponse from '../../utils/apiResponse';
import { CreateCommentDto, UpdateCommentDto } from './comment.dto';
import { getPaginationOptions } from '../../utils/pagination';

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const taskId = req.params.taskId;
    const createCommentDto: CreateCommentDto = req.body;
    const newComment = await commentService.createComment(taskId, createCommentDto, req.user.id);
    res.status(201).json(ApiResponse.success(newComment, 'Comment added successfully', 201));
  } catch (error) {
    next(error);
  }
};

export const getCommentsByTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const taskId = req.params.taskId;
    const paginationOptions = getPaginationOptions(req);
    const { comments, total } = await commentService.findCommentsByTask(taskId, req.user.id, paginationOptions);

    res.status(200).json(ApiResponse.success(comments, 'Comments fetched successfully', 200, {
      total,
      limit: paginationOptions.limit,
      page: paginationOptions.page,
      totalPages: Math.ceil(total / paginationOptions.limit),
    }));
  } catch (error) {
    next(error);
  }
};

export const getCommentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const commentId = req.params.commentId;
    const comment = await commentService.findCommentById(commentId, req.user.id);
    res.status(200).json(ApiResponse.success(comment, 'Comment fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const commentId = req.params.commentId;
    const updateCommentDto: UpdateCommentDto = req.body;
    const updatedComment = await commentService.updateComment(commentId, updateCommentDto, req.user.id);
    res.status(200).json(ApiResponse.success(updatedComment, 'Comment updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new Error('User not authenticated.'));
    }
    const commentId = req.params.commentId;
    await commentService.deleteComment(commentId, req.user.id);
    res.status(204).json(ApiResponse.success(null, 'Comment deleted successfully'));
  } catch (error) {
    next(error);
  }
};
```