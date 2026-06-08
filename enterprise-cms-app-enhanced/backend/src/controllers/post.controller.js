const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const db = require('../models');

const createPost = catchAsync(async (req, res) => {
  // Ensure authorId is from authenticated user
  req.body.authorId = req.user.id;
  const post = await db.Post.create(req.body);
  res.status(httpStatus.CREATED).send(post);
});

const getPosts = catchAsync(async (req, res) => {
  // Implement filtering, pagination, sorting
  const posts = await db.Post.findAll({
    include: [
      { model: db.User, as: 'author', attributes: ['id', 'name', 'email'] },
      { model: db.Category, as: 'category', attributes: ['id', 'name'] },
      { model: db.Media, as: 'featuredImage', attributes: ['id', 'filePath'] }
    ]
  });
  res.send(posts);
});

const getPost = catchAsync(async (req, res) => {
  const post = await db.Post.findOne({
    where: { id: req.params.postId },
    include: [
      { model: db.User, as: 'author', attributes: ['id', 'name', 'email'] },
      { model: db.Category, as: 'category', attributes: ['id', 'name'] },
      { model: db.Media, as: 'featuredImage', attributes: ['id', 'filePath'] }
    ]
  });
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }
  res.send(post);
});

const updatePost = catchAsync(async (req, res) => {
  const post = await db.Post.findByPk(req.params.postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  // Only allow owner or admin/editor to update
  if (post.authorId !== req.user.id && !['admin', 'editor'].includes(req.user.role)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden: You do not own this post and lack permission');
  }

  Object.assign(post, req.body);
  await post.save();
  res.send(post);
});

const deletePost = catchAsync(async (req, res) => {
  const post = await db.Post.findByPk(req.params.postId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  // Only allow owner or admin to delete
  if (post.authorId !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden: You do not own this post and lack permission to delete');
  }

  await post.destroy();
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
};