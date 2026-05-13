'use strict';
module.exports = (sequelize, DataTypes) => {
  const PasswordResetToken = sequelize.define('PasswordResetToken', {
    tokenHash: { type: DataTypes.STRING, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    usedAt: { type: DataTypes.DATE, allowNull: true },
    createdByIp: { type: DataTypes.STRING, allowNull: true },
    resetByIp: { type: DataTypes.STRING, allowNull: true }
  }, {
    sequelize,
    modelName: 'PasswordResetToken',
    timestamps: true
  })

  PasswordResetToken.associate = function (models) {
    PasswordResetToken.belongsTo(models.User)
  }

  return PasswordResetToken
}
