```javascript
module.exports = (sequelize, DataTypes) => {
  const ContentType = sequelize.define('ContentType', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notNull: { msg: 'Content type name is required' },
        notEmpty: { msg: 'Content type name cannot be empty' },
        len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters' }
      }
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notNull: { msg: 'Slug is required' },
        notEmpty: { msg: 'Slug cannot be empty' },
        is: {
          args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, // lowercase, alphanumeric, hyphens
          msg: 'Slug must be lowercase alphanumeric with hyphens'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Schema definition for content fields
    fields: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidFields(value) {
          if (!Array.isArray(value)) {
            throw new Error('Fields must be an array');
          }
          value.forEach(field => {
            if (!field.name || !field.type) {
              throw new Error('Each field must have a name and type');
            }
            if (!['text', 'richtext', 'number', 'boolean', 'date', 'media', 'relation'].includes(field.type)) {
              throw new Error(`Invalid field type: ${field.type}`);
            }
            if (!field.label) field.label = field.name; // Auto-generate label if missing
          });
        }
      }
    }
  }, {
    tableName: 'content_types',
    timestamps: true
  });

  ContentType.associate = (models) => {
    ContentType.hasMany(models.Entry, { foreignKey: 'contentTypeId', as: 'entries' });
  };

  return ContentType;
};
```