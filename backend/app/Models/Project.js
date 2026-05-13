'use strict';
module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    name: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    totalInvestement: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    minROI: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    maxROI: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    description: { 
      type: DataTypes.TEXT, 
      allowNull: false 
    },
    isActive: { 
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Project',
    timestamps: true
  })
  
  Project.associate = function (models) {
    Project.belongsTo(models.User)
    Project.hasMany(models.ProjectImage, { onDelete: 'CASCADE' });
    Project.hasMany(models.Transaction, { onDelete: 'CASCADE' });
    Project.hasMany(models.UserLedger, { as: 'ledgers', onDelete: 'CASCADE' });
  };
  
  return Project;
};