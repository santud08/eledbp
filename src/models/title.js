import { Model } from "sequelize";
import { TABLES, SOUTH_KOREA_COUNTRY_ID } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class title extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({
      titleTranslation,
      titleImage,
      creditable,
      tagGable,
      community,
      season,
      titleCountries,
      titleWatchOn,
      titleReRelease,
      video,
      titleKeyword,
      edit,
      weeklyTelecast,
    }) {
      // define association here
      this.hasMany(titleTranslation, {
        foreignKey: "title_id",
        constraints: true,
      });

      this.hasMany(titleImage, {
        foreignKey: "title_id",
        constraints: true,
      });

      this.hasMany(titleImage, {
        as: "titleImageBg",
        foreignKey: "title_id",
        constraints: true,
      });

      this.hasMany(creditable, {
        foreignKey: "creditable_id",
        constraints: true,
      });
      this.hasMany(tagGable, {
        foreignKey: "taggable_id",
        constraints: true,
      });

      this.hasMany(community, {
        foreignKey: "commentable_id",
        constraints: true,
      });

      this.hasMany(season, {
        foreignKey: "title_id",
        constraints: true,
      });
      this.hasMany(titleCountries, {
        foreignKey: "title_id",
        constraints: true,
      });

      this.hasMany(titleWatchOn, {
        foreignKey: "title_id",
        constraints: true,
      });

      this.hasMany(titleReRelease, {
        foreignKey: "title_id",
        constraints: true,
      });

      this.hasMany(video, {
        foreignKey: "title_id",
        scope: { "$video.video_for$": "title" },
        constraints: true,
      });

      this.hasOne(titleImage, {
        as: "titleImageOne",
        foreignKey: "title_id",
        constraints: true,
      });

      this.hasOne(titleTranslation, {
        as: "titleTranslationOne",
        foreignKey: "title_id",
        constraints: true,
      });

      this.hasMany(titleKeyword, {
        foreignKey: "title_id",
        constraints: true,
      });

      this.hasOne(titleCountries, {
        as: "kotitleCountries",
        foreignKey: "title_id",
        scope: { country_id: SOUTH_KOREA_COUNTRY_ID },
        constraints: true,
      });

      this.hasMany(edit, {
        foreignKey: "editable_id",
        constraints: true,
      });

      this.hasMany(weeklyTelecast, {
        foreignKey: "title_id",
        constraints: true,
      });

      this.hasOne(titleTranslation, {
        as: "titleTranslationOnel",
        foreignKey: "title_id",
        constraints: true,
      });
    }
  }
  title.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: DataTypes.STRING,
      type: DataTypes.STRING,
      tmdb_vote_average: DataTypes.DECIMAL(3, 1),
      release_date: DataTypes.DATEONLY,
      release_date_to: DataTypes.DATEONLY,
      year: DataTypes.SMALLINT,
      backdrop: DataTypes.STRING,
      runtime: DataTypes.INTEGER,
      budget: DataTypes.BIGINT,
      revenue: DataTypes.BIGINT,
      views: DataTypes.BIGINT,
      popularity: DataTypes.INTEGER,
      tiving_id: DataTypes.STRING,
      imdb_id: DataTypes.STRING,
      tmdb_id: DataTypes.BIGINT,
      kobis_id: DataTypes.BIGINT,
      season_count: DataTypes.INTEGER,
      fully_synced: DataTypes.TINYINT,
      allow_update: DataTypes.TINYINT,
      language: DataTypes.STRING,
      country: DataTypes.STRING,
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
      vod_release_date: DataTypes.DATE,
      format: DataTypes.TINYINT,
      title_status: DataTypes.STRING,
      footfalls: DataTypes.INTEGER,
      rating: DataTypes.DECIMAL(3, 2),
      record_status: DataTypes.STRING,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
      odk_id: DataTypes.STRING,
      avg_rating: DataTypes.FLOAT,
      calculate_popularity: DataTypes.INTEGER,
      naver_id: DataTypes.BIGINT,
      kakao_id: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: "title",
      tableName: TABLES.TITLE_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return title;
};
