import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class usersActivity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ video }) {
      // define association here
      this.belongsTo(video, {
        foreignKey: "item_id",
        constraints: true,
      });
    }
  }
  usersActivity.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: DataTypes.INTEGER,
      user_session_id: DataTypes.STRING,
      item_id: DataTypes.BIGINT,
      type: DataTypes.ENUM("title", "people", "video"),
      event_type: DataTypes.ENUM("view", "download", "add", "update", "delete"),
      details: DataTypes.JSON,
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "usersActivity",
      tableName: TABLES.USERS_ACTIVITY_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return usersActivity;
};
