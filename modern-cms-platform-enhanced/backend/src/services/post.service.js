```javascript
const { Post, User, Category, Tag, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Helper to include common associations for posts.
 */
const getPostIncludes = () => [
    { model: User, as: 'author', attributes: ['id', 'username', 'email'] },
    { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
    { model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: { attributes: [] } }, // Exclude join table attributes
];

/**
 * Creates a new post.
 * @param {Object} postData - Post data including title, content, authorId, categoryId, tagIds.
 * @returns {Promise<Post>} The created post.
 */
exports.createPost = async (postData) => {
    const transaction = await sequelize.transaction();
    try {
        const { title, content, excerpt, status, featuredImage, authorId, categoryId, tagIds = [] } = postData;

        // Basic validation for required fields
        if (!title || !content || !authorId) {
            const error = new Error('Title, content, and author ID are required.');
            error.status = 400;
            throw error;
        }

        // Generate slug from title
        const slug = title.toLowerCase()
                          .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars except space and hyphen
                          .replace(/\s+/g, '-')       // Replace spaces with hyphens
                          .replace(/-+/g, '-')        // Replace multiple hyphens with single
                          .trim();

        // Check for existing slug to prevent duplicates
        const existingPost = await Post.findOne({ where: { slug } });
        if (existingPost) {
            const error = new Error('A post with this slug already exists. Please choose a different title.');
            error.status = 409;
            throw error;
        }

        const newPost = await Post.create({
            title,
            slug,
            content,
            excerpt: excerpt || content.substring(0, 150) + '...', // Auto-generate excerpt if not provided
            status: status || 'draft',
            featuredImage,
            authorId,
            categoryId,
            publishedAt: status === 'published' ? new Date() : null,
        }, { transaction });

        if (tagIds && tagIds.length > 0) {
            const tags = await Tag.findAll({ where: { id: tagIds }, transaction });
            if (tags.length !== tagIds.length) {
                const error = new Error('One or more specified tags do not exist.');
                error.status = 400;
                throw error;
            }
            await newPost.setTags(tags, { transaction });
        }

        await transaction.commit();
        logger.info(`Post created: ${newPost.id} by author ${authorId}`);
        return newPost;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating post:', error);
        if (error.name === 'SequelizeValidationError') {
            const validationError = new Error(error.errors.map(e => e.message).join(', '));
            validationError.status = 400;
            throw validationError;
        }
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            const fkError = new Error('Invalid author or category ID provided.');
            fkError.status = 400;
            throw fkError;
        }
        throw error;
    }
};

/**
 * Finds all posts based on user role.
 * @param {string} userRole - Role of the authenticated user.
 * @returns {Promise<Post[]>} An array of posts.
 */
exports.findAllPosts = async (userRole = 'viewer') => {
    const whereClause = userRole === 'admin' ? {} : { status: 'published' };
    try {
        const posts = await Post.findAll({
            where: whereClause,
            include: getPostIncludes(),
            order: [['createdAt', 'DESC']]
        });
        logger.debug('Fetched all posts (filtered by role).');
        return posts;
    } catch (error) {
        logger.error('Error in findAllPosts:', error);
        throw new Error('Could not fetch posts.');
    }
};

/**
 * Finds all published posts for public access.
 * @returns {Promise<Post[]>} An array of published posts.
 */
exports.findPublishedPosts = async () => {
    try {
        const posts = await Post.findAll({
            where: { status: 'published' },
            include: getPostIncludes(),
            order: [['publishedAt', 'DESC']]
        });
        logger.debug('Fetched all published posts.');
        return posts;
    } catch (error) {
        logger.error('Error in findPublishedPosts:', error);
        throw new Error('Could not fetch published posts.');
    }
};

/**
 * Finds a single post by ID or Slug.
 * @param {string} identifier - Post ID (UUID) or Slug.
 * @param {string} userRole - Role of the authenticated user.
 * @returns {Promise<Post|null>} The post object or null if not found/unauthorized.
 */
exports.findPostByIdentifier = async (identifier, userRole = 'viewer') => {
    const whereClause = {
        [Op.or]: [
            { id: identifier },
            { slug: identifier }
        ]
    };

    if (userRole !== 'admin') {
        whereClause.status = 'published';
    }

    try {
        const post = await Post.findOne({
            where: whereClause,
            include: getPostIncludes()
        });
        logger.debug(`Fetched post by identifier: ${identifier}`);
        return post;
    } catch (error) {
        logger.error(`Error in findPostByIdentifier for ${identifier}:`, error);
        throw new Error('Could not fetch post.');
    }
};


/**
 * Updates an existing post.
 * @param {string} postId - The UUID of the post to update.
 * @param {Object} updateData - Data to update.
 * @param {Object} currentUser - The authenticated user object (for authorization).
 * @returns {Promise<Post|null>} The updated post or null if not found/unauthorized.
 */
exports.updatePost = async (postId, updateData, currentUser) => {
    const transaction = await sequelize.transaction();
    try {
        const post = await Post.findByPk(postId);
        if (!post) {
            await transaction.rollback();
            return null; // Post not found
        }

        // Authorization check
        if (currentUser.role !== 'admin' && post.authorId !== currentUser.id) {
            const error = new Error('Unauthorized to update this post.');
            error.status = 403; // Forbidden
            throw error;
        }

        // If title is updated, re-generate slug
        if (updateData.title && updateData.title !== post.title) {
            updateData.slug = updateData.title.toLowerCase()
                                .replace(/[^a-z0-9\s-]/g, '')
                                .replace(/\s+/g, '-')
                                .replace(/-+/g, '-')
                                .trim();
            // Check for slug uniqueness
            const existingPostWithSlug = await Post.findOne({ where: { slug: updateData.slug, id: { [Op.ne]: postId } } });
            if (existingPostWithSlug) {
                const error = new Error('A post with this slug already exists. Please choose a different title.');
                error.status = 409;
                throw error;
            }
        }

        // Update post fields
        await post.update(updateData, { transaction });

        // Update tags if provided
        if (updateData.tagIds) {
            const tags = await Tag.findAll({ where: { id: updateData.tagIds }, transaction });
            if (tags.length !== updateData.tagIds.length) {
                const error = new Error('One or more specified tags do not exist.');
                error.status = 400;
                throw error;
            }
            await post.setTags(tags, { transaction });
        }

        await transaction.commit();
        logger.info(`Post updated: ${postId}`);
        return await this.findPostByIdentifier(postId, currentUser.role); // Return full post with associations
    } catch (error) {
        await transaction.rollback();
        logger.error(`Error in updatePost for ${postId}:`, error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const validationError = new Error(error.errors ? error.errors.map(e => e.message).join(', ') : error.message);
            validationError.status = 400;
            throw validationError;
        }
        throw error;
    }
};

/**
 * Deletes a post.
 * @param {string} postId - The UUID of the post to delete.
 * @param {Object} currentUser - The authenticated user object (for authorization).
 * @returns {Promise<boolean>} True if deleted, false if not found/unauthorized.
 */
exports.deletePost = async (postId, currentUser) => {
    try {
        const post = await Post.findByPk(postId);
        if (!post) {
            return false; // Post not found
        }

        // Authorization check
        if (currentUser.role !== 'admin' && post.authorId !== currentUser.id) {
            const error = new Error('Unauthorized to delete this post.');
            error.status = 403; // Forbidden
            throw error;
        }

        await post.destroy();
        logger.info(`Post deleted: ${postId}`);
        return true;
    } catch (error) {
        logger.error(`Error in deletePost for ${postId}:`, error);
        throw new Error('Could not delete post.');
    }
};

/**
 * Creates a new category.
 * @param {Object} categoryData - Category name and optional description.
 * @returns {Promise<Category>} The created category.
 */
exports.createCategory = async (categoryData) => {
    try {
        const { name, description } = categoryData;
        const slug = name.toLowerCase()
                         .replace(/[^a-z0-9\s-]/g, '')
                         .replace(/\s+/g, '-')
                         .replace(/-+/g, '-')
                         .trim();
        const category = await Category.create({ name, slug, description });
        logger.info(`Category created: ${category.name}`);
        return category;
    } catch (error) {
        logger.error('Error creating category:', error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const validationError = new Error(error.errors ? error.errors.map(e => e.message).join(', ') : error.message);
            validationError.status = 400;
            throw validationError;
        }
        throw new Error('Could not create category.');
    }
};

/**
 * Finds all categories.
 * @returns {Promise<Category[]>} An array of categories.
 */
exports.findAllCategories = async () => {
    try {
        const categories = await Category.findAll();
        logger.debug('Fetched all categories.');
        return categories;
    } catch (error) {
        logger.error('Error in findAllCategories:', error);
        throw new Error('Could not fetch categories.');
    }
};

/**
 * Updates a category.
 * @param {string} categoryId - UUID of the category.
 * @param {Object} updateData - Data to update.
 * @returns {Promise<Category|null>} Updated category or null if not found.
 */
exports.updateCategory = async (categoryId, updateData) => {
    try {
        const category = await Category.findByPk(categoryId);
        if (!category) {
            return null;
        }
        if (updateData.name && updateData.name !== category.name) {
            updateData.slug = updateData.name.toLowerCase()
                                 .replace(/[^a-z0-9\s-]/g, '')
                                 .replace(/\s+/g, '-')
                                 .replace(/-+/g, '-')
                                 .trim();
            const existingCategoryWithSlug = await Category.findOne({ where: { slug: updateData.slug, id: { [Op.ne]: categoryId } } });
            if (existingCategoryWithSlug) {
                const error = new Error('A category with this slug already exists. Please choose a different name.');
                error.status = 409;
                throw error;
            }
        }
        await category.update(updateData);
        logger.info(`Category updated: ${categoryId}`);
        return category;
    } catch (error) {
        logger.error(`Error in updateCategory for ${categoryId}:`, error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const validationError = new Error(error.errors ? error.errors.map(e => e.message).join(', ') : error.message);
            validationError.status = 400;
            throw validationError;
        }
        throw new Error('Could not update category.');
    }
};

/**
 * Deletes a category.
 * @param {string} categoryId - UUID of the category.
 * @returns {Promise<boolean>} True if deleted, false if not found.
 */
exports.deleteCategory = async (categoryId) => {
    try {
        const category = await Category.findByPk(categoryId);
        if (!category) {
            return false;
        }
        // Disassociate posts from this category before deleting
        await Post.update({ categoryId: null }, { where: { categoryId } });
        await category.destroy();
        logger.info(`Category deleted: ${categoryId}`);
        return true;
    } catch (error) {
        logger.error(`Error in deleteCategory for ${categoryId}:`, error);
        throw new Error('Could not delete category.');
    }
};

/**
 * Creates a new tag.
 * @param {Object} tagData - Tag name.
 * @returns {Promise<Tag>} The created tag.
 */
exports.createTag = async (tagData) => {
    try {
        const { name } = tagData;
        const slug = name.toLowerCase()
                         .replace(/[^a-z0-9\s-]/g, '')
                         .replace(/\s+/g, '-')
                         .replace(/-+/g, '-')
                         .trim();
        const tag = await Tag.create({ name, slug });
        logger.info(`Tag created: ${tag.name}`);
        return tag;
    } catch (error) {
        logger.error('Error creating tag:', error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const validationError = new Error(error.errors ? error.errors.map(e => e.message).join(', ') : error.message);
            validationError.status = 400;
            throw validationError;
        }
        throw new Error('Could not create tag.');
    }
};

/**
 * Finds all tags.
 * @returns {Promise<Tag[]>} An array of tags.
 */
exports.findAllTags = async () => {
    try {
        const tags = await Tag.findAll();
        logger.debug('Fetched all tags.');
        return tags;
    } catch (error) {
        logger.error('Error in findAllTags:', error);
        throw new Error('Could not fetch tags.');
    }
};

/**
 * Updates a tag.
 * @param {string} tagId - UUID of the tag.
 * @param {Object} updateData - Data to update.
 * @returns {Promise<Tag|null>} Updated tag or null if not found.
 */
exports.updateTag = async (tagId, updateData) => {
    try {
        const tag = await Tag.findByPk(tagId);
        if (!tag) {
            return null;
        }
        if (updateData.name && updateData.name !== tag.name) {
            updateData.slug = updateData.name.toLowerCase()
                                 .replace(/[^a-z0-9\s-]/g, '')
                                 .replace(/\s+/g, '-')
                                 .replace(/-+/g, '-')
                                 .trim();
            const existingTagWithSlug = await Tag.findOne({ where: { slug: updateData.slug, id: { [Op.ne]: tagId } } });
            if (existingTagWithSlug) {
                const error = new Error('A tag with this slug already exists. Please choose a different name.');
                error.status = 409;
                throw error;
            }
        }
        await tag.update(updateData);
        logger.info(`Tag updated: ${tagId}`);
        return tag;
    } catch (error) {
        logger.error(`Error in updateTag for ${tagId}:`, error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const validationError = new Error(error.errors ? error.errors.map(e => e.message).join(', ') : error.message);
            validationError.status = 400;
            throw validationError;
        }
        throw new Error('Could not update tag.');
    }
};

/**
 * Deletes a tag.
 * @param {string} tagId - UUID of the tag.
 * @returns {Promise<boolean>} True if deleted, false if not found.
 */
exports.deleteTag = async (tagId) => {
    try {
        const tag = await Tag.findByPk(tagId);
        if (!tag) {
            return false;
        }
        // All associations will be handled by Sequelize (PostTags join table)
        await tag.destroy();
        logger.info(`Tag deleted: ${tagId}`);
        return true;
    } catch (error) {
        logger.error(`Error in deleteTag for ${tagId}:`, error);
        throw new Error('Could not delete tag.');
    }
};
```