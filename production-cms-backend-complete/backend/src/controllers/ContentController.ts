import { Request, Response, NextFunction } from 'express';
import { ContentService } from '../services/ContentService';
import { CustomError } from '../middlewares/errorHandler';
import { CreateContentDto, UpdateContentDto } from '../utils/validation';
import { ContentStatus } from '../entities/Content';

export class ContentController {
    private contentService = new ContentService();

    async createContent(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return next(new CustomError(401, "User not authenticated for content creation."));
            }
            const contentData: CreateContentDto = req.body;
            const newContent = await this.contentService.createContent(contentData, req.user.id);
            res.status(201).json({
                success: true,
                message: 'Content created successfully',
                data: newContent,
            });
        } catch (error) {
            next(error);
        }
    }

    async getContents(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const status = req.query.status as ContentStatus | undefined;
            const search = req.query.search as string | undefined;

            const [contents, total] = await this.contentService.getContents(page, limit, status, search);
            res.status(200).json({
                success: true,
                data: contents,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async getContentById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const content = await this.contentService.getContentById(id);
            if (!content) {
                return next(new CustomError(404, 'Content not found.'));
            }
            res.status(200).json({
                success: true,
                data: content,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateContent(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return next(new CustomError(401, "User not authenticated for content update."));
            }
            const { id } = req.params;
            const updateData: UpdateContentDto = req.body;
            const updatedContent = await this.contentService.updateContent(id, updateData, req.user.id, req.user.role);
            if (!updatedContent) {
                return next(new CustomError(404, 'Content not found.'));
            }
            res.status(200).json({
                success: true,
                message: 'Content updated successfully',
                data: updatedContent,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteContent(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return next(new CustomError(401, "User not authenticated for content deletion."));
            }
            const { id } = req.params;
            await this.contentService.deleteContent(id, req.user.id, req.user.role);
            res.status(204).json({
                success: true,
                message: 'Content deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}