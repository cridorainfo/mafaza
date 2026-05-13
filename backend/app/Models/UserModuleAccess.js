'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserModuleAccess = sequelize.define('UserModuleAccess', {
    roleName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Custom Role'
    },
    dashboard: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    users: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    transactions: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    ledger: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    projects: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'UserModuleAccess',
    timestamps: true
  });

  UserModuleAccess.associate = function (models) {
    UserModuleAccess.belongsTo(models.User, { foreignKey: 'UserId', onDelete: 'CASCADE' });
  };

  return UserModuleAccess;
};
