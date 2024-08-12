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
    const roleList = [
      {
        id: "1",
        role_name: "guests",
        legacy_permissions: null,
        defaults: "0",
        guests: "1",
        status: "active",
        created_at: "2022-09-21 10:30:55",
        updated_at: null,
        created_by: null,
        updated_by: null,
      },
      {
        id: "2",
        role_name: "users",
        legacy_permissions: null,
        defaults: "1",
        guests: "0",
        status: "active",
        created_at: "2022-09-21 10:30:55",
        updated_at: null,
        created_by: null,
        updated_by: null,
      },
      {
        id: "3",
        role_name: "admin",
        legacy_permissions: null,
        defaults: "1",
        guests: "0",
        status: "active",
        created_at: "2022-09-21 10:30:55",
        updated_at: null,
        created_by: null,
        updated_by: null,
      },
      {
        id: "4",
        role_name: "super_admin",
        legacy_permissions: null,
        defaults: "1",
        guests: "0",
        status: "active",
        created_at: "2022-09-21 10:30:55",
        updated_at: null,
        created_by: null,
        updated_by: null,
      },
      {
        id: "5",
        role_name: "editor",
        legacy_permissions: null,
        defaults: "1",
        guests: "0",
        status: "active",
        created_at: "2022-09-21 10:30:55",
        updated_at: null,
        created_by: null,
        updated_by: null,
      },
    ];
    await queryInterface.bulkInsert("edb_roles", roleList, {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("edb_roles", null, { truncate: true });
  },
};
