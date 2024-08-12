import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class peopleRequestMedia extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  peopleRequestMedia.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      request_id: DataTypes.BIGINT,
      background_image_details: DataTypes.JSON,
      image_details: DataTypes.JSON,
      poster_image_details: DataTypes.JSON,
      video_details: DataTypes.JSON,
      status: DataTypes.ENUM("active", "deleted"),
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "peopleRequestMedia",
      tableName: TABLES.PEOPLE_REQUEST_MEDIA_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return peopleRequestMedia;
};
