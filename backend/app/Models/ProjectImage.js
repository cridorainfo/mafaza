'use strict';
module.exports = (sequelize, DataTypes) => {
  const ProjectImage = sequelize.define('ProjectImage', {
    link: { 
      type: DataTypes.STRING, 
      allowNull: false 
    }
  }, {
    sequelize,
    modelName: 'ProjectImage',
    timestamps: true
  })
  
  ProjectImage.associate = function (models) {
    ProjectImage.belongsTo(models.Project)
  };
  
  return ProjectImage;
};