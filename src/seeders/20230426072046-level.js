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
   const levelList=[
    {"id":"1","level":"1","display_level":"Lv. One","point_from":"0","point_to":"3000","status":"active","created_at":"2023-02-16 12:35:33","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"2","level":"2","display_level":"Lv. 2","point_from":"3001","point_to":"6000","status":"active","created_at":"2023-02-16 12:35:33","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"3","level":"3","display_level":"Lv. 3","point_from":"6001","point_to":"12000","status":"active","created_at":"2023-02-16 12:35:33","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"4","level":"4","display_level":"Lv. 4","point_from":"12001","point_to":"18000","status":"active","created_at":"2023-02-16 12:35:33","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"5","level":"5","display_level":"Lv. 5","point_from":"18001","point_to":"27000","status":"active","created_at":"2023-02-16 12:35:33","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"6","level":"6","display_level":"Lv. 6","point_from":"27001","point_to":"36000","status":"active","created_at":"2023-02-16 12:35:33","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"7","level":"7","display_level":"Lv. 7","point_from":"36001","point_to":"48000","status":"active","created_at":"2023-02-16 12:35:33","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"8","level":"8","display_level":"Lv. 8","point_from":"48001","point_to":"60000","status":"active","created_at":"2023-02-16 12:35:33","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"9","level":"9","display_level":"Lv. 9","point_from":"61001","point_to":"75000","status":"active","created_at":"2023-02-16 12:35:33","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"10","level":"10","display_level":"Lv. 10","point_from":"75001","point_to":"90000","status":"active","created_at":"2023-02-16 12:35:33","created_by":null,"updated_at":null,"updated_by":null}
    ]
    await queryInterface.bulkInsert("edb_level", levelList, {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  
    await queryInterface.bulkDelete("edb_level", null, { truncate: true });
  }
};
