```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QueryPlan = sequelize.define('QueryPlan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    slowQueryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // One plan per slow query
      references: {
        model: 'slow_queries',
        key: 'id',
      },
    },
    planJson: {
      type: DataTypes.JSONB, // Store as JSON B for PostgreSQL
      allowNull: false,
    },
    planText: { // Raw text output of EXPLAIN ANALYZE
      type: DataTypes.TEXT,
      allowNull: false,
    },
    analysisDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'query_plans',
    timestamps: true,
    updatedAt: 'analysisDate', // Alias for when the plan was last analyzed
    indexes: [
      { fields: ['slowQueryId'] }
    ]
  });

  QueryPlan.associate = (models) => {
    QueryPlan.belongsTo(models.SlowQuery, { foreignKey: 'slowQueryId', as: 'slowQuery' });
  };

  return QueryPlan;
};
```