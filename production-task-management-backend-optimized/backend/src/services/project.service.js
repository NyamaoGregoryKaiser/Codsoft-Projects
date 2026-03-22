```javascript
const httpStatus = require('http-status');
const prisma = require('../db/prisma');
const ApiError = require('../utils/ApiError');
const { invalidateCache } = require('../middlewares/cache');

const createProject = async (projectData, ownerId) => {
  const existingProject = await prisma.project.findUnique({
    where: {
      name_ownerId: {
        name: projectData.name,
        ownerId: ownerId,
      },
    },
  });

  if (existingProject) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Project with this name already exists for this user.');
  }

  const project = await prisma.project.create({
    data: {
      name: projectData.name,
      description: projectData.description,
      ownerId: ownerId,
      members: {
        connect: [{ id: ownerId }, ...(projectData.memberIds || []).map(id => ({ id }))],
      },
    },
    include: {
      owner: { select: { id: true, email: true, firstName: true, lastName: true } },
      members: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
  invalidateCache('projects'); // Invalidate project list cache
  return project;
};

const queryProjects = async (filter, options, userId) => {
  const { limit = 10, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;

  // Only retrieve projects the user is a member of or owns
  const whereClause = {
    ...filter,
    OR: [
      { ownerId: userId },
      {
        members: {
          some: {
            id: userId,
          },
        },
      },
    ],
  };

  const projects = await prisma.project.findMany({
    where: whereClause,
    take: parseInt(limit),
    skip: parseInt(skip),
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      owner: { select: { id: true, email: true, firstName: true, lastName: true } },
      members: { select: { id: true, email: true, firstName: true, lastName: true } },
      _count: {
        select: { tasks: true },
      },
    },
  });

  const totalResults = await prisma.project.count({ where: whereClause });
  const totalPages = Math.ceil(totalResults / limit);

  return { projects, totalResults, totalPages, page: parseInt(page), limit: parseInt(limit) };
};

const getProjectById = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, email: true, firstName: true, lastName: true } },
      members: { select: { id: true, email: true, firstName: true, lastName: true } },
      tasks: {
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: { select: { id: true, email: true, firstName: true, lastName: true } },
          creator: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      },
    },
  });
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  return project;
};

const updateProjectById = async (projectId, updateBody, userId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  if (project.ownerId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only project owner can update the project');
  }

  // Handle name uniqueness check if name is updated
  if (updateBody.name && updateBody.name !== project.name) {
    const existingProject = await prisma.project.findUnique({
      where: {
        name_ownerId: {
          name: updateBody.name,
          ownerId: userId,
        },
      },
    });
    if (existingProject) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Project with this name already exists for this user.');
    }
  }

  const data = {
    name: updateBody.name,
    description: updateBody.description,
  };

  if (updateBody.memberIds !== undefined) {
    // Disconnect all existing members and connect new ones.
    // Ensure the owner is always a member.
    const currentMembers = await prisma.user.findMany({
      where: { projects: { some: { id: projectId } } },
      select: { id: true }
    });
    const currentMemberIds = currentMembers.map(m => m.id);

    const newMemberIds = [...new Set([project.ownerId, ...(updateBody.memberIds || [])])];

    const membersToDisconnect = currentMemberIds.filter(id => !newMemberIds.includes(id));
    const membersToConnect = newMemberIds.filter(id => !currentMemberIds.includes(id));

    data.members = {
      disconnect: membersToDisconnect.map(id => ({ id })),
      connect: membersToConnect.map(id => ({ id })),
    };
  }

  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: data,
    include: {
      owner: { select: { id: true, email: true, firstName: true, lastName: true } },
      members: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
  invalidateCache('projects'); // Invalidate project list cache
  return updatedProject;
};

const deleteProjectById = async (projectId, userId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  if (project.ownerId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only project owner can delete the project');
  }
  await prisma.project.delete({ where: { id: projectId } });
  invalidateCache('projects'); // Invalidate project list cache
  return { message: 'Project deleted successfully' };
};

module.exports = {
  createProject,
  queryProjects,
  getProjectById,
  updateProjectById,
  deleteProjectById,
};
```