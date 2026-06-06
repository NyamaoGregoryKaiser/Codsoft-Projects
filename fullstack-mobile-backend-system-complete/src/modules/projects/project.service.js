```javascript
const httpStatus = require('http-status');
const prisma = require('../../database/prisma');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

/**
 * Create a project
 * @param {Object} projectBody
 * @param {string} ownerId
 * @returns {Promise<Project>}
 */
const createProject = async (projectBody, ownerId) => {
  logger.info(`Creating project for owner: ${ownerId}`);
  const project = await prisma.project.create({
    data: {
      ...projectBody,
      ownerId,
    },
  });
  return project;
};

/**
 * Query for projects
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {Object} user - Authenticated user for authorization
 * @returns {Promise<QueryResult>}
 */
const queryProjects = async (filter, options, user) => {
  const { limit = 10, page = 1, sortBy } = options;
  const skip = (page - 1) * limit;

  // If not admin, only show projects owned by the user
  if (user.role !== 'ADMIN') {
    filter.ownerId = user.id;
  }

  const orderBy = {};
  if (sortBy) {
    const parts = sortBy.split(':');
    orderBy[parts[0]] = parts[1];
  } else {
    orderBy.createdAt = 'desc'; // Default sort
  }

  const projects = await prisma.project.findMany({
    where: filter,
    take: limit,
    skip: skip,
    orderBy: orderBy,
  });

  const totalResults = await prisma.project.count({ where: filter });
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: projects,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

/**
 * Get project by id
 * @param {string} id
 * @returns {Promise<Project>}
 */
const getProjectById = async (id) => {
  return prisma.project.findUnique({
    where: { id },
  });
};

/**
 * Update project by id
 * @param {string} projectId
 * @param {Object} updateBody
 * @returns {Promise<Project>}
 */
const updateProjectById = async (projectId, updateBody) => {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: updateBody,
  });
  return updatedProject;
};

/**
 * Delete project by id
 * @param {string} projectId
 * @returns {Promise<Project>}
 */
const deleteProjectById = async (projectId) => {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  await prisma.project.delete({
    where: { id: projectId },
  });
  return project; // Return the deleted project (or confirmation)
};

module.exports = {
  createProject,
  queryProjects,
  getProjectById,
  updateProjectById,
  deleteProjectById,
};
```