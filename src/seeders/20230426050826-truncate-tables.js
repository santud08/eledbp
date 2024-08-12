"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     *  queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    await Promise.all([
      queryInterface.bulkDelete("edb_users", null, { truncate: true }),
      queryInterface.bulkDelete("edb_user_role", null, { truncate: true }),
      queryInterface.bulkDelete("edb_css_themes", null, { truncate: true }),
      queryInterface.bulkDelete("edb_people", null, { truncate: true }),
      queryInterface.bulkDelete("edb_people_translations", null, { truncate: true }),
      queryInterface.bulkDelete("edb_community", null, { truncate: true }),
      queryInterface.bulkDelete("edb_community_likes", null, { truncate: true }),
      queryInterface.bulkDelete("edb_people_keywords", null, { truncate: true }),
      queryInterface.bulkDelete("edb_people_countries", null, { truncate: true }),
      queryInterface.bulkDelete("edb_people_jobs", null, { truncate: true }),
      queryInterface.bulkDelete("edb_people_images", null, { truncate: true }),
      queryInterface.bulkDelete("edb_people_videos", null, { truncate: true }),
      queryInterface.bulkDelete("edb_people_request_for_media", null, { truncate: true }),
      queryInterface.bulkDelete("edb_people_request", null, { truncate: true }),
      queryInterface.bulkDelete("edb_users_activity", null, { truncate: true }),
      queryInterface.bulkDelete("edb_user_request_for_review", null, { truncate: true }),
      queryInterface.bulkDelete("edb_user_role_permission_mapping", null, { truncate: true }),
      queryInterface.bulkDelete("edb_user_points", null, { truncate: true }),
      queryInterface.bulkDelete("edb_titles", null, { truncate: true }),
      queryInterface.bulkDelete("edb_title_metas", null, { truncate: true }),
      queryInterface.bulkDelete("edb_title_translations", null, { truncate: true }),
      queryInterface.bulkDelete("edb_seasons", null, { truncate: true }),
      queryInterface.bulkDelete("edb_related_articles", null, { truncate: true }),
      queryInterface.bulkDelete("edb_links", null, { truncate: true }),
      queryInterface.bulkDelete("edb_episodes", null, { truncate: true }),
      queryInterface.bulkDelete("edb_box_offices", null, { truncate: true }),
      queryInterface.bulkDelete("edb_bo_files", null, { truncate: true }),
      queryInterface.bulkDelete("edb_bo_summaries", null, { truncate: true }),
      queryInterface.bulkDelete("edb_titles_re_release", null, { truncate: true }),
      queryInterface.bulkDelete("edb_original_works", null, { truncate: true }),
      queryInterface.bulkDelete("edb_related_titles", null, { truncate: true }),
      queryInterface.bulkDelete("edb_related_series_titles", null, { truncate: true }),
      queryInterface.bulkDelete("edb_titles_watch_on", null, { truncate: true }),
      queryInterface.bulkDelete("edb_titles_images", null, { truncate: true }),
      queryInterface.bulkDelete("edb_creditables", null, { truncate: true }),
      queryInterface.bulkDelete("edb_title_countries", null, { truncate: true }),
      queryInterface.bulkDelete("edb_title_request", null, { truncate: true }),
      queryInterface.bulkDelete("edb_title_request_for_media", null, { truncate: true }),
      queryInterface.bulkDelete("edb_title_request_for_credit", null, { truncate: true }),
      queryInterface.bulkDelete("edb_title_request_for_tag", null, { truncate: true }),
      queryInterface.bulkDelete("edb_title_request_for_season", null, { truncate: true }),
      queryInterface.bulkDelete("edb_title_keywords", null, { truncate: true }),
      queryInterface.bulkDelete("edb_title_request_for_episode", null, { truncate: true }),
      queryInterface.bulkDelete("edb_titles_channel_list", null, { truncate: true }),
      queryInterface.bulkDelete("edb_season_translations", null, { truncate: true }),
      queryInterface.bulkDelete("edb_episode_translations", null, { truncate: true }),
      queryInterface.bulkDelete("edb_videos", null, { truncate: true }),
      queryInterface.bulkDelete("edb_video_captions", null, { truncate: true }),
      queryInterface.bulkDelete("edb_video_ratings", null, { truncate: true }),
      queryInterface.bulkDelete("edb_video_reports", null, { truncate: true }),
      queryInterface.bulkDelete("edb_awards", null, { truncate: true }),
      queryInterface.bulkDelete("edb_award_translations", null, { truncate: true }),
      queryInterface.bulkDelete("edb_award_images", null, { truncate: true }),
      queryInterface.bulkDelete("edb_award_sectors", null, { truncate: true }),
      queryInterface.bulkDelete("edb_award_sector_translations", null, { truncate: true }),
      queryInterface.bulkDelete("edb_award_rounds", null, { truncate: true }),
      queryInterface.bulkDelete("edb_award_nominees", null, { truncate: true }),
      queryInterface.bulkDelete("edb_tags", null, { truncate: true }),
      queryInterface.bulkDelete("edb_tag_translations", null, { truncate: true }),
      queryInterface.bulkDelete("edb_taggables", null, { truncate: true }),
      queryInterface.bulkDelete("edb_tag_category", null, { truncate: true }),
      queryInterface.bulkDelete("edb_tag_category_translations", null, { truncate: true }),
      queryInterface.bulkDelete("edb_notifications", null, { truncate: true }),
      queryInterface.bulkDelete("edb_notification_users_mapping", null, { truncate: true }),
      queryInterface.bulkDelete("edb_mail_templates", null, { truncate: true }),
      queryInterface.bulkDelete("edb_localizations", null, { truncate: true }),
      queryInterface.bulkDelete("edb_jobs", null, { truncate: true }),
      queryInterface.bulkDelete("edb_guides", null, { truncate: true }),
      queryInterface.bulkDelete("edb_custom_pages", null, { truncate: true }),
      queryInterface.bulkDelete("edb_contact_us", null, { truncate: true }),
      queryInterface.bulkDelete("edb_agency", null, { truncate: true }),
      queryInterface.bulkDelete("edb_agency_translation", null, { truncate: true }),
      queryInterface.bulkDelete("edb_agency_managers", null, { truncate: true }),
      queryInterface.bulkDelete("edb_agency_managers_translation", null, { truncate: true }),
      queryInterface.bulkDelete("edb_agency_manager_artists", null, { truncate: true }),
      queryInterface.bulkDelete("edb_news", null, { truncate: true }),
      queryInterface.bulkDelete("edb_ratings", null, { truncate: true }),
      queryInterface.bulkDelete("edb_favourites", null, { truncate: true }),
      queryInterface.bulkDelete("edb_top_news_mapping", null, { truncate: true }),
      queryInterface.bulkDelete("edb_imported_data_logs", null, { truncate: true }),
      queryInterface.bulkDelete("edb_imported_files", null, { truncate: true }),
      queryInterface.bulkDelete("edb_exported_files", null, { truncate: true }),
      queryInterface.bulkDelete("edb_shared", null, { truncate: true }),
      queryInterface.bulkDelete("edb_message", null, { truncate: true }),
      queryInterface.bulkDelete("edb_message_conversation", null, { truncate: true }),
      queryInterface.bulkDelete("edb_message_conversation_recipients", null, { truncate: true }),
      queryInterface.bulkDelete("edb_settings", null, { truncate: true }),
      queryInterface.bulkDelete("edb_roles", null, { truncate: true }),
      queryInterface.bulkDelete("edb_permissions", null, { truncate: true }),
      queryInterface.bulkDelete("edb_ott_service_provider", null, { truncate: true }),
      queryInterface.bulkDelete("edb_countries", null, { truncate: true }),
      queryInterface.bulkDelete("edb_countries_translations", null, { truncate: true }),
      queryInterface.bulkDelete("edb_departments", null, { truncate: true }),
      queryInterface.bulkDelete("edb_departments_translations", null, { truncate: true }),
      queryInterface.bulkDelete("edb_department_jobs", null, { truncate: true }),
      queryInterface.bulkDelete("edb_department_jobs_translations", null, { truncate: true }),
      queryInterface.bulkDelete("edb_tv_networks", null, { truncate: true }),
      queryInterface.bulkDelete("edb_priority_settings", null, { truncate: true }),
      queryInterface.bulkDelete("edb_level", null, { truncate: true }),
      queryInterface.bulkDelete("edb_cities", null, { truncate: true }),
      queryInterface.bulkDelete("edb_cities_translations", null, { truncate: true }),
      queryInterface.bulkDelete("edb_points", null, { truncate: true }),
      queryInterface.bulkDelete("edb_site_menus", null, { truncate: true }),
      queryInterface.bulkDelete("edb_user_role_permission_mapping", null, { truncate: true }),
    ])
      .then((results) => {
        console.log("Truncated table successfully");
      })
      .catch((err) => {
        console.log(err);
      });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     *  queryInterface.bulkDelete('People', null, {});
     */
    //  queryInterface.bulkInsert(
    //   "edb_countries",
    //   [
    //     {
    //       country_name: "Andorra",
    //       country_code: "AD",
    //       status: "active",
    //       created_at: "2022-09-23 10:39:16",
    //       updated_at: null,
    //     },
    //   ],
    //   {},
    // );
  },
};
