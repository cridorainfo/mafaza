'use strict';

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    targetType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    targetId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AuditLog',
    timestamps: true
  });

  AuditLog.associate = function (models) {
    AuditLog.belongsTo(models.User, {
      as: 'actor',
      foreignKey: 'UserId',
      onDelete: 'SET NULL'
    });
  };

  return AuditLog;
};
