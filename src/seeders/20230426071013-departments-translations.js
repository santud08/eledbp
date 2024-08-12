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
    const deptTranslationList = [
      { "id": "1", "department_id": "1", "department_name": "Production", "site_language": "en", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "2", "department_id": "1", "department_name": "제작", "site_language": "ko", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "3", "department_id": "2", "department_name": "Actors", "site_language": "en", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "4", "department_id": "2", "department_name": "배우", "site_language": "ko", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "5", "department_id": "3", "department_name": "Writing", "site_language": "en", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "6", "department_id": "3", "department_name": "각본", "site_language": "ko", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "7", "department_id": "4", "department_name": "Sound", "site_language": "en", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "8", "department_id": "4", "department_name": "음향", "site_language": "ko", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "9", "department_id": "5", "department_name": "Crew", "site_language": "en", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "10", "department_id": "5", "department_name": "제작진", "site_language": "ko", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "11", "department_id": "6", "department_name": "Costume & Make-Up", "site_language": "en", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "12", "department_id": "6", "department_name": "의상 & 메이크업", "site_language": "ko", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "13", "department_id": "7", "department_name": "Visual Effects", "site_language": "en", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "14", "department_id": "7", "department_name": "시각 효과", "site_language": "ko", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "15", "department_id": "8", "department_name": "Art", "site_language": "en", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "16", "department_id": "8", "department_name": "예술", "site_language": "ko", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "17", "department_id": "9", "department_name": "Editing", "site_language": "en", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "18", "department_id": "9", "department_name": "편집", "site_language": "ko", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "19", "department_id": "10", "department_name": "Directing", "site_language": "en", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "20", "department_id": "10", "department_name": "연출", "site_language": "ko", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "21", "department_id": "11", "department_name": "Lighting", "site_language": "en", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "22", "department_id": "11", "department_name": "조명", "site_language": "ko", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "23", "department_id": "12", "department_name": "Camera", "site_language": "en", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "24", "department_id": "12", "department_name": "카메라", "site_language": "ko", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "25", "department_id": "13", "department_name": "Creating-webtoon", "site_language": "en", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "26", "department_id": "13", "department_name": "크리에이터-웹툰", "site_language": "ko", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "27", "department_id": "14", "department_name": "Writing-webtoon", "site_language": "en", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "28", "department_id": "14", "department_name": "글-웹툰", "site_language": "ko", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "29", "department_id": "15", "department_name": "Illustrating-webtoon", "site_language": "en", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
      { "id": "30", "department_id": "15", "department_name": "그림-웹툰", "site_language": "ko", "status": "active", "created_at": "2022-09-21 15:58:08", "updated_at": null },
    ];
    await queryInterface.bulkInsert("edb_departments_translations", deptTranslationList, {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    await queryInterface.bulkDelete("edb_departments_translations", null, { truncate: true });
  },
};
