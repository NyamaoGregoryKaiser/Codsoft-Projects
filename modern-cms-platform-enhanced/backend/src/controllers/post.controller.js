```javascript
const postService = require('../services/post.service');
const logger = require('../utils/logger');
const { deleteCache } = require('../utils/cache');
const config = require('../config/config');

// Cache keys for content
const ALL_POSTS_CACHE_KEY = '/api/posts';
const PUBLIC_POSTS_CACHE_KEY = '/api/posts/published';

/**
 * Create a new post. (Admin/Author only)
 */
exports.createPost = async (req, res, next) => {
    try {
        // Ensure authorId is set to the authenticated user's ID
        req.body.authorId = req.user.id;
        const post = await postService.createPost(req.body);

        // Invalidate caches
        deleteCache(ALL_POSTS_CACHE_KEY);
        deleteCache(PUBLIC_POSTS_CACHE_KEY);

        res.status(201).json({ message: 'Post created successfully.', post });
    } catch (error) {
        logger.error('Error creating post:', error.message);
        next(error);
    }
};

/**
 * Get all posts (includes drafts/archived for authorized users).
 * Can be cached.
 */
exports.getAllPosts = async (req, res, next) => {
    try {
        const posts = await postService.findAllPosts(req.user.role);
        res.status(200).json(posts);
    } catch (error) {
        logger.error('Error fetching all posts:', error.message);
        next(error);
    }
};

/**
 * Get all *published* posts (publicly accessible).
 * Can be heavily cached.
 */
exports.getPublishedPosts = async (req, res, next) => {
    try {
        const posts = await postService.findPublishedPosts();
        res.status(200).json(posts);
    } catch (error) {
        logger.error('Error fetching published posts:', error.message);
        next(error);
    }
};

/**
 * Get a single post by ID or Slug.
 */
exports.getPost = async (req, res, next) => {
    try {
        const { identifier } = req.params; // Can be ID or Slug
        const post = await postService.findPostByIdentifier(identifier, req.user ? req.user.role : null);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }
        res.status(200).json(post);
    } catch (error) {
        logger.error(`Error fetching post ${req.params.identifier}:`, error.message);
        next(error);
    }
};

/**
 * Update a post. (Admin/Author only, authors can only update their own posts unless admin)
 */
exports.updatePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedPost = await postService.updatePost(id, req.body, req.user);
        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found or unauthorized to update.' });
        }
        // Invalidate caches
        deleteCache(ALL_POSTS_CACHE_KEY);
        deleteCache(PUBLIC_POSTS_CACHE_KEY);
        deleteCache(`/api/posts/${id}`); // Invalidate specific post cache
        deleteCache(`/api/posts/slug/${updatedPost.slug}`); // Invalidate specific post cache by slug

        res.status(200).json({ message: 'Post updated successfully.', post: updatedPost });
    } catch (error) {
        logger.error(`Error updating post ${req.params.id}:`, error.message);
        next(error);
    }
};

/**
 * Delete a post. (Admin/Author only, authors can only delete their own posts unless admin)
 */
exports.deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const success = await postService.deletePost(id, req.user);
        if (!success) {
            return res.status(404).json({ message: 'Post not found or unauthorized to delete.' });
        }
        // Invalidate caches
        deleteCache(ALL_POSTS_CACHE_KEY);
        deleteCache(PUBLIC_POSTS_CACHE_KEY);
        deleteCache(`/api/posts/${id}`); // Invalidate specific post cache

        res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (error) {
        logger.error(`Error deleting post ${req.params.id}:`, error.message);
        next(error);
    }
};

/**
 * Upload a featured image for a post.
 */
exports.uploadFeaturedImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const filePath = `/uploads/${req.file.filename}`; // Path to serve publicly

        // You might want to update the post's featuredImage field here
        // For simplicity, we just return the path for the frontend to use.
        res.status(200).json({
            message: 'Image uploaded successfully.',
            imageUrl: filePath,
            fileName: req.file.filename
        });

    } catch (error) {
        logger.error('Error uploading featured image:', error.message);
        next(error);
    }
};
```