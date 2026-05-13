'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserSecurity = sequelize.define('UserSecurity', {
    mustChangePassword: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'UserSecurity',
    timestamps: true
  });

  UserSecurity.associate = function (models) {
    UserSecurity.belongsTo(models.User, { foreignKey: 'UserId', onDelete: 'CASCADE' });
  };

  return UserSecurity;
};
