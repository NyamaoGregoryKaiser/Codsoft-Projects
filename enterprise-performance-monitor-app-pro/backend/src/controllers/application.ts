import { Request, Response, NextFunction } from 'express';
import { ApplicationService } from '../services/application';
import { Application } from '../entities/Application';

const applicationService = new ApplicationService();

export const createApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const ownerId = req.user!.id; // Authenticated user is the owner
    const application = await applicationService.createApplication(name, description, ownerId);
    res.status(201).json(application);
  } catch (error: any) {
    next(error);
  }
};

export const getApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerId = req.user!.id;
    const applications = await applicationService.getApplicationsByOwner(ownerId);
    // Remove API keys from list for security
    const sanitizedApplications = applications.map(app => {
      const { apiKey, ...rest } = app;
      return rest;
    });
    res.status(200).json(sanitizedApplications);
  } catch (error: any) {
    next(error);
  }
};

export const getApplicationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const ownerId = req.user!.id; // Ensure current user is the owner
    const application = await applicationService.getApplicationById(applicationId, ownerId);
    res.status(200).json(application); // API key is returned here, as requested by owner
  } catch (error: any) {
    next(error);
  }
};

export const updateApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const ownerId = req.user!.id;
    const updates: Partial<Application> = req.body;
    // Prevent updating API key directly through this endpoint
    delete updates.apiKey;
    const updatedApplication = await applicationService.updateApplication(applicationId, ownerId, updates);
    res.status(200).json(updatedApplication);
  } catch (error: any) {
    next(error);
  }
};

export const deleteApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const ownerId = req.user!.id;
    const result = await applicationService.deleteApplication(applicationId, ownerId);
    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};

export const refreshApplicationApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const ownerId = req.user!.id;
    const applicationWithNewKey = await applicationService.refreshApiKey(applicationId, ownerId);
    res.status(200).json(applicationWithNewKey);
  } catch (error: any) {
    next(error);
  }
};