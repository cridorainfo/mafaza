'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserLedger = sequelize.define('UserLedger', {
    investment: { type: DataTypes.FLOAT, allowNull: false },
    returns: { type: DataTypes.FLOAT, allowNull: false },
    roi: { type: DataTypes.FLOAT, allowNull: false },
    returnPeriod: { type: DataTypes.STRING, allowNull: false },
    withdrawal: { type: DataTypes.FLOAT, allowNull: false }
  }, {
    sequelize,
    modelName: 'UserLedger',
    timestamps: true
  })
  UserLedger.associate = function (models) {
    UserLedger.belongsTo(models.User)
    UserLedger.belongsTo(models.Project)
  };
  
  return UserLedger;
};