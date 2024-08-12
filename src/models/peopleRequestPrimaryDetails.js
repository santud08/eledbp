import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class peopleRequestPrimaryDetails extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }

  peopleRequestPrimaryDetails.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      relation_id: DataTypes.BIGINT,
      people_id: DataTypes.BIGINT,
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      known_for: DataTypes.STRING,
      gender: DataTypes.STRING,
      birth_date: DataTypes.DATE,
      poster: DataTypes.STRING,
      kobis_id: DataTypes.BIGINT,
      imdb_id: DataTypes.STRING,
      tmdb_id: DataTypes.BIGINT,
      tiving_id: DataTypes.STRING,
      official_site: DataTypes.STRING,
      facebook_link: DataTypes.STRING,
      instagram_link: DataTypes.STRING,
      twitter_link: DataTypes.STRING,
      views: DataTypes.INTEGER,
      allow_update: DataTypes.TINYINT,
      fully_synced: DataTypes.TINYINT,
      popularity: DataTypes.INTEGER,
      death_date: DataTypes.DATE,
      adult: DataTypes.TINYINT,
      search_keyword_details: DataTypes.JSON,
      news_keyword_details: DataTypes.JSON,
      country_details: DataTypes.JSON,
      job_details: DataTypes.JSON,
      request_status: DataTypes.STRING,
      site_language: DataTypes.STRING,
      status: DataTypes.ENUM("active", "deleted"),
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
      odk_id: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "peopleRequestPrimaryDetails",
      tableName: TABLES.PEOPLE_REQUEST_PRIMARY_DETAILS_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return peopleRequestPrimaryDetails;
};
