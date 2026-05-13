'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    avatar: { type: DataTypes.STRING, allowNull: true },
    phoneNumber: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    country: { type: DataTypes.STRING },
    role: { 
      type: DataTypes.ENUM('admin', 'user'), 
      allowNull: false,  
      defaultValue: "user",
      validate: {
        isIn: [['admin', 'user']],
      }
    },
    status: { 
      type: DataTypes.ENUM('pending', 'verified', 'inactive'), 
      allowNull: false,  
      defaultValue: "pending",
      validate: {
        isIn: [['pending', 'verified', 'inactive']],
      }
    }
  }, {
    sequelize,
    modelName: 'User',
    timestamps: true,
    defaultScope: {
      // exclude password hash by default
      attributes: { exclude: ['password'] }
    },
    scopes: {
        // include hash with this scope
        withHash: { attributes: {}, }
    }
  })
  User.associate = function (models) {
    User.hasMany(models.refreshTokens, { onDelete: 'CASCADE' });
    User.hasMany(models.PasswordResetToken, { as: 'passwordResetTokens', onDelete: 'CASCADE' });
    User.hasMany(models.Transaction, { onDelete: 'CASCADE' });
    User.hasMany(models.Project, { onDelete: 'CASCADE' });
    User.hasMany(models.UserLedger, { as: 'ledgers', onDelete: 'CASCADE' });
    User.hasMany(models.AuditLog, { as: 'auditLogs', foreignKey: 'UserId', onDelete: 'SET NULL' });
    User.hasMany(models.Notification, { as: 'notifications', foreignKey: 'UserId', onDelete: 'CASCADE' });
    User.hasOne(models.UserModuleAccess, { as: 'moduleAccess', foreignKey: 'UserId', onDelete: 'CASCADE' });
    User.hasOne(models.UserSecurity, { as: 'security', foreignKey: 'UserId', onDelete: 'CASCADE' });
  };
  
  return User;
};
