'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    const localization = [
      {"id":"1","name":"english","locale":"en_US","code":"en","iso":"US","status":"active","created_at":"2020-05-04 14:02:17","updated_at":"2023-03-25 20:27:37"},
      {"id":"2","name":"korean","locale":"ko_KR","code":"ko","iso":"KR","status":"active","created_at":"2020-05-04 16:37:28","updated_at":"2023-03-25 20:27:43"}
      ];

      await queryInterface.bulkInsert('edb_localizations', localization, {});

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    await queryInterface.bulkDelete("edb_localizations", null, { truncate: true });

  }
};
