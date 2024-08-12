import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class titleRequestSeasonDetails extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  titleRequestSeasonDetails.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      request_id: DataTypes.BIGINT,
      season_id: DataTypes.BIGINT,
      season_no: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      season_details: DataTypes.JSON,
      season_watch_on_stream_details: DataTypes.JSON,
      season_watch_on_rent_details: DataTypes.JSON,
      season_watch_on_buy_details: DataTypes.JSON,
      season_connection_details: DataTypes.JSON,
      season_search_keyword_details: DataTypes.JSON,
      season_news_search_keyword_details: DataTypes.JSON,
      season_channel_details: DataTypes.JSON,
      read_list_details: DataTypes.JSON,
      status: DataTypes.STRING,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "titleRequestSeasonDetails",
      tableName: TABLES.TITLE_REQUEST_SEASON_DETAILS,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return titleRequestSeasonDetails;
};
