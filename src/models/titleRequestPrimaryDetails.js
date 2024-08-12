import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class titleRequestPrimaryDetails extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  titleRequestPrimaryDetails.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: DataTypes.STRING,
      relation_id: DataTypes.BIGINT,
      name: DataTypes.STRING,
      title_id: DataTypes.BIGINT,
      aka: DataTypes.STRING,
      type: DataTypes.STRING,
      tmdb_vote_average: DataTypes.DECIMAL(3, 1),
      release_date: DataTypes.DATE,
      release_date_to: DataTypes.DATE,
      year: DataTypes.SMALLINT,
      description: DataTypes.TEXT,
      tagline: DataTypes.STRING,
      backdrop: DataTypes.STRING,
      runtime: DataTypes.INTEGER,
      budget: DataTypes.BIGINT,
      revenue: DataTypes.BIGINT,
      views: DataTypes.BIGINT,
      popularity: DataTypes.INTEGER,
      imdb_id: DataTypes.STRING,
      tmdb_id: DataTypes.BIGINT,
      kobis_id: DataTypes.STRING,
      tiving_id: DataTypes.STRING,
      season_count: DataTypes.INTEGER,
      fully_synced: DataTypes.TINYINT,
      allow_update: DataTypes.TINYINT,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      language: DataTypes.STRING,
      original_title: DataTypes.STRING,
      affiliate_link: DataTypes.STRING,
      tmdb_vote_count: DataTypes.INTEGER,
      certification: DataTypes.STRING,
      episode_count: DataTypes.INTEGER,
      series_ended: DataTypes.TINYINT,
      is_series: DataTypes.TINYINT,
      local_vote_average: DataTypes.DECIMAL(3, 1),
      show_videos: DataTypes.TINYINT,
      adult: DataTypes.TINYINT,
      series_round: DataTypes.INTEGER,
      crank_in: DataTypes.INTEGER,
      crank_up: DataTypes.INTEGER,
      is_rerelease: DataTypes.TINYINT,
      is_cookie: DataTypes.TINYINT,
      cookie_num: DataTypes.INTEGER,
      plot_summary: DataTypes.TEXT,
      synopsis: DataTypes.TEXT,
      vod_release_date: DataTypes.DATE,
      format: DataTypes.TINYINT,
      title_status: DataTypes.STRING,
      footfalls: DataTypes.INTEGER,
      rating: DataTypes.DECIMAL(3, 2),
      record_status: DataTypes.STRING,
      site_language: DataTypes.STRING,
      user_id: DataTypes.INTEGER,
      re_release_details: DataTypes.JSON,
      country_details: DataTypes.JSON,
      original_work_details: DataTypes.JSON,
      watch_on_stream_details: DataTypes.JSON,
      watch_on_rent_details: DataTypes.JSON,
      watch_on_buy_details: DataTypes.JSON,
      connection_details: DataTypes.JSON,
      series_details: DataTypes.JSON,
      search_keyword_details: DataTypes.JSON,
      news_keyword_details: DataTypes.JSON,
      request_status: DataTypes.STRING,
      status: DataTypes.STRING,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
      odk_id: DataTypes.STRING,
      naver_id: DataTypes.BIGINT,
      kakao_id: DataTypes.BIGINT,
      weekly_telecast_details: DataTypes.JSON,
    },
    {
      sequelize,
      modelName: "titleRequestPrimaryDetails",
      tableName: TABLES.TITLE_REQUEST_PRIMARY_DETAILS_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return titleRequestPrimaryDetails;
};
