import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class titleRequestTag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  titleRequestTag.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      request_id: DataTypes.BIGINT,
      genre_details: DataTypes.JSON,
      tag_details: DataTypes.JSON,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      status: DataTypes.STRING,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "titleRequestTag",
      tableName: TABLES.TITLE_REQUEST_TAG,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return titleRequestTag;
};
