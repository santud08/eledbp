import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class worklistView extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {}
  }
  worklistView.init(
    {
      primary_id: DataTypes.INTEGER,
      type: DataTypes.STRING,
      title: DataTypes.STRING,
      unique_id: DataTypes.STRING,
      modified_date: DataTypes.DATE,
      tiving_id: DataTypes.STRING,
      language: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "worklistView",
      tableName: TABLES.WORKLIST_VIEW_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return worklistView;
};
