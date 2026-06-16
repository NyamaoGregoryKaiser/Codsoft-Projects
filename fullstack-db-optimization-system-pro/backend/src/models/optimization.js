```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Optimization = sequelize.define('Optimization', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    slowQueryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'slow_queries',
        key: 'id',
      },
    },
    suggestionText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'implemented', 'rejected', 'ignored'),
      defaultValue: 'pending',
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium', // Could be set by the analyzer or user
    },
    suggestedBy: { // User who triggered the analysis/suggestion
      type: DataTypes.INTEGER,
      allowNull: true, // Can be null if automated
      references: {
        model: 'users',
        key: 'id',
      },
    },
    implementationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'optimizations',
    timestamps: true,
    indexes: [
      { fields: ['slowQueryId'] },
      { fields: ['status'] },
      { fields: ['priority'] }
    ]
  });

  Optimization.associate = (models) => {
    Optimization.belongsTo(models.SlowQuery, { foreignKey: 'slowQueryId', as: 'slowQuery' });
    Optimization.belongsTo(models.User, { foreignKey: 'suggestedBy', as: 'suggester' });
  };

  return Optimization;
};
```