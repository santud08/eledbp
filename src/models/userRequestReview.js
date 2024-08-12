import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class userRequestReview extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  userRequestReview.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      draft_request_id: DataTypes.BIGINT,
      review_for: DataTypes.ENUM("movie", "tv", "webtoons", "people"),
      review_id: DataTypes.BIGINT,
      request_status: DataTypes.ENUM("pending", "completed"),
      editor_id: DataTypes.INTEGER,
      note: DataTypes.TEXT,
      site_language: DataTypes.STRING,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "userRequestReview",
      tableName: TABLES.USER_REQUEST_REVIEW_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return userRequestReview;
};
