import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class imageListView extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {}
  }
  imageListView.init(
    {
      primary_id: DataTypes.INTEGER,
      type: DataTypes.STRING,
      item_id: DataTypes.BIGINT,
      file_name: DataTypes.STRING,
      original_name: DataTypes.STRING,
      path: DataTypes.STRING,
      image_category: DataTypes.STRING,
      user_id: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "imageListView",
      tableName: TABLES.IMAGE_VIEW_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return imageListView;
};
