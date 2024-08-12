import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class editListView extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  editListView.init(
    {
      u_id: DataTypes.STRING,
      item_id: DataTypes.BIGINT,
      editor_id: DataTypes.BIGINT,
      user_id: DataTypes.INTEGER,
      email_id: DataTypes.STRING,
      editor_name: DataTypes.STRING,
      edit_id: DataTypes.BIGINT,
      operation: DataTypes.STRING,
      type: DataTypes.STRING,
      title_status: DataTypes.STRING,
      item_status: DataTypes.STRING,
      title_name: DataTypes.STRING,
      language: DataTypes.STRING,
      modified_date: DataTypes.DATE,
      registration_date: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "editListView",
      tableName: TABLES.EDITLIST_VIEW_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return editListView;
};
