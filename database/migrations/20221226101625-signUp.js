"use strict";

const table = "sign_up";

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.createTable(table, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      firstname:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastname:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      email:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      password:{
        type: Sequelize.STRING,
        allowNull: false,
      }
    })
  },
  down: async function (queryInterface) {
    await queryInterface.dropTable(table);
  },
};
