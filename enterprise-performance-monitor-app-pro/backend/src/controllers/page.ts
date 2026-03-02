import { Request, Response, NextFunction } from 'express';
import { PageService } from '../services/page';
import { Page } from '../entities/Page';

const pageService = new PageService();

export const createPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const { name, pathRegex } = req.body;
    const page = await pageService.createPage(applicationId, name, pathRegex);
    res.status(201).json(page);
  } catch (error: any) {
    next(error);
  }
};

export const getPagesByApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const pages = await pageService.getPagesByApplication(applicationId);
    res.status(200).json(pages);
  } catch (error: any) {
    next(error);
  }
};

export const getPageById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId, pageId } = req.params;
    const page = await pageService.getPageById(applicationId, pageId);
    res.status(200).json(page);
  } catch (error: any) {
    next(error);
  }
};

export const updatePage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId, pageId } = req.params;
    const updates: Partial<Page> = req.body;
    const updatedPage = await pageService.updatePage(applicationId, pageId, updates);
    res.status(200).json(updatedPage);
  } catch (error: any) {
    next(error);
  }
};

export const deletePage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId, pageId } = req.params;
    const result = await pageService.deletePage(applicationId, pageId);
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};