import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class titleRequestEpisodeDetails extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  titleRequestEpisodeDetails.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      request_id: DataTypes.BIGINT,
      request_season_id: DataTypes.BIGINT,
      season_id: DataTypes.BIGINT,
      episode_details: DataTypes.JSON,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      status: DataTypes.STRING,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "titleRequestEpisodeDetails",
      tableName: TABLES.TITLE_REQUEST_EPISODE_DETAILS,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return titleRequestEpisodeDetails;
};
