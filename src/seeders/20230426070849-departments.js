"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    const departmentList = [
      { "id": "1", "department_name": "Production", "status": "active", "created_at": "2022-09-21 15:52:53", "updated_at": null },
      { "id": "2", "department_name": "Actors", "status": "active", "created_at": "2022-09-21 15:52:53", "updated_at": null },
      { "id": "3", "department_name": "Writing", "status": "active", "created_at": "2022-09-21 15:52:53", "updated_at": null },
      { "id": "4", "department_name": "Sound", "status": "active", "created_at": "2022-09-21 15:52:53", "updated_at": null },
      { "id": "5", "department_name": "Crew", "status": "active", "created_at": "2022-09-21 15:52:53", "updated_at": null },
      { "id": "6", "department_name": "Costume & Make-Up", "status": "active", "created_at": "2022-09-21 15:52:53", "updated_at": null },
      { "id": "7", "department_name": "Visual Effects", "status": "active", "created_at": "2022-09-21 15:52:53", "updated_at": null },
      { "id": "8", "department_name": "Art", "status": "active", "created_at": "2022-09-21 15:52:53", "updated_at": null },
      { "id": "9", "department_name": "Editing", "status": "active", "created_at": "2022-09-21 15:52:53", "updated_at": null },
      { "id": "10", "department_name": "Directing", "status": "active", "created_at": "2022-09-21 15:52:53", "updated_at": null },
      { "id": "11", "department_name": "Lighting", "status": "active", "created_at": "2022-09-21 15:52:53", "updated_at": null },
      { "id": "12", "department_name": "Camera", "status": "active", "created_at": "2022-09-21 15:52:53", "updated_at": null },
      { "id": "13", "department_name": "Creating-webtoon", "status": "active", "created_at": "2023-09-11 15:52:53", "updated_at": null },
      { "id": "14", "department_name": "Writing-webtoon", "status": "active", "created_at": "2023-09-11 15:52:53", "updated_at": null },
      { "id": "15", "department_name": "Illustrating-webtoon", "status": "active", "created_at": "2023-09-11 15:52:53", "updated_at": null },
    ];
    await queryInterface.bulkInsert("edb_departments", departmentList, {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("edb_departments", null, { truncate: true });
  },
};
