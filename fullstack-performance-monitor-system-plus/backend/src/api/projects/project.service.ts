import { prisma } from '../../database/prisma-client';
import { AppError } from '../../error';
import crypto from 'crypto';

export const generateApiKey = (): string => {
  return crypto.randomBytes(32).toString('hex'); // 64 character hex string
};

export const createProject = async (name: string, ownerId: string) => {
  const apikey = generateApiKey();
  const project = await prisma.project.create({
    data: {
      name,
      apikey,
      ownerId,
    },
  });
  return project;
};

export const getProjectsByOwner = async (ownerId: string) => {
  const projects = await prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  });
  return projects;
};

export const getProjectById = async (projectId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  return project;
};

export const updateProject = async (projectId: string, name: string) => {
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: { name },
  });
  return updatedProject;
};

export const deleteProject = async (projectId: string) => {
  // Delete associated metrics first (cascading delete if configured in Prisma, otherwise explicitly)
  await prisma.metric.deleteMany({
    where: { projectId: projectId },
  });

  await prisma.project.delete({
    where: { id: projectId },
  });
};