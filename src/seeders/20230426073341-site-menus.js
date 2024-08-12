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
   const siteMenus = [
    {"id":"1","menu_name":"Edit","parent_menu_id":"0","menu_key":"edit","list_order":"0","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"2","menu_name":"News","parent_menu_id":"0","menu_key":"news","list_order":"1","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"3","menu_name":"Dictionary","parent_menu_id":"0","menu_key":"dictionary","list_order":"2","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"4","menu_name":"Analytics","parent_menu_id":"0","menu_key":"analytics","list_order":"3","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"5","menu_name":"Bulk Working","parent_menu_id":"0","menu_key":"bulk_working","list_order":"4","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"6","menu_name":"Data Management","parent_menu_id":"0","menu_key":"data_management","list_order":"5","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"7","menu_name":"Setting","parent_menu_id":"0","menu_key":"setting","list_order":"6","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"8","menu_name":"List","parent_menu_id":"1","menu_key":"list","list_order":"1","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"9","menu_name":"Review","parent_menu_id":"1","menu_key":"review","list_order":"2","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"10","menu_name":"Mailing","parent_menu_id":"1","menu_key":"mailing","list_order":"3","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"11","menu_name":"Awards","parent_menu_id":"1","menu_key":"award","list_order":"4","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"12","menu_name":"News Manager","parent_menu_id":"2","menu_key":"news_manager","list_order":"1","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"13","menu_name":"Tag","parent_menu_id":"3","menu_key":"tag","list_order":"1","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"14","menu_name":"Agency","parent_menu_id":"3","menu_key":"agency","list_order":"2","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"15","menu_name":"Site Report","parent_menu_id":"4","menu_key":"site_report","list_order":"1","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"16","menu_name":"Bulk Report","parent_menu_id":"4","menu_key":"bulk_report","list_order":"2","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"17","menu_name":"Worklist","parent_menu_id":"5","menu_key":"worklist","list_order":"1","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"18","menu_name":"Import","parent_menu_id":"5","menu_key":"import","list_order":"2","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"19","menu_name":"Export","parent_menu_id":"5","menu_key":"export","list_order":"3","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"20","menu_name":"Priority","parent_menu_id":"6","menu_key":"priority","list_order":"1","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"21","menu_name":"Front Lists","parent_menu_id":"7","menu_key":"front_lists","list_order":"1","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null},
    {"id":"22","menu_name":"User Management","parent_menu_id":"7","menu_key":"user_management","list_order":"2","status":"active","created_at":"2023-03-03 15:47:37","created_by":null,"updated_at":null,"updated_by":null}
    ]
    await queryInterface.bulkInsert("edb_site_menus", siteMenus, {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    await queryInterface.bulkDelete("edb_site_menus", null, { truncate: true });
  }
};
