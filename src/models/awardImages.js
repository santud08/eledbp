import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class awardImages extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  awardImages.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      original_name: DataTypes.STRING,
      file_name: DataTypes.STRING,
      url: DataTypes.STRING,
      path: DataTypes.STRING,
      file_size: DataTypes.STRING,
      mime_type: DataTypes.STRING,
      file_extension: DataTypes.STRING,
      award_id: DataTypes.BIGINT,
      list_order: DataTypes.INTEGER,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "awardImages",
      tableName: TABLES.AWARD_IMAGE_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return awardImages;
};
