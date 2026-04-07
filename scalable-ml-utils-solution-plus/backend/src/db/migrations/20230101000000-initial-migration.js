```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('user', 'admin'),
        defaultValue: 'user',
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Datasets table
    await queryInterface.createTable('datasets', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT
      },
      source_url: {
        type: Sequelize.STRING
      },
      schema_preview: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      owner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Models table
    await queryInterface.createTable('models', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      version: {
        type: Sequelize.STRING,
        defaultValue: '1.0.0'
      },
      description: {
        type: Sequelize.TEXT
      },
      type: {
        type: Sequelize.ENUM('classification', 'regression', 'clustering', 'other'),
        defaultValue: 'other',
        allowNull: false
      },
      endpoint_url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      owner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      dataset_id: {
        type: Sequelize.UUID,
        references: {
          model: 'datasets',
          key: 'id'
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Inference Logs table
    await queryInterface.createTable('inference_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      model_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'models',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      request_payload: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      response_payload: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      status: {
        type: Sequelize.ENUM('success', 'error'),
        allowNull: false
      },
      duration_ms: {
        type: Sequelize.INTEGER
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for query optimization
    await queryInterface.addIndex('models', ['owner_id']);
    await queryInterface.addIndex('models', ['dataset_id']);
    await queryInterface.addIndex('inference_logs', ['model_id']);
    await queryInterface.addIndex('inference_logs', ['timestamp']);
    await queryInterface.addIndex('datasets', ['owner_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order of creation to handle foreign key constraints
    await queryInterface.dropTable('inference_logs');
    await queryInterface.dropTable('models');
    await queryInterface.dropTable('datasets');
    await queryInterface.dropTable('users');

    // Remove enums manually if using Postgres, as dropTable doesn't remove them
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_models_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inference_logs_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  }
};
```