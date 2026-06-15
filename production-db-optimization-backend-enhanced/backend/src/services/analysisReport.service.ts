import { PrismaClient, AnalysisReport } from '@prisma/client';
import { ApiError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

const createAnalysisReport = async (data: Omit<AnalysisReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnalysisReport> => {
  // Ensure targetDatabaseId and analystId exist
  const targetDb = await prisma.targetDatabase.findUnique({ where: { id: data.targetDatabaseId } });
  if (!targetDb) {
    throw new ApiError(404, 'Target Database not found');
  }
  const analyst = await prisma.user.findUnique({ where: { id: data.analystId } });
  if (!analyst) {
    throw new ApiError(404, 'Analyst user not found');
  }
  return prisma.analysisReport.create({ data });
};

const getAnalysisReportById = async (id: string): Promise<AnalysisReport | null> => {
  return prisma.analysisReport.findUnique({
    where: { id },
    include: { targetDatabase: true, analyst: true, recommendations: true }
  });
};

const getAllAnalysisReports = async (page: number = 1, limit: number = 10, targetDatabaseId?: string): Promise<AnalysisReport[]> => {
  const skip = (page - 1) * limit;
  return prisma.analysisReport.findMany({
    where: targetDatabaseId ? { targetDatabaseId } : {},
    skip,
    take: limit,
    include: { targetDatabase: true, analyst: true },
    orderBy: { reportDate: 'desc' }
  });
};

const updateAnalysisReport = async (id: string, data: Partial<AnalysisReport>): Promise<AnalysisReport> => {
  const existingReport = await prisma.analysisReport.findUnique({ where: { id } });
  if (!existingReport) {
    throw new ApiError(404, 'Analysis Report not found');
  }
  return prisma.analysisReport.update({ where: { id }, data });
};

const deleteAnalysisReport = async (id: string): Promise<void> => {
  const existingReport = await prisma.analysisReport.findUnique({ where: { id } });
  if (!existingReport) {
    throw new ApiError(404, 'Analysis Report not found');
  }
  await prisma.analysisReport.delete({ where: { id } });
};

export {
  createAnalysisReport,
  getAnalysisReportById,
  getAllAnalysisReports,
  updateAnalysisReport,
  deleteAnalysisReport,
};
```