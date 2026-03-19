```javascript
module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: { msg: 'Category name cannot be empty.' },
                len: { args: [2, 100], msg: 'Category name must be between 2 and 100 characters.' }
            }
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: { msg: 'Category slug cannot be empty.' },
                is: {
                    args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    msg: 'Slug must be URL-friendly (lowercase, no spaces, hyphens allowed).'
                }
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        timestamps: true,
        tableName: 'categories',
        indexes: [
            {
                unique: true,
                fields: ['slug']
            }
        ]
    });

    return Category;
};
```