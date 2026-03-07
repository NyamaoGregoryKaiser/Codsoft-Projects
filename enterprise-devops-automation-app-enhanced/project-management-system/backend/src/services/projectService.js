```javascript
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Project, User, Task } = require('../models');

/**
 * Create a project
 * @param {Object} projectBody
 * @returns {Promise<Project>}
 */
const createProject = async (projectBody) => {
  const project = await Project.create(projectBody);
  // Automatically add the owner as a member
  await project.addMember(project.ownerId);
  return project;
};

/**
 * Query for projects
 * @param {Object} filter - filter object (e.g., { userId: 'uuid', role: 'user' })
 * @returns {Promise<Project[]>}
 */
const queryProjects = async (filter) => {
  const { userId, role } = filter;
  let whereClause = {};

  if (role !== 'admin' && userId) {
    // For non-admin users, show projects they own or are members of
    return Project.findAll({
      distinct: true,
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] }, // Don't fetch through table attributes
          where: { id: userId }, // Filter by current user as a member
          required: false, // Make this an outer join
        }
      ],
      where: {
        [Op.or]: [
          { ownerId: userId },
          { '$members.id$': userId } // This works with the above include
        ]
      }
    });
  }

  // Admin users can see all projects
  return Project.findAll({
    include: [
      { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: [] } },
    ],
  });
};

/**
 * Get project by id
 * @param {UUID} id
 * @returns {Promise<Project>}
 */
const getProjectById = async (id) => {
  return Project.findByPk(id, {
    include: [
      { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: [] } },
      { model: Task, as: 'tasks' },
    ],
  });
};

/**
 * Update project by id
 * @param {UUID} projectId
 * @param {Object} updateBody
 * @param {User} currentUser
 * @returns {Promise<Project>}
 */
const updateProjectById = async (projectId, updateBody, currentUser) => {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  if (project.ownerId !== currentUser.id && currentUser.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only project owner or admin can update projects');
  }

  Object.assign(project, updateBody);
  await project.save();
  return project;
};

/**
 * Delete project by id
 * @param {UUID} projectId
 * @param {User} currentUser
 * @returns {Promise<Project>}
 */
const deleteProjectById = async (projectId, currentUser) => {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  if (project.ownerId !== currentUser.id && currentUser.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only project owner or admin can delete projects');
  }

  await project.destroy();
  return project;
};

/**
 * Add member to a project
 * @param {UUID} projectId
 * @param {UUID} userIdToAdd
 * @param {User} currentUser
 * @returns {Promise<Project>}
 */
const addMemberToProject = async (projectId, userIdToAdd, currentUser) => {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  if (project.ownerId !== currentUser.id && currentUser.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only project owner or admin can add members');
  }

  const userToAdd = await User.findByPk(userIdToAdd);
  if (!userToAdd) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User to add not found');
  }

  await project.addMember(userToAdd);
  return getProjectById(projectId); // Return updated project with new members
};

/**
 * Remove member from a project
 * @param {UUID} projectId
 * @param {UUID} userIdToRemove
 * @param {User} currentUser
 * @returns {Promise<Project>}
 */
const removeMemberFromProject = async (projectId, userIdToRemove, currentUser) => {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  if (project.ownerId !== currentUser.id && currentUser.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only project owner or admin can remove members');
  }

  const userToRemove = await User.findByPk(userIdToRemove);
  if (!userToRemove) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User to remove not found');
  }

  await project.removeMember(userToRemove);
  return getProjectById(projectId); // Return updated project
};

module.exports = {
  createProject,
  queryProjects,
  getProjectById,
  updateProjectById,
  deleteProjectById,
  addMemberToProject,
  removeMemberFromProject,
};
```