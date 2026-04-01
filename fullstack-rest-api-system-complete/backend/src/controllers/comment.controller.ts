import { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/comment.service';
import { CreateCommentDto, UpdateCommentDto } from '../validators/comment.validator';
import { validateOrReject } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { HttpException } from '../utils/http-exception';
import logger from '../utils/logger';

export class CommentController {
  private commentService: CommentService;

  constructor() {
    this.commentService = new CommentService();
  }

  public createComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const createData = plainToClass(CreateCommentDto, req.body);
      await validateOrReject(createData, { validationError: { target: false } });

      const userId = req.user!.id;
      const comment = await this.commentService.createComment(createData, userId);
      res.status(201).json(comment);
    } catch (error) {
      logger.error(`CommentController - createComment failed: ${error.message}`, error.stack);
      if (Array.isArray(error)) {
        next(new HttpException(400, error.map(err => Object.values(err.constraints)).join(', ')));
      } else {
        next(error);
      }
    }
  };

  public getCommentsByTaskId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { taskId } = req.params;
      const comments = await this.commentService.findCommentsByTaskId(taskId);
      res.status(200).json(comments);
    } catch (error) {
      logger.error(`CommentController - getCommentsByTaskId failed: ${error.message}`, error.stack);
      next(error);
    }
  };

  public updateComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateData = plainToClass(UpdateCommentDto, req.body);
      await validateOrReject(updateData, { validationError: { target: false } });

      const userId = req.user!.id;
      const updatedComment = await this.commentService.updateComment(id, updateData, userId);
      res.status(200).json(updatedComment);
    } catch (error) {
      logger.error(`CommentController - updateComment failed: ${error.message}`, error.stack);
      if (Array.isArray(error)) {
        next(new HttpException(400, error.map(err => Object.values(err.constraints)).join(', ')));
      } else {
        next(error);
      }
    }
  };

  public deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      await this.commentService.deleteComment(id, userId);
      res.status(204).send();
    } catch (error) {
      logger.error(`CommentController - deleteComment failed: ${error.message}`, error.stack);
      next(error);
    }
  };
}