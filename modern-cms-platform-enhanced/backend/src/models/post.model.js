```javascript
module.exports = (sequelize, DataTypes) => {
    const Post = sequelize.define('Post', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: { msg: 'Post title cannot be empty.' },
                len: { args: [5, 255], msg: 'Post title must be between 5 and 255 characters.' }
            }
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: { msg: 'Post slug cannot be empty.' },
                is: {
                    args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, // lowercase letters, numbers, and hyphens only
                    msg: 'Slug must be URL-friendly (lowercase, no spaces, hyphens allowed).'
                }
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Post content cannot be empty.' }
            }
        },
        excerpt: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('draft', 'published', 'archived'),
            defaultValue: 'draft',
            allowNull: false
        },
        featuredImage: {
            type: DataTypes.STRING, // Store path to image
            allowNull: true
        },
        publishedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        authorId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users', // Refers to the table name
                key: 'id',
            }
        },
        categoryId: {
            type: DataTypes.UUID,
            allowNull: true, // A post can exist without a category
            references: {
                model: 'categories',
                key: 'id',
            }
        }
    }, {
        timestamps: true,
        tableName: 'posts',
        indexes: [
            {
                unique: true,
                fields: ['slug']
            },
            {
                fields: ['authorId']
            },
            {
                fields: ['categoryId']
            },
            {
                fields: ['status']
            }
        ]
    });

    // Hook to automatically set `publishedAt` when status changes to 'published'
    Post.beforeUpdate(async (post, options) => {
        if (post.changed('status') && post.status === 'published' && !post.publishedAt) {
            post.publishedAt = new Date();
        }
        // If status changes from published to something else, clear publishedAt
        if (post.changed('status') && post.previous('status') === 'published' && post.status !== 'published') {
            post.publishedAt = null;
        }
    });

    return Post;
};
```