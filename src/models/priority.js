import { Model } from "sequelize";
import { TABLES } from "../utils/constants.js";

export default (sequelize, DataTypes) => {
  class priority extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  priority.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      field_name: DataTypes.STRING,
      original_field_name: DataTypes.STRING,
      "11db_field_priority": DataTypes.INTEGER,
      tmdb_field_priority: DataTypes.INTEGER,
      kobis_field_priority: DataTypes.INTEGER,
      tbl_name: DataTypes.STRING,
      type: DataTypes.ENUM("movie", "tv", "webtoons", "people"),
      status: DataTypes.ENUM("active", "deleted"),
      created_by: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_by: DataTypes.INTEGER,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "priority",
      tableName: TABLES.PRIORITY_SETTINGS_TABLE,
      // don't add the timestamp attributes (updatedAt, createdAt)
      timestamps: false,
      createdAt: false,
      updatedAt: false,
    },
  );
  return priority;
};
