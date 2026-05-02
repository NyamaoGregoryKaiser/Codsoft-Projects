const prisma = require('../models/prisma');
const redisClient = require('../models/redis');
const path = require('path');
const fs = require('fs/promises');
const csv = require('csv-parser');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { UPLOAD_DIR } = require('../config');

const CACHE_KEY_PREFIX = 'dataset_summary:';

exports.uploadDataset = async (file, userId) => {
  if (!file) {
    throw new AppError('No file uploaded', 400);
  }

  const { originalname, filename, path: filePath, size, mimetype } = file;

  // Basic CSV analysis - simulate for demonstration
  // In a real scenario, this would involve a robust data analysis library
  const summary = await this.analyzeCsvFile(filePath);

  const dataset = await prisma.dataset.create({
    data: {
      name: originalname,
      fileName: filename,
      filePath: filePath,
      fileSize: size,
      fileMimeType: mimetype,
      uploadedById: userId,
      status: 'UPLOADED',
      metadata: summary, // Store basic summary
    },
  });

  logger.info(`Dataset uploaded: ${originalname} by user ${userId}`);
  // Invalidate cache for dataset list
  await redisClient.del('datasets_list');
  return dataset;
};

exports.getDatasets = async (userId, limit = 10, offset = 0) => {
  // Can add caching for common queries like 'all datasets'
  // For simplicity, not caching individual user datasets
  const datasets = await prisma.dataset.findMany({
    where: { uploadedById: userId },
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' },
  });
  return datasets;
};

exports.getDatasetById = async (id, userId) => {
  const dataset = await prisma.dataset.findUnique({
    where: { id },
    include: { uploadedBy: { select: { id: true, username: true, email: true } } },
  });

  if (!dataset || dataset.uploadedById !== userId) {
    throw new AppError('Dataset not found or unauthorized access', 404);
  }

  return dataset;
};

exports.deleteDataset = async (id, userId) => {
  const dataset = await this.getDatasetById(id, userId); // Ensures ownership check

  // Delete file from disk
  try {
    await fs.unlink(dataset.filePath);
    logger.info(`Deleted file from disk: ${dataset.filePath}`);
  } catch (error) {
    logger.error(`Failed to delete file from disk: ${dataset.filePath}, error: ${error.message}`);
    // Don't throw fatal error if file delete fails but proceed with DB record delete
  }

  await prisma.dataset.delete({ where: { id } });
  logger.info(`Dataset deleted: ${dataset.name}`);
  await redisClient.del(CACHE_KEY_PREFIX + id); // Invalidate specific dataset cache
  await redisClient.del('datasets_list'); // Invalidate list cache
};

exports.analyzeCsvFile = async (filePath) => {
  // Simulate basic CSV analysis for metadata
  // In a real system, you'd use a library like 'csv-parser' + 'danfojs-node' or similar.
  const results = [];
  try {
    const stream = fs.createReadStream(filePath);
    await new Promise((resolve, reject) => {
      stream.pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve())
        .on('error', (error) => reject(error));
    });

    if (results.length === 0) {
      return { columns: [], rowCount: 0, summary: 'No data found.' };
    }

    const firstRow = results[0];
    const columns = Object.keys(firstRow).map(key => {
      let type = 'string';
      const sampleValue = firstRow[key];
      if (!isNaN(parseFloat(sampleValue)) && isFinite(sampleValue)) {
        type = 'number';
      } else if (sampleValue === 'true' || sampleValue === 'false') {
        type = 'boolean';
      }
      return { name: key, type: type, sample: sampleValue };
    });

    // Cache the dataset summary
    const summary = {
      columns,
      rowCount: results.length,
      firstFiveRows: results.slice(0, 5),
    };
    await redisClient.setEx(CACHE_KEY_PREFIX + path.basename(filePath), 3600, JSON.stringify(summary)); // Cache for 1 hour

    return summary;
  } catch (error) {
    logger.error(`Error analyzing CSV file ${filePath}: ${error.message}`);
    throw new AppError('Failed to analyze CSV file', 500);
  }
};