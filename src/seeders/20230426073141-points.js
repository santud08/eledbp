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
   const points=[
    {"id":"1","section":"add_title","division":null,"sub_division":null,"action_type":"add","credit_points":"300","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"2","section":"edit_title","division":"primary_details","sub_division":null,"action_type":"edit","credit_points":"10","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"3","section":"edit_media","division":"media","sub_division":"bg_image","action_type":"edit","credit_points":"20","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"4","section":"edit_media","division":"media","sub_division":"is_official_trailer","action_type":"edit","credit_points":"20","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"5","section":"edit_media","division":"media","sub_division":"poster_image","action_type":"edit","credit_points":"200","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"6","section":"edit_title","division":"series_season","sub_division":"series","action_type":"edit","credit_points":"30","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"7","section":"edit_title","division":"series_season","sub_division":"season","action_type":"edit","credit_points":"100","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"8","section":"edit_title","division":"series_season","sub_division":"episode","action_type":"edit","credit_points":"50","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"9","section":"edit_title","division":"credit","sub_division":"cast","action_type":"edit","credit_points":"20","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"10","section":"edit_title","division":"credit","sub_division":"crew","action_type":"edit","credit_points":"10","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"11","section":"edit_title","division":"tags","sub_division":"meta_tags","action_type":"edit","credit_points":"20","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"12","section":"add_media","division":null,"sub_division":"video","action_type":"add","credit_points":"300","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"13","section":"add_media","division":null,"sub_division":"image","action_type":"add","credit_points":"100","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"14","section":"add_media","division":null,"sub_division":"poster_image","action_type":"add","credit_points":"200","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"15","section":"community","division":null,"sub_division":"comment","action_type":"add","credit_points":"30","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"16","section":"community","division":null,"sub_division":"trivia","action_type":"add","credit_points":"200","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"17","section":"community","division":null,"sub_division":"famous_line","action_type":"add","credit_points":"100","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"18","section":"community","division":null,"sub_division":"goofs","action_type":"add","credit_points":"100","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"19","section":"community","division":null,"sub_division":"reply","action_type":"add","credit_points":"20","status":"active","created_at":"2023-03-03 11:37:18","created_by":null,"updated_at":null,"updated_by":null}
    ]
    await queryInterface.bulkInsert("edb_points", points, {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    await queryInterface.bulkDelete("edb_points", null, { truncate: true });
  }
};
