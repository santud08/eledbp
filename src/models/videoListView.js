import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class videoListView extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {}
  }
  videoListView.init(
    {
      primary_id: DataTypes.INTEGER,
      type: DataTypes.STRING,
      item_id: DataTypes.BIGINT,
      name: DataTypes.STRING,
      link: DataTypes.STRING,
      user_id: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "videoListView",
      tableName: TABLES.VIDEOLIST_VIEW_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return videoListView;
};
