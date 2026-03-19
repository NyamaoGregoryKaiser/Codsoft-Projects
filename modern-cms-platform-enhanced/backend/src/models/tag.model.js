```javascript
module.exports = (sequelize, DataTypes) => {
    const Tag = sequelize.define('Tag', {
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
                notEmpty: { msg: 'Tag name cannot be empty.' },
                len: { args: [2, 50], msg: 'Tag name must be between 2 and 50 characters.' }
            }
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: { msg: 'Tag slug cannot be empty.' },
                is: {
                    args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    msg: 'Slug must be URL-friendly (lowercase, no spaces, hyphens allowed).'
                }
            }
        }
    }, {
        timestamps: true,
        tableName: 'tags',
        indexes: [
            {
                unique: true,
                fields: ['slug']
            }
        ]
    });

    return Tag;
};
```