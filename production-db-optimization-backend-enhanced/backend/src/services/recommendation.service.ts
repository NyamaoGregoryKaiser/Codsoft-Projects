import { PrismaClient, Recommendation, RecommendationStatus } from '@prisma/client';
import { ApiError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

const createRecommendation = async (data: Omit<Recommendation, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Recommendation> => {
  const analysisReport = await prisma.analysisReport.findUnique({ where: { id: data.analysisReportId } });
  if (!analysisReport) {
    throw new ApiError(404, 'Analysis Report not found');
  }
  const targetDatabase = await prisma.targetDatabase.findUnique({ where: { id: data.targetDatabaseId } });
  if (!targetDatabase) {
    throw new ApiError(404, 'Target Database not found');
  }
  const recommendedBy = await prisma.user.findUnique({ where: { id: data.recommendedById } });
  if (!recommendedBy) {
    throw new ApiError(404, 'Recommended By user not found');
  }
  if (data.assignedToId) {
    const assignedTo = await prisma.user.findUnique({ where: { id: data.assignedToId } });
    if (!assignedTo) {
      throw new ApiError(404, 'Assigned To user not found');
    }
  }

  return prisma.recommendation.create({ data: { ...data, status: 'PENDING' } });
};

const getRecommendationById = async (id: string): Promise<Recommendation | null> => {
  return prisma.recommendation.findUnique({
    where: { id },
    include: { analysisReport: true, targetDatabase: true, recommendedBy: true, assignedTo: true }
  });
};

const getAllRecommendations = async (
  page: number = 1,
  limit: number = 10,
  status?: RecommendationStatus,
  targetDatabaseId?: string,
  assignedToId?: string
): Promise<Recommendation[]> => {
  const skip = (page - 1) * limit;
  const where: any = {};
  if (status) where.status = status;
  if (targetDatabaseId) where.targetDatabaseId = targetDatabaseId;
  if (assignedToId) where.assignedToId = assignedToId;

  return prisma.recommendation.findMany({
    where,
    skip,
    take: limit,
    include: { analysisReport: true, targetDatabase: true, recommendedBy: true, assignedTo: true },
    orderBy: { createdAt: 'desc' }
  });
};

const updateRecommendation = async (id: string, data: Partial<Recommendation>): Promise<Recommendation> => {
  const existingRecommendation = await prisma.recommendation.findUnique({ where: { id } });
  if (!existingRecommendation) {
    throw new ApiError(404, 'Recommendation not found');
  }
  return prisma.recommendation.update({ where: { id }, data });
};

const deleteRecommendation = async (id: string): Promise<void> => {
  const existingRecommendation = await prisma.recommendation.findUnique({ where: { id } });
  if (!existingRecommendation) {
    throw new ApiError(404, 'Recommendation not found');
  }
  await prisma.recommendation.delete({ where: { id } });
};

export {
  createRecommendation,
  getRecommendationById,
  getAllRecommendations,
  updateRecommendation,
  deleteRecommendation,
};
```