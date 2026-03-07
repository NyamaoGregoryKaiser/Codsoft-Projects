```javascript
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Comment, User, Task, Project } = require('../models');

/**
 * Create a comment
 * @param {Object} commentBody
 * @returns {Promise<Comment>}
 */
const createComment = async (commentBody) => {
  const comment = await Comment.create(commentBody);
  return Comment.findByPk(comment.id, {
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
  });
};

/**
 * Get comments by task id
 * @param {UUID} taskId
 * @returns {Promise<Comment[]>}
 */
const getCommentsByTaskId = async (taskId) => {
  return Comment.findAll({
    where: { taskId },
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'ASC']],
  });
};

/**
 * Get comment by id
 * @param {UUID} commentId
 * @returns {Promise<Comment>}
 */
const getCommentById = async (commentId) => {
  return Comment.findByPk(commentId, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      { model: Task, as: 'task', include: [{ model: Project, as: 'project', attributes: ['id', 'name', 'ownerId'] }] },
    ],
  });
};

/**
 * Update comment by id
 * @param {UUID} commentId
 * @param {Object} updateBody
 * @param {User} currentUser
 * @returns {Promise<Comment>}
 */
const updateCommentById = async (commentId, updateBody, currentUser) => {
  const comment = await getCommentById(commentId);
  if (!comment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Comment not found');
  }

  if (comment.userId !== currentUser.id && currentUser.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the comment author or admin can update comments');
  }

  Object.assign(comment, updateBody);
  await comment.save();
  return getCommentById(comment.id); // Return updated comment with relations
};

/**
 * Delete comment by id
 * @param {UUID} commentId
 * @param {User} currentUser
 * @returns {Promise<Comment>}
 */
const deleteCommentById = async (commentId, currentUser) => {
  const comment = await getCommentById(commentId);
  if (!comment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Comment not found');
  }

  const projectOwnerId = comment.task.project.ownerId;

  // Only the comment author, project owner, or admin can delete comments
  if (comment.userId !== currentUser.id && projectOwnerId !== currentUser.id && currentUser.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this comment');
  }

  await comment.destroy();
  return comment;
};

module.exports = {
  createComment,
  getCommentsByTaskId,
  getCommentById,
  updateCommentById,
  deleteCommentById,
};
```