'use strict';
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    narration: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    receipt: {
      type: DataTypes.STRING, 
      allowNull: true,
    },
    adminReceipt: {
      type: DataTypes.STRING, 
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
  }, {
    sequelize,
    modelName: 'Transaction',
    timestamps: true
  })

  Transaction.associate = function (models) {
    Transaction.belongsTo(models.User)
    Transaction.belongsTo(models.Project)
  };
  
  return Transaction;
};