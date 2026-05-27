```javascript
const httpStatus = require('http-status');
const postService = require('../services/post.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const fs = require('fs').promises; // For file operations
const path = require('path');
const config = require('../config/config');

exports.getPosts = async (req, res, next) => {
  try {
    const { page, limit, category, search, status } = req.query;
    const filter = {};
    if (category) filter.categorySlug = category;
    if (search) filter.search = search;
    if (status) filter.status = status;

    const { posts, totalPosts, totalPages, currentPage } = await postService.queryPosts(filter, page, limit);
    res.status(httpStatus.OK).json({ posts, totalPosts, totalPages, currentPage });
  } catch (error) {
    next(error);
  }
};

exports.getPostById = async (req, res, next) => {
  try {
    const post = await postService.getPostById(req.params.id);
    if (!post) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
    }
    res.status(httpStatus.OK).json(post);
  } catch (error) {
    next(error);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const postBody = {
      ...req.body,
      authorId: req.user.id, // Set author from authenticated user
    };

    if (req.file) {
      postBody.featuredImage = `/uploads/posts/${req.file.filename}`;
    }

    const post = await postService.createPost(postBody);
    logger.info(`Post created by ${req.user.id}: ${post.title}`);
    res.status(httpStatus.CREATED).json(post);
  } catch (error) {
    // If file was uploaded but post creation failed, delete the file
    if (req.file) {
      await fs.unlink(req.file.path).catch(err => logger.error(`Failed to delete uploaded file: ${req.file.path}, error: ${err.message}`));
    }
    next(error);
  }
};

exports.updatePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await postService.getPostById(postId);

    if (!post) {
      if (req.file) { // If new file was uploaded but post not found
        await fs.unlink(req.file.path).catch(err => logger.error(`Failed to delete uploaded file: ${req.file.path}, error: ${err.message}`));
      }
      throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
    }

    // Authorization: Only admin/editor or the original author can update
    if (req.user.role === 'author' && post.authorId !== req.user.id) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(err => logger.error(`Failed to delete uploaded file: ${req.file.path}, error: ${err.message}`));
      }
      throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to update this post.');
    }

    const updateBody = { ...req.body };
    let oldImagePath = post.featuredImage;

    // Handle new featured image upload
    if (req.file) {
      updateBody.featuredImage = `/uploads/posts/${req.file.filename}`;
    } else if (req.body.removeFeaturedImage === 'true') {
      updateBody.featuredImage = null;
      // If we remove an image explicitly, we should delete the old one
    } else {
      // If no new file and no explicit removal, keep the old path from the DB
      delete updateBody.featuredImage;
    }

    // If a new image is uploaded or an old one explicitly removed, delete the previous file
    if ((req.file && oldImagePath) || (req.body.removeFeaturedImage === 'true' && oldImagePath)) {
      const fullOldPath = path.join(__dirname, '../../uploads', oldImagePath.replace('/uploads/', ''));
      try {
        await fs.unlink(fullOldPath);
        logger.info(`Deleted old featured image: ${fullOldPath}`);
      } catch (err) {
        // Log but don't fail the request if file deletion fails (e.g., file not found or permissions)
        logger.warn(`Failed to delete old featured image: ${fullOldPath}, error: ${err.message}`);
      }
    }

    const updatedPost = await postService.updatePostById(postId, updateBody);
    logger.info(`Post ${postId} updated by ${req.user.id}`);
    res.status(httpStatus.OK).json(updatedPost);
  } catch (error) {
    // If new file was uploaded but update failed, delete the new file
    if (req.file) {
      await fs.unlink(req.file.path).catch(err => logger.error(`Failed to delete new uploaded file (rollback): ${req.file.path}, error: ${err.message}`));
    }
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await postService.getPostById(postId);

    if (!post) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
    }

    // Authorization: Only admin/editor or the original author can delete
    if (req.user.role === 'author' && post.authorId !== req.user.id) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to delete this post.');
    }

    await postService.deletePostById(postId);

    // If the post had a featured image, delete the file from storage
    if (post.featuredImage) {
      const fullImagePath = path.join(__dirname, '../../uploads', post.featuredImage.replace('/uploads/', ''));
      try {
        await fs.unlink(fullImagePath);
        logger.info(`Deleted featured image for post ${postId}: ${fullImagePath}`);
      } catch (err) {
        logger.warn(`Failed to delete featured image file during post deletion: ${fullImagePath}, error: ${err.message}`);
      }
    }

    logger.info(`Post ${postId} deleted by ${req.user.id}`);
    res.status(httpStatus.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
```